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

/**
 * Fields a handler pulls off `ctx.body` or the validated query.
 *
 * Through one level of aliasing as well as directly. Four admin repo
 * handlers bind the body first — `const body = ctx.body` and then
 * `const { syncKey } = body` — so neither direct pattern matched, the field
 * set came back empty, and the one check `tsc` cannot do (`.withRest` makes
 * a cleaned body indexable, so reading a field the cleaner would have
 * stripped is not a type error) was vacuous for
 * `POST /admin/send-lobby-reply`, `/admin/sync-repo`, `/admin/repo-set` and
 * `/admin/repo-delete`.
 */
function readsFrom(fn: string, source: 'body' | 'query'): Set<string> {
  const out = new Set<string>()
  const base = source === 'body' ? 'ctx\\.body' : 'ctx\\.query\\.valid'
  // Every expression the fields can hang off: the source itself, and any
  // local bound straight to it.
  const bases = [base]
  for (const m of fn.matchAll(
    new RegExp(`const ([a-zA-Z_][\\w]*) = ${base}\\b(?!\\.)`, 'g')
  )) {
    bases.push(m[1].replace(/[$]/g, '\\$&'))
  }

  for (const from of bases) {
    for (const m of fn.matchAll(
      new RegExp(`${from}\\.([a-zA-Z_][\\w]*)`, 'g')
    )) {
      out.add(m[1])
    }
    // Destructured: `const { a, b } = ctx.body`
    for (const m of fn.matchAll(
      new RegExp(`const \\{([^}]*)\\} = ${from}\\b`, 'g')
    )) {
      for (const part of m[1].split(',')) {
        // `{ filter = 'active' }` and `{ tokenId: id }` both name one field.
        const name = part.split(':')[0].split('=')[0].trim()
        if (name !== '') out.add(name)
      }
    }
  }
  return out
}

const handlers = handlerSources()
const problems: string[] = []
/** Routes whose handler this gate could not find, which it must not ignore. */
const unmatched: string[] = []
/** Routes with a declared body whose handler reads no field off it. */
const bodyUnread: string[] = []
/** Routes whose handler it really did check, for the summary line. */
let checkedHandlers = 0
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
  // `declaredPath`, not `routePath`. `handlerSources` keys the map on the
  // `path:` literal it reads out of the source, and `extractRoutes` appends
  // the CLI positional to `routePath` — which `verifyApiDocs` *forbids*
  // writing into `path`, so for a route with a positional the two can never
  // match. 20 of 117 lookups missed, and `if (fn != null)` made every miss a
  // silent skip: all three handler checks below, including the one `tsc`
  // cannot do, were off for `sign-tx`, `broadcast-tx`, `save-tx`,
  // `object-get`, `swap-quote-get` and the eight admin repo routes.
  const fn = handlers.get(`${r.method} ${r.declaredPath}`)
  if (fn == null) {
    unmatched.push(r.id)
  } else {
    checkedHandlers++
    const bodyReads = readsFrom(fn, 'body')
    // A declared body nothing is read from is the shape the alias hole hid:
    // the check below ran, found no fields, and reported nothing. It is
    // legitimate — a handler can pass `ctx.body` straight to core — so this
    // is counted and printed rather than failed, which is what would have
    // made four empty field sets visible.
    if (r.body != null && names.size > 0 && bodyReads.size === 0) {
      bodyUnread.push(r.id)
    }
    for (const name of bodyReads) {
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

// ---------------------------------------------------------------------------
// Every code the CLI can emit, against the catalogue — in both directions.
//
// The existing check above is one-way: a code a route *declares* has to be in
// the catalogue. That let the program emit conditions the catalogue had no way
// to describe. `ENGINE_UNAVAILABLE` and `USAGE` are the ones that got through:
// the client writes them to stderr on the most common failure a first-time
// user meets, and neither appeared in `errorCodes`, in the HTML reference, in
// the OpenAPI document or in the guide — so the exit-7 row described the
// condition in prose while withholding the code a program would match on.
//
// Scanned from the source rather than the declarations, because a code the
// client invents never passes through a route.
// ---------------------------------------------------------------------------
{
  const cliDirs = ['src/cli']
  const emitted = new Set<string>()
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'generated') continue
        walk(full)
        continue
      }
      if (!entry.name.endsWith('.ts')) continue
      const text = fs.readFileSync(full, 'utf8')
      // `engineError('CODE'`, and `code: 'CODE'` in an envelope literal.
      for (const m of text.matchAll(/engineError\(\s*'([A-Z][A-Z0-9_]*)'/g)) {
        emitted.add(m[1])
      }
      for (const m of text.matchAll(/\bcode: '([A-Z][A-Z0-9_]*)'/g)) {
        emitted.add(m[1])
      }
    }
  }
  for (const dir of cliDirs) walk(path.join(ROOT, dir))

  const known = new Set(errorCodes.map(e => e.code))
  for (const code of [...emitted].sort()) {
    if (!known.has(code)) {
      problems.push(
        `src/cli emits error code "${code}", which is absent from the ` +
          'catalogue in docs/api/shared.ts — a code a caller cannot look up'
      )
    }
  }
}

// A gate that checks nothing has to say so. The summary used to print
// `handlers.size` — the number of declarations *found* — so 20 skipped
// routes read as 117 checked, and the one thing that would have revealed it
// was the number the line did not report.
if (unmatched.length > 0) {
  problems.push(
    `${unmatched.length} route(s) have a declaration this gate could not ` +
      `match to a handler, so nothing was checked for them: ` +
      unmatched.join(', ')
  )
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} contract problem(s):\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(
  `✓ contracts hold across ${checkedHandlers} declarations ` +
    `(${described}/${total} response fields carry prose)`
)
if (bodyUnread.length > 0) {
  // Not a failure: a handler may hand `ctx.body` to core whole. Printed
  // because an empty field set is also what a parser hole looks like, and
  // four of these were one.
  console.log(
    `  ${bodyUnread.length} with a declared body no field is read from: ` +
      bodyUnread.join(', ')
  )
}
