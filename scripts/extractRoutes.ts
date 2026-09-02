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

export interface ExtractedRoute {
  id: string
  file: string
  summary: string
  description?: string
  core: string | null
  coreNote?: string
  method: string
  routePath: string
  cli?: string
  cliRaw?: string
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
  const fields = checker.getPropertiesOfType(out).map(prop => {
    const t = checker.getTypeOfSymbolAtLocation(prop, node)
    let text = checker.typeToString(t, node, FORMAT)
    // Cleaners type optional fields as `T | undefined`; render them as `T?`.
    const optional =
      (prop.flags & ts.SymbolFlags.Optional) !== 0 ||
      text.endsWith(' | undefined')
    text = text.replace(/ \| undefined$/, '')
    return { name: prop.name, type: text, optional }
  })
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
  const out: Record<string, string> = {}

  const objectOf = (expr: ts.Expression): ts.Expression | undefined => {
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

  // Prose attached to the whole cleaner, for pass-through responses.
  let outer: ts.Expression = node
  if (ts.isPropertyAccessExpression(outer)) outer = outer.expression
  if (
    ts.isCallExpression(outer) &&
    outer.expression.getText() === 'doc' &&
    outer.arguments.length > 1 &&
    ts.isStringLiteral(outer.arguments[1])
  ) {
    out[''] = outer.arguments[1].text
  }

  const shape = objectOf(node)
  if (shape == null || !ts.isObjectLiteralExpression(shape)) return out
  for (const prop of shape.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    const value = prop.initializer
    if (
      ts.isCallExpression(value) &&
      value.expression.getText() === 'doc' &&
      value.arguments.length > 1 &&
      ts.isStringLiteral(value.arguments[1])
    ) {
      out[prop.name.getText()] = value.arguments[1].text
    }
  }
  return out
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

/** Resolved fields, each carrying the prose written beside it. */
function withProse(
  checker: ts.TypeChecker,
  node: ts.Expression | undefined
): ExtractedField[] | undefined {
  if (node == null) return undefined
  const prose = proseFor(checker, node)
  return fieldsOf(checker, node).fields.map(f => ({
    ...f,
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

        out.push({
          id: decl.name.getText(),
          file: path.basename(file),
          summary,
          description,
          core: literal(arg, 'core'),
          coreNote,
          method: literal(arg, 'method') ?? '',
          routePath: literal(arg, 'path') ?? '',
          cli:
            cliNode != null && ts.isStringLiteral(cliNode)
              ? cliNode.text
              : undefined,
          cliRaw: cliNode?.getText(),
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
    console.log(
      `  ${r.method} ${r.routePath}   cli=${r.cli ?? r.cliRaw ?? '—'}`
    )
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
