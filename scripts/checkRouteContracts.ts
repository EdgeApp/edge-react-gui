/**
 * Checks that each route's documented request matches what its handler reads.
 *
 * The inventory checks in `verifyApiDocs.ts` compare names and shapes of the
 * surface. This compares the *contract*: every field a handler pulls out of
 * the body or query must be documented, or a caller following the docs will
 * send a request the handler silently reads as `undefined`.
 *
 *   node -r sucrase/register scripts/checkRouteContracts.ts
 */
import fs from 'fs'
import path from 'path'

import { endpoints } from '../docs/api'
import { extractRoutes } from './extractRoutes'

const ROOT = path.resolve(__dirname, '..')
const ROUTES = path.join(ROOT, 'src/cli/engine/routes')

/** Source of every `router.add(…)` handler, keyed by `METHOD path`. */
function handlerSources(): Map<string, string> {
  const out = new Map<string, string>()
  for (const name of fs.readdirSync(ROUTES)) {
    if (!name.endsWith('.ts') || name === 'index.ts' || name === 'helpers.ts') {
      continue
    }
    const src = fs.readFileSync(path.join(ROUTES, name), 'utf8')
    // Legacy form: the handler is the third argument to router.add.
    const addRe = /router\.add\(\s*'([A-Z]+)',\s*'([^']+)',\s*/g
    let m: RegExpExecArray | null
    while ((m = addRe.exec(src)) != null) {
      let depth = 1
      let i = m.index + m[0].length
      while (i < src.length && depth > 0) {
        const ch = src[i]
        if (ch === '(') depth++
        else if (ch === ')') depth--
        i++
      }
      out.set(`${m[1]} ${m[2]}`, src.slice(m.index + m[0].length, i - 1))
    }
    // Declaration form: the whole route({…}) body, which contains the handler.
    const routeRe =
      /\broute\(\{([\s\S]*?\bmethod:\s*'([A-Z]+)',\s*\n?\s*path:\s*'([^']+)'[\s\S]*?)\n\}\)/g
    while ((m = routeRe.exec(src)) != null) {
      out.set(`${m[2]} ${m[3]}`, m[1])
    }
  }
  return out
}

function readsFromBody(fn: string): Set<string> {
  const out = new Set<string>()
  const helper =
    /(?:require|optional)(?:String|Boolean|Number|StringArray)\(\s*body,\s*'([^']+)'/g
  for (const m of fn.matchAll(helper)) out.add(m[1])
  for (const m of fn.matchAll(/\bbody\.([a-zA-Z_][\w]*)/g)) out.add(m[1])
  return out
}

function readsFromQuery(fn: string): Set<string> {
  const out = new Set<string>()
  const helper =
    /(?:require|optional)Query(?:String|Boolean|Int|Date)\(\s*ctx\.query,\s*'([^']+)'/g
  for (const m of fn.matchAll(helper)) out.add(m[1])
  for (const m of fn.matchAll(/ctx\.query\.(?:get|has)\('([^']+)'\)/g)) {
    out.add(m[1])
  }
  return out
}

const handlers = handlerSources()
const problems: string[] = []

for (const e of endpoints) {
  const fn = handlers.get(`${e.method} ${e.path}`)
  if (fn == null) continue // served outside the router

  const documentedBody = new Set(
    e.body != null && e.body.kind === 'object'
      ? e.body.fields.map(f => f.name)
      : []
  )
  const documentedQuery = new Set((e.query ?? []).map(q => q.name))

  for (const field of readsFromBody(fn)) {
    if (!documentedBody.has(field)) {
      problems.push(`${e.id}: handler reads body.${field}, not documented`)
    }
  }
  for (const field of readsFromQuery(fn)) {
    if (!documentedQuery.has(field)) {
      problems.push(`${e.id}: handler reads query "${field}", not documented`)
    }
  }
}

// A `@param` carries the one thing a cleaner cannot: the prose. The field
// *name* is the part that is stated twice, so hold the two together — a tag
// naming nothing is dead, and a field with no tag is undocumented.
for (const r of extractRoutes()) {
  const fields = new Set(
    [...(r.query ?? []), ...(r.body ?? [])].map(f => f.name)
  )
  for (const name of Object.keys(r.params)) {
    if (!fields.has(name)) {
      problems.push(
        `${r.id}: @param ${name} names no field in the query or body cleaner`
      )
    }
  }
  for (const name of fields) {
    if (!(name in r.params)) {
      problems.push(`${r.id}: field "${name}" has no @param describing it`)
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} contract mismatch(es):\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
const declared = extractRoutes()
console.log(
  `✓ request contracts match: ${handlers.size} handlers agree with their docs, ` +
    `${declared.length} declared route(s) documented field-for-field`
)
