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
  invert?: boolean
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
  /** False when an optional positional has to stay off the path. */
  positionalInPath?: false
  bodyFlag?: string
  flags: ExtractedCliFlag[]
  extra: ExtractedCliExtra[]
  notes?: string
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
    if (!ts.isArrayLiteralExpression(prop.initializer)) return []
    return prop.initializer.elements.filter(ts.isStringLiteral).map(e => e.text)
  }
  return []
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
function fieldsOf(
  checker: ts.TypeChecker,
  node: ts.Expression
): { fields: ExtractedField[]; type: string } {
  const cleanerType = checker.getTypeAtLocation(node)
  const call = cleanerType.getCallSignatures()[0]
  if (call == null) {
    return { fields: [], type: checker.typeToString(cleanerType, node, FORMAT) }
  }
  const out = checker.getReturnTypeOfSignature(call)
  const typeText = checker.typeToString(out, node, FORMAT)
  // A primitive or `unknown` has no fields of its own — asking for its
  // properties yields the prototype's, which are not part of the API.
  const isObjectLike =
    (out.flags & ts.TypeFlags.Object) !== 0 && !typeText.endsWith('[]')
  const fields = (isObjectLike ? checker.getPropertiesOfType(out) : []).map(
    prop => {
      const t = checker.getTypeOfSymbolAtLocation(prop, node)
      let text = checker.typeToString(t, node, FORMAT)
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
        invert: spec != null ? /invert:\s*true/.test(spec.getText()) : false,
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
    positionalInPath: /positionalInPath:\s*false/.test(node.getText())
      ? false
      : undefined,
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
    notes: str(node, 'notes')
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

export function extractRoutes(): ExtractedRoute[] {
  const files = sourceFiles()
  const program = ts.createProgram(files, {
    strict: true,
    target: ts.ScriptTarget.ES2020,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    skipLibCheck: true,
    noEmit: true
  })
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
        const pathPositional =
          cli?.positional != null && cli.positionalInPath !== false
            ? cli.positional
            : null
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
          method: literal(arg, 'method') ?? '',
          routePath,
          declaredPath,
          pathPositional,
          cli,
          cliExtra: parseCliList(cliNode).slice(1),
          pathParams: [...routePath.matchAll(/\{(\w+)\}/g)].map(m => m[1]),
          group: path.basename(file, '.ts'),
          isStream: propNode(arg, 'stream') != null,
          errors: arrayLiteral(arg, 'errors'),
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
