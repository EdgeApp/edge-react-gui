/**
 * Reads route declarations out of `src/cli/engine/routes/*.ts`.
 *
 * The JSDoc above each `route(…)` is the prose; the `query`, `body` and
 * `returns` cleaners are the shapes, resolved through the TypeScript checker
 * so the documented type is literally the validator's type.
 */
import fs from 'fs'
import path from 'path'
import ts from 'typescript'

// The shared error-code groups, read rather than re-stated, so a group
// gaining a code reaches the published reference without anyone having to
// remember this file. `errorGroups.ts` has no imports, so nothing is dragged
// in by reading it.
import * as errorGroups from '../src/cli/engine/errorGroups'

const ROOT = path.resolve(__dirname, '..')
const ROUTES = path.join(ROOT, 'src/cli/engine/routes')

export interface ExtractedField {
  name: string
  type: string
  optional: boolean
  doc?: string
}

export interface ExtractedCliFlag {
  /** Flag name as typed, without the leading dashes. */
  name: string
  /** Request field it carries. */
  maps: string
  repeat?: boolean
  doc?: string
}

export interface ExtractedCliExtra {
  name: string
  kind: string
  required?: boolean
  requiredWith?: string
  doc?: string
}

export interface ExtractedCli {
  command: string
  positional?: string
  bodyFlag?: string
  flags: ExtractedCliFlag[]
  extra: ExtractedCliExtra[]
  notes?: string
  /**
   * This binding's own one-line summary.
   *
   * Two commands on one route otherwise share the route's JSDoc first line,
   * so `spend` and `spend-max` were both published as "Send funds." — the
   * only duplicated help text in the generated table.
   */
  summary?: string
  custom: boolean
  /** Fields sent at fixed values. */
  preset: Record<string, boolean>
  exits?: Record<string, number>
}

export interface ExtractedRoute {
  id: string
  file: string
  summary: string
  description?: string
  core: string | null
  coreNote?: string
  method: string
  routePath: string
  /** Fields core has no parameter for, mapped to the reason they exist. */
  coreExtra: Record<string, string>
  /** The `path` as written, before the positional is appended. */
  declaredPath: string
  /** Field the path carries as its final segment, or null. */
  pathPositional: string | null
  cli: ExtractedCli | null
  /** Additional commands this route backs, e.g. `spend-max`. */
  cliExtra: ExtractedCli[]
  /** Path parameters, in order of appearance. */
  pathParams: string[]
  /** Source file basename, which is also the documentation group. */
  group: string
  isStream: boolean
  errors: string[]
  notes: string[]
  bodyNote?: string
  returnsDoc?: string
  params: Record<string, string>
  query?: ExtractedField[]
  body?: ExtractedField[]
  returns?: ExtractedField[]
  returnsProse?: string
  returnsType?: string
}

const FORMAT = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias

function sourceFiles(): string[] {
  return fs
    .readdirSync(ROUTES)
    .filter(n => n.endsWith('.ts') && n !== 'index.ts' && n !== 'helpers.ts')
    .map(n => path.join(ROUTES, n))
}

/** Literal value of a property in the `route({…})` object. */
function literal(obj: ts.ObjectLiteralExpression, key: string): string | null {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    if (prop.name.getText() !== key) continue
    const init = prop.initializer
    if (ts.isStringLiteral(init)) return init.text
    if (init.kind === ts.SyntaxKind.NullKeyword) return null
    return init.getText()
  }
  return undefined as unknown as string
}

function arrayLiteral(obj: ts.ObjectLiteralExpression, key: string): string[] {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    if (prop.name.getText() !== key) continue
    return stringArray(prop.initializer)
  }
  return []
}

/**
 * A declared string array, with the shared error groups expanded.
 *
 * `errors: WALLET_ERRORS` and `errors: ['BAD_REQUEST', ...WALLET_ERRORS]` are
 * exactly what `docs/api/README.md` tells every contributor to write, and the
 * old reading — bail on a non-literal, then filter the elements down to
 * string literals — turned the first into nothing and the second into
 * `['BAD_REQUEST']`. 46 codes across 16 routes were therefore missing from
 * the reference, the OpenAPI document and `edge-cli help`, including all five
 * `OBJECT_*` codes on `sign-tx`, `broadcast-tx` and `save-tx`, where
 * `OBJECT_EXPIRED` is the one a caller holding a five-minute handle has to
 * branch on. Following the documented convention was what made a route's
 * errors disappear, and no gate could see it because the codes were already
 * gone before `verifyApiDocs` looked.
 *
 * An unrecognised form throws rather than extracting nothing, so the next
 * shape nobody anticipated fails the build instead of silently shrinking the
 * published surface.
 */
function stringArray(node: ts.Expression): string[] {
  if (ts.isIdentifier(node)) return errorGroup(node.text)
  if (!ts.isArrayLiteralExpression(node)) {
    throw new Error(
      `Cannot extract "${node.getText()}": expected a string array, a shared ` +
        `group from src/cli/engine/errorGroups.ts, or a mix of the two.`
    )
  }
  const out: string[] = []
  for (const element of node.elements) {
    if (ts.isStringLiteral(element)) {
      out.push(element.text)
    } else if (
      ts.isSpreadElement(element) &&
      ts.isIdentifier(element.expression)
    ) {
      out.push(...errorGroup(element.expression.text))
    } else {
      throw new Error(
        `Cannot extract array element "${element.getText()}": expected a ` +
          `string literal or a spread of a shared group.`
      )
    }
  }
  return out
}

/**
 * A route's published error codes.
 *
 * `SESSION_ERRORS` is added to every session-scoped route rather than
 * restated on each of them: the two codes apply uniformly to anything under
 * `/account/{sessionId}/`, and `errorGroups.ts` says itself that the group
 * "had no consumer at all" — so no session route documented the two failures
 * a caller is most likely to meet, which is what the `unpublished error
 * group` gate now refuses. Deriving it from the path cannot drift as routes
 * are added.
 */
function routeErrors(
  arg: ts.ObjectLiteralExpression,
  routePath: string
): string[] {
  const declared = arrayLiteral(arg, 'errors')
  if (!routePath.includes('{sessionId}')) return declared
  const out = [...declared]
  for (const code of errorGroup('SESSION_ERRORS')) {
    if (!out.includes(code)) out.push(code)
  }
  return out
}

/** One shared group's codes, by the name a route refers to it by. */
function errorGroup(name: string): string[] {
  const group = (errorGroups as unknown as Record<string, unknown>)[name]
  if (!Array.isArray(group)) {
    throw new Error(
      `Unknown error group "${name}". Shared groups live in ` +
        `src/cli/engine/errorGroups.ts and must be exported as string arrays.`
    )
  }
  return group.map(String)
}

function propNode(
  obj: ts.ObjectLiteralExpression,
  key: string
): ts.Expression | undefined {
  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop) && prop.name.getText() === key) {
      return prop.initializer
    }
  }
  return undefined
}

/** Expand a cleaner's resolved output type into documented fields. */
/**
 * A type as text, with the members of a string-literal union sorted.
 *
 * The checker's own order for a union is an implementation detail — it
 * changed when this generator started using the repo's compiler options
 * instead of six hand-written ones — and these artifacts are committed, so
 * an arbitrary order means a diff on every toolchain change. Sorted, the
 * output depends only on the declaration.
 */
function stableTypeText(text: string): string {
  const parts = text.split(' | ').map(p => p.trim())
  if (parts.length < 2) return text
  const undefinedLast = parts.filter(p => p !== 'undefined')
  if (!undefinedLast.every(p => /^(['"]).*\1$/.test(p))) return text
  const sorted = [...undefinedLast].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
  if (undefinedLast.length !== parts.length) sorted.push('undefined')
  return sorted.join(' | ')
}

function fieldsOf(
  checker: ts.TypeChecker,
  node: ts.Expression
): { fields: ExtractedField[]; type: string } {
  const cleanerType = checker.getTypeAtLocation(node)
  const call = cleanerType.getCallSignatures()[0]
  if (call == null) {
    return {
      fields: [],
      type: stableTypeText(checker.typeToString(cleanerType, node, FORMAT))
    }
  }
  const out = checker.getReturnTypeOfSignature(call)
  const typeText = stableTypeText(checker.typeToString(out, node, FORMAT))
  // A primitive or `unknown` has no fields of its own — asking for its
  // properties yields the prototype's, which are not part of the API.
  const isObjectLike =
    (out.flags & ts.TypeFlags.Object) !== 0 && !typeText.endsWith('[]')
  const fields = (isObjectLike ? checker.getPropertiesOfType(out) : []).map(
    prop => {
      const t = checker.getTypeOfSymbolAtLocation(prop, node)
      let text = stableTypeText(checker.typeToString(t, node, FORMAT))
      // Cleaners type optional fields as `T | undefined`; render them as `T?`.
      const optional =
        (prop.flags & ts.SymbolFlags.Optional) !== 0 ||
        text.endsWith(' | undefined')
      text = text.replace(/ \| undefined$/, '')
      return { name: prop.name, type: text, optional }
    }
  )
  return { fields, type: typeText }
}

/**
 * Field prose written as `doc(cleaner, 'text')`.
 *
 * Read from the syntax tree rather than at runtime, because request cleaners
 * use `.withRest`, which discards the `.shape` a runtime walk would need.
 * Resolves a bare identifier (`returns: asSession`) back to its declaration,
 * so a shared response shape carries its prose once.
 */
function proseFor(
  checker: ts.TypeChecker,
  node: ts.Expression
): Record<string, string> {
  // Null-prototype, so a field called `toString` cannot pick up an inherited
  // member instead of its own prose.
  const out: Record<string, string> = Object.create(null)

  const objectOf = (expr: ts.Expression): ts.Expression | undefined => {
    // A shared field group is a bare object literal, not an asObject() call.
    if (ts.isObjectLiteralExpression(expr)) return expr
    // asObject({…}) / asObject({…}).withRest / a name pointing at either.
    let cur: ts.Expression = expr
    if (ts.isPropertyAccessExpression(cur)) cur = cur.expression
    if (ts.isIdentifier(cur)) {
      let sym = checker.getSymbolAtLocation(cur)
      // An import is an alias; follow it to the real declaration so a shared
      // response shape carries its prose from wherever it is defined.
      if (sym != null && (sym.flags & ts.SymbolFlags.Alias) !== 0) {
        sym = checker.getAliasedSymbol(sym)
      }
      const decl = sym?.declarations?.[0]
      if (
        decl != null &&
        ts.isVariableDeclaration(decl) &&
        decl.initializer != null
      ) {
        return objectOf(decl.initializer)
      }
      return undefined
    }
    if (ts.isCallExpression(cur)) {
      const callee = cur.expression.getText()
      if (callee === 'doc') return objectOf(cur.arguments[0])
      if (callee.startsWith('asObject')) return cur.arguments[0]
    }
    return undefined
  }

  // Resolve the prose argument: a literal, a `'a' + 'b'` concatenation, or a
  // named constant shared between fields.
  const proseText = (expr: ts.Expression): string | undefined => {
    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
      return expr.text
    }
    if (
      ts.isBinaryExpression(expr) &&
      expr.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      const left = proseText(expr.left)
      const right = proseText(expr.right)
      if (left != null && right != null) return left + right
    }
    if (ts.isIdentifier(expr)) {
      let sym = checker.getSymbolAtLocation(expr)
      if (sym != null && (sym.flags & ts.SymbolFlags.Alias) !== 0) {
        sym = checker.getAliasedSymbol(sym)
      }
      const decl = sym?.declarations?.[0]
      if (
        decl != null &&
        ts.isVariableDeclaration(decl) &&
        decl.initializer != null
      ) {
        return proseText(decl.initializer)
      }
    }
    return undefined
  }

  // A `doc(…)` call may sit inside a combinator — `asOptional(doc(…))` — so
  // search the expression rather than only looking at its outermost call.
  const findDoc = (expr: ts.Expression): string | undefined => {
    // A shared field cleaner is named: `walletId: asWalletId`, where
    // `asWalletId` is `doc(asString, '…')` exported from schemas. Follow the
    // name to its declaration so one description serves every route using it.
    if (ts.isIdentifier(expr)) {
      let sym = checker.getSymbolAtLocation(expr)
      if (sym != null && (sym.flags & ts.SymbolFlags.Alias) !== 0) {
        sym = checker.getAliasedSymbol(sym)
      }
      const decl = sym?.declarations?.[0]
      if (
        decl != null &&
        ts.isVariableDeclaration(decl) &&
        decl.initializer != null
      ) {
        return findDoc(decl.initializer)
      }
      return undefined
    }
    if (ts.isCallExpression(expr)) {
      if (expr.expression.getText() === 'doc' && expr.arguments.length > 1) {
        return proseText(expr.arguments[1])
      }
      for (const arg of expr.arguments) {
        const found = findDoc(arg)
        if (found != null) return found
      }
    }
    if (ts.isPropertyAccessExpression(expr)) return findDoc(expr.expression)
    return undefined
  }

  // Prose attached to the whole cleaner, for pass-through responses. Only the
  // outermost call counts: a nested field's prose is not the response's.
  let outer: ts.Expression = node
  if (ts.isPropertyAccessExpression(outer)) outer = outer.expression
  if (
    ts.isCallExpression(outer) &&
    outer.expression.getText() === 'doc' &&
    outer.arguments.length > 1
  ) {
    const whole = proseText(outer.arguments[1])
    if (whole != null) out[''] = whole
  }

  const shape = objectOf(node)
  if (shape == null || !ts.isObjectLiteralExpression(shape)) return out
  for (const prop of shape.properties) {
    if (ts.isSpreadAssignment(prop)) {
      // `...loginOptionFields` — the spread object carries prose too.
      Object.assign(out, proseFor(checker, prop.expression))
      continue
    }
    if (!ts.isPropertyAssignment(prop)) continue
    const found = findDoc(prop.initializer)
    if (found != null) out[prop.name.getText()] = found
  }
  return out
}

/** Read `{ key: 'text', … }` from a property, for `coreExtra`. */
function recordLiteral(
  arg: ts.ObjectLiteralExpression,
  key: string
): Record<string, string> {
  const out: Record<string, string> = {}
  const node = propNode(arg, key)
  if (node == null || !ts.isObjectLiteralExpression(node)) return out
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    const name = prop.name.getText().replace(/'/g, '')
    const init = prop.initializer
    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      out[name] = init.text
    } else {
      // A concatenation spanning lines.
      out[name] = init
        .getText()
        .replace(/'\s*\+\s*'/g, '')
        .replace(/^'|'$/g, '')
    }
  }
  return out
}

/** Parse the `cli` field: a bare command name, an object spec, or null. */
function parseCli(node: ts.Expression | undefined): ExtractedCli | null {
  if (node == null) return null
  if (node.kind === ts.SyntaxKind.NullKeyword) return null
  if (ts.isStringLiteral(node)) {
    return {
      command: node.text,
      flags: [],
      extra: [],
      custom: false,
      preset: {}
    }
  }
  if (!ts.isObjectLiteralExpression(node)) return null

  const str = (
    o: ts.ObjectLiteralExpression,
    key: string
  ): string | undefined => {
    for (const prop of o.properties) {
      if (!ts.isPropertyAssignment(prop)) continue
      if (prop.name.getText() !== key) continue
      if (ts.isStringLiteral(prop.initializer)) return prop.initializer.text
      if (ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
        return prop.initializer.text
      }
      // A concatenated string spanning lines.
      const text = prop.initializer.getText()
      const parts = [...text.matchAll(/'([^']*)'/g)].map(m => m[1])
      if (parts.length > 0) return parts.join('')
    }
    return undefined
  }
  const obj = (
    o: ts.ObjectLiteralExpression,
    key: string
  ): ts.ObjectLiteralExpression | undefined => {
    for (const prop of o.properties) {
      if (
        ts.isPropertyAssignment(prop) &&
        prop.name.getText() === key &&
        ts.isObjectLiteralExpression(prop.initializer)
      ) {
        return prop.initializer
      }
    }
    return undefined
  }

  const command = str(node, 'command') ?? ''
  const flags: ExtractedCliFlag[] = []
  const flagsObj = obj(node, 'flags')
  if (flagsObj != null) {
    for (const prop of flagsObj.properties) {
      if (!ts.isPropertyAssignment(prop)) continue
      const name = prop.name.getText().replace(/'/g, '')
      const spec = ts.isObjectLiteralExpression(prop.initializer)
        ? prop.initializer
        : undefined
      flags.push({
        name: kebab(name),
        maps: spec != null ? str(spec, 'maps') ?? name : name,
        repeat: spec != null ? /repeat:\s*true/.test(spec.getText()) : false,
        doc: spec != null ? str(spec, 'doc') : undefined
      })
    }
  }
  const extra: ExtractedCliExtra[] = []
  const extraObj = obj(node, 'extra')
  if (extraObj != null) {
    for (const prop of extraObj.properties) {
      if (!ts.isPropertyAssignment(prop)) continue
      const name = prop.name.getText().replace(/'/g, '')
      const spec = ts.isObjectLiteralExpression(prop.initializer)
        ? prop.initializer
        : undefined
      extra.push({
        name: kebab(name),
        kind: spec != null ? str(spec, 'kind') ?? 'string' : 'string',
        required:
          spec != null ? /required:\s*true/.test(spec.getText()) : false,
        requiredWith: spec != null ? str(spec, 'requiredWith') : undefined,
        doc: spec != null ? str(spec, 'doc') : undefined
      })
    }
  }
  return {
    command,
    positional: str(node, 'positional'),
    bodyFlag: str(node, 'bodyFlag'),
    flags,
    extra,
    custom: /custom:\s*true/.test(node.getText()),
    preset: (() => {
      const out: Record<string, boolean> = {}
      const o = obj(node, 'preset')
      if (o != null) {
        for (const prop of o.properties) {
          if (!ts.isPropertyAssignment(prop)) continue
          const v = prop.initializer.getText()
          if (v === 'true' || v === 'false') {
            out[prop.name.getText().replace(/'/g, '')] = v === 'true'
          }
        }
      }
      return out
    })(),
    notes: str(node, 'notes'),
    summary: str(node, 'summary')
  }
}

/** `cli` may be one command or several. */
function parseCliList(node: ts.Expression | undefined): ExtractedCli[] {
  if (node != null && ts.isArrayLiteralExpression(node)) {
    return node.elements
      .map(el => parseCli(el))
      .filter((c): c is ExtractedCli => c != null)
  }
  const one = parseCli(node)
  return one != null ? [one] : []
}

/** camelCase to kebab-case, the CLI's flag spelling. */
export function kebab(name: string): string {
  return name.replace(/[A-Z]/g, c => '-' + c.toLowerCase())
}

/** Split a JSDoc comment into prose and tags. */
function readJsDoc(node: ts.Node): {
  summary: string
  description?: string
  tags: Array<[string, string]>
} {
  const docs = (node as unknown as { jsDoc?: ts.JSDoc[] }).jsDoc
  if (docs == null || docs.length === 0) return { summary: '', tags: [] }
  const doc = docs[docs.length - 1]
  const comment =
    typeof doc.comment === 'string'
      ? doc.comment
      : (doc.comment ?? []).map(c => c.text).join('')
  const paras = comment
    .split('\n\n')
    .map(p => p.replace(/\s*\n\s*/g, ' ').trim())
  const tags: Array<[string, string]> = []
  for (const tag of doc.tags ?? []) {
    const name = tag.tagName.text
    const text =
      typeof tag.comment === 'string'
        ? tag.comment
        : (tag.comment ?? []).map(c => c.text).join('')
    const paramName = ts.isJSDocParameterTag(tag)
      ? tag.name.getText()
      : undefined
    // Tag text wraps across comment lines; collapse it back to one line.
    const flat = text.replace(/\s*\n\s*/g, ' ').trim()
    tags.push([name, (paramName != null ? `${paramName} ` : '') + flat])
  }
  return {
    summary: paras[0] ?? '',
    description: paras.length > 1 ? paras.slice(1).join('\n\n') : undefined,
    tags
  }
}

/**
 * Property names wrapped in `asOptional(…)`.
 *
 * `asOptional(asUnknown)` resolves to plain `unknown`, because `unknown`
 * absorbs `undefined` — so optionality has to be read from the source.
 */
function optionalNames(
  checker: ts.TypeChecker,
  node: ts.Expression
): Set<string> {
  const out = new Set<string>()
  const walk = (expr: ts.Expression): ts.Expression | undefined => {
    let cur: ts.Expression = expr
    if (ts.isPropertyAccessExpression(cur)) cur = cur.expression
    if (ts.isObjectLiteralExpression(cur)) return cur
    if (ts.isIdentifier(cur)) {
      let sym = checker.getSymbolAtLocation(cur)
      if (sym != null && (sym.flags & ts.SymbolFlags.Alias) !== 0) {
        sym = checker.getAliasedSymbol(sym)
      }
      const decl = sym?.declarations?.[0]
      if (
        decl != null &&
        ts.isVariableDeclaration(decl) &&
        decl.initializer != null
      ) {
        return walk(decl.initializer)
      }
      return undefined
    }
    if (ts.isCallExpression(cur)) {
      const callee = cur.expression.getText()
      if (callee === 'doc') return walk(cur.arguments[0])
      if (callee.startsWith('asObject')) return cur.arguments[0]
    }
    return undefined
  }
  const shape = walk(node)
  if (shape == null || !ts.isObjectLiteralExpression(shape)) return out
  for (const prop of shape.properties) {
    if (ts.isSpreadAssignment(prop)) {
      for (const n of optionalNames(checker, prop.expression)) out.add(n)
      continue
    }
    if (!ts.isPropertyAssignment(prop)) continue
    if (/\basOptional\s*\(/.test(prop.initializer.getText())) {
      out.add(prop.name.getText().replace(/'/g, ''))
    }
  }
  return out
}

/** Resolved fields, each carrying the prose written beside it. */
function withProse(
  checker: ts.TypeChecker,
  node: ts.Expression | undefined
): ExtractedField[] | undefined {
  if (node == null) return undefined
  const prose = proseFor(checker, node)
  const optional = optionalNames(checker, node)
  return fieldsOf(checker, node).fields.map(f => ({
    ...f,
    optional: f.optional || optional.has(f.name),
    doc: prose[f.name]
  }))
}

/**
 * The repo's own compiler options, so the checker sees what `tsc` sees.
 *
 * Six hand-written options stood in for `tsconfig.json`, and the difference
 * was not cosmetic: without `resolveJsonModule` every `.json` import in the
 * route graph resolved to nothing, and without `esModuleInterop` a default
 * import did. Measured at the time, the hand-written program produced 63
 * errors over the same files that `npm run tsc` compiles clean — so the
 * document was generated from a partly broken view of the code, and a type
 * the checker silently resolved to an error type would have been documented
 * as such with no gate able to notice.
 */
function compilerOptions(): ts.CompilerOptions {
  const configPath = path.join(ROOT, 'tsconfig.json')
  // Bound, because `ts.sys.readFile` is a method on `ts.sys`.
  const read = ts.readConfigFile(configPath, file => ts.sys.readFile(file))
  if (read.error != null) {
    throw new Error(
      `Could not read tsconfig.json: ${ts.flattenDiagnosticMessageText(
        read.error.messageText,
        ' '
      )}`
    )
  }
  const parsed = ts.parseJsonConfigFileContent(
    read.config,
    ts.sys,
    path.dirname(configPath)
  )
  return {
    ...parsed.options,
    // This program only reads types; it never emits.
    noEmit: true,
    // The route graph pulls in React Native's declarations transitively, and
    // type-checking those is `npm run tsc`'s job, not this generator's.
    skipLibCheck: true
  }
}

export function extractRoutes(): ExtractedRoute[] {
  const files = sourceFiles()
  const program = ts.createProgram(files, compilerOptions())
  // The checker's view has to match the repo's, or a field's documented type
  // is whatever a broken resolution produced. Only the route files' own
  // diagnostics are fatal: the graph reaches the whole app, and the app's
  // type-check is `npm run tsc`.
  const routeFileSet = new Set(files)
  const fatal = ts
    .getPreEmitDiagnostics(program)
    .filter(d => d.file != null && routeFileSet.has(d.file.fileName))
  if (fatal.length > 0) {
    const lines = fatal.slice(0, 10).map(d => {
      const where =
        d.file != null && d.start != null
          ? `${path.relative(ROOT, d.file.fileName)}:${
              d.file.getLineAndCharacterOfPosition(d.start).line + 1
            }`
          : '?'
      return `  ${where}: ${ts.flattenDiagnosticMessageText(
        d.messageText,
        ' '
      )}`
    })
    throw new Error(
      `extractRoutes: ${fatal.length} type error(s) in the route files, so ` +
        `the documented types would not be the real ones:\n${lines.join('\n')}`
    )
  }
  const checker = program.getTypeChecker()
  const out: ExtractedRoute[] = []

  for (const file of files) {
    const src = program.getSourceFile(file)
    if (src == null) continue
    for (const stmt of src.statements) {
      if (!ts.isVariableStatement(stmt)) continue
      for (const decl of stmt.declarationList.declarations) {
        const init = decl.initializer
        if (
          init == null ||
          !ts.isCallExpression(init) ||
          init.expression.getText() !== 'route'
        ) {
          continue
        }
        const arg = init.arguments[0]
        if (arg == null || !ts.isObjectLiteralExpression(arg)) continue

        const { summary, description, tags } = readJsDoc(stmt)
        const params: Record<string, string> = {}
        const notes: string[] = []
        let bodyNote: string | undefined
        let returnsDoc: string | undefined
        let coreNote: string | undefined
        for (const [tag, text] of tags) {
          if (tag === 'param') {
            const [name, ...rest] = text.split(' ')
            params[name] = rest.join(' ').trim()
          } else if (tag === 'note') notes.push(text.trim())
          else if (tag === 'bodyNote') bodyNote = text.trim()
          else if (tag === 'returns') returnsDoc = text.trim()
          else if (tag === 'coreNote') coreNote = text.trim()
        }

        const queryNode = propNode(arg, 'query')
        const bodyNode = propNode(arg, 'body')
        const returnsNode = propNode(arg, 'returns')
        const cliNode = propNode(arg, 'cli')

        // The declared `path` carries scope and command; a positional is
        // appended to it. Mirrors `routePath` in src/cli/engine/route.ts,
        // which is what the engine actually serves.
        const declaredPath = literal(arg, 'path') ?? ''
        const cli = parseCliList(cliNode)[0] ?? null
        const pathPositional = cli?.positional ?? null
        const routePath =
          pathPositional == null
            ? declaredPath
            : `${declaredPath}/{${pathPositional}}`

        out.push({
          id: decl.name.getText(),
          file: path.basename(file),
          summary,
          description,
          core: literal(arg, 'core'),
          coreNote,
          coreExtra: recordLiteral(arg, 'coreExtra'),
          method: literal(arg, 'method') ?? '',
          routePath,
          declaredPath,
          pathPositional,
          cli,
          cliExtra: parseCliList(cliNode).slice(1),
          pathParams: [...routePath.matchAll(/\{(\w+)\}/g)].map(m => m[1]),
          group: path.basename(file, '.ts'),
          isStream: propNode(arg, 'stream') != null,
          errors: routeErrors(arg, routePath),
          notes,
          bodyNote,
          returnsDoc,
          params,
          query: withProse(checker, queryNode),
          body: withProse(checker, bodyNode),
          returns: withProse(checker, returnsNode),
          returnsProse:
            returnsNode != null
              ? proseFor(checker, returnsNode)['']
              : undefined,
          returnsType:
            returnsNode != null
              ? fieldsOf(checker, returnsNode).type
              : undefined
        })
      }
    }
  }
  return out
}

if (require.main === module) {
  const routes = extractRoutes()
  console.log(`extracted ${routes.length} route declaration(s)\n`)
  for (const r of routes) {
    console.log(`${r.id}  [${r.file}]`)
    console.log(`  ${r.method} ${r.routePath}   cli=${r.cli?.command ?? '—'}`)
    console.log(
      `  core: ${r.core ?? 'null'}${
        r.coreNote != null ? ' — ' + r.coreNote.slice(0, 60) : ''
      }`
    )
    console.log(`  summary: ${r.summary}`)
    if (r.description != null)
      console.log(`  desc: ${r.description.slice(0, 80)}…`)
    for (const n of r.notes) console.log(`  note: ${n.slice(0, 78)}`)
    if (r.returnsDoc != null)
      console.log(`  returns doc: ${r.returnsDoc.slice(0, 70)}`)
    if (r.returns != null) {
      console.log(
        `  returns: ${r.returns
          .map(f => f.name + (f.optional ? '?' : '') + ': ' + f.type)
          .join(', ')}`
      )
    }
    console.log()
  }
}
