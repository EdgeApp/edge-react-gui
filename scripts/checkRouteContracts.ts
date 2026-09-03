/**
 * Checks each route declaration against itself and against its handler.
 *
 * `verifyApiDocs` compares the surface — routes, commands, flags, core names.
 * This checks the contract: that every field a caller can send is described,
 * that nothing described has gone away, and that a handler does not read a
 * field its cleaner would have stripped.
 *
 *   node -r sucrase/register scripts/checkRouteContracts.ts
 */
import fs from 'fs'
import path from 'path'

import { errorCodes } from '../docs/api/shared'
import { extractRoutes } from './extractRoutes'

const ROOT = path.resolve(__dirname, '..')
const ROUTES = path.join(ROOT, 'src/cli/engine/routes')

/** Source of every route declaration's handler, keyed by `METHOD path`. */
function handlerSources(): Map<string, string> {
  const out = new Map<string, string>()
  for (const name of fs.readdirSync(ROUTES)) {
    if (!name.endsWith('.ts') || name === 'index.ts' || name === 'helpers.ts') {
      continue
    }
    const src = fs.readFileSync(path.join(ROUTES, name), 'utf8')
    const re =
      /\broute\(\{([\s\S]*?\bmethod:\s*'([A-Z]+)',\s*\n?\s*path:\s*'([^']+)'[\s\S]*?)\n\}\)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src)) != null) out.set(`${m[2]} ${m[3]}`, m[1])
  }
  return out
}

/** Fields a handler pulls off `ctx.body` or the validated query. */
function readsFrom(fn: string, source: 'body' | 'query'): Set<string> {
  const out = new Set<string>()
  const base = source === 'body' ? 'ctx\\.body' : 'ctx\\.query\\.valid'
  for (const m of fn.matchAll(new RegExp(`${base}\\.([a-zA-Z_][\\w]*)`, 'g'))) {
    out.add(m[1])
  }
  // Destructured: `const { a, b } = ctx.body`
  for (const m of fn.matchAll(
    new RegExp(`const \\{([^}]*)\\} = ${base}\\b`, 'g')
  )) {
    for (const part of m[1].split(',')) {
      // `{ filter = 'active' }` and `{ tokenId: id }` both name one field.
      const name = part.split(':')[0].split('=')[0].trim()
      if (name !== '') out.add(name)
    }
  }
  return out
}

const handlers = handlerSources()
const problems: string[] = []
let described = 0
let total = 0

for (const r of extractRoutes()) {
  const fields = [...(r.query ?? []), ...(r.body ?? [])]
  const names = new Set(fields.map(f => f.name))

  // Every field a caller can send needs a description, beside the field.
  for (const field of fields) {
    if (field.doc == null) {
      problems.push(
        `${r.id}: field "${field.name}" has no description — wrap it as ` +
          `doc(cleaner, '…')`
      )
    }
  }

  // A handler must not read a field its cleaner would have stripped.
  const fn = handlers.get(`${r.method} ${r.routePath}`)
  if (fn != null) {
    for (const name of readsFrom(fn, 'body')) {
      if (r.body != null && !names.has(name)) {
        problems.push(
          `${r.id}: handler reads ctx.body.${name}, absent from the body cleaner`
        )
      }
    }
    for (const name of readsFrom(fn, 'query')) {
      if (!names.has(name)) {
        problems.push(
          `${r.id}: handler reads query "${name}", absent from the query cleaner`
        )
      }
    }

    // A route that declares a query cleaner must read the cleaned result. A
    // handler that re-parses the raw URLSearchParams gets whatever the caller
    // sent, so the declared type stops being the enforced type — which is how
    // `waitForAll` came to be documented as a string while the command wanted
    // a switch.
    if (r.query != null) {
      const raw =
        /\b(optionalQuery(String|Int|Date|Boolean)|requireQuery(String|Int)|ctx\.query\.(get|has))\b/.exec(
          fn
        )
      if (raw != null) {
        problems.push(
          `${r.id}: handler calls ${raw[1]} on the raw query; read ` +
            'ctx.query.valid instead, so the declared cleaner is what runs'
        )
      }
    }
  }

  // Error codes must exist in the catalogue.
  const known = new Set(errorCodes.map(e => e.code))
  for (const code of r.errors) {
    if (!known.has(code)) {
      problems.push(`${r.id}: lists error "${code}", absent from the catalogue`)
    }
  }

  described += (r.returns ?? []).filter(f => f.doc != null).length
  total += (r.returns ?? []).length
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} contract problem(s):\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(
  `✓ contracts hold across ${handlers.size} declarations ` +
    `(${described}/${total} response fields carry prose)`
)
