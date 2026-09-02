/**
 * Drift checker for docs/api.
 *
 * Reads the engine's own route registrations and command registrations
 * straight out of `src/cli`, then asserts the documentation describes exactly
 * that surface — no missing routes, no invented ones, no stale command names.
 *
 *   node -r sucrase/register scripts/verifyApiDocs.ts
 *
 * Exits non-zero on any drift, so it can gate CI.
 */
import fs from 'fs'
// ------------------------------------------------------------- core calls
// Every endpoint must either name the core call it fronts or say why there is
// none. Names are checked against the real edge-core-js interfaces.
import path from 'path'

import { endpoints } from '../docs/api'
import { errorCodes } from '../docs/api/shared'

const ROOT = path.resolve(__dirname, '..')
const ROUTES_DIR = path.join(ROOT, 'src/cli/engine/routes')
const COMMANDS_DIR = path.join(ROOT, 'src/cli/commands')

/** Routes served outside the router, which therefore never call `router.add`. */
const NON_ROUTER_ROUTES = new Set(['GET /engine/events'])

/** Commands that talk to no endpoint. */
const LOCAL_ONLY_COMMANDS = new Set(['help'])

function read(dir: string): string {
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith('.ts'))
    .map(name => fs.readFileSync(path.join(dir, name), 'utf8'))
    .join('\n')
}

function actualRoutes(): Set<string> {
  const source = read(ROUTES_DIR)
  const found = new Set<string>()
  const re = /router\.add\(\s*'([A-Z]+)',\s*'([^']+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) != null) found.add(`${m[1]} ${m[2]}`)
  return found
}

function actualCommands(): Set<string> {
  const source = read(COMMANDS_DIR)
  const found = new Set<string>()
  // `command('name', …)` plus the wrappers in wallet.ts that register several
  // commands from one body.
  const re =
    /(?<![\w.])(?:command|objectIdCmd|walletActionCmd)\(\s*'([a-z0-9-]+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) != null) found.add(m[1])
  return found
}

/**
 * The flags each command actually accepts, read from its `parseCommandArgs`
 * call. `objectIdCmd` builds three commands from one body, so its flags are
 * attributed to every name it registers.
 */
function actualFlags(): Map<string, Set<string>> {
  const source = read(COMMANDS_DIR)
  const out = new Map<string, Set<string>>()

  function flagsIn(text: string): Set<string> {
    const flags = new Set<string>()
    const block = /flags:\s*\{([\s\S]*?)\}/.exec(text)
    if (block == null) return flags
    const re =
      /['"]?([a-zA-Z0-9-]+)['"]?\s*:\s*'(?:string|boolean|repeat|boolstr)'/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block[1])) != null) flags.add(m[1])
    return flags
  }

  // Wrappers in wallet.ts register several commands from one body, so each
  // wrapper's flags belong to every name it is called with.
  const helpers: Array<[RegExp, RegExp]> = [
    [
      /function objectIdCmd\([\s\S]*?\n\}/,
      /^objectIdCmd\(\s*\n?\s*'([a-z0-9-]+)'/gm
    ],
    [
      /function walletActionCmd\([\s\S]*?\n\}/,
      /^walletActionCmd\(\s*\n?\s*'([a-z0-9-]+)'/gm
    ]
  ]

  for (const block of source.split(/\n(?=(?:const \w+ = )?command\()/)) {
    const name = /^(?:const \w+ = )?command\(\s*\n?\s*'([a-z0-9-]+)'/.exec(
      block
    )
    if (name != null) out.set(name[1], flagsIn(block))
  }
  for (const [bodyRe, callRe] of helpers) {
    const body = bodyRe.exec(source)
    const flags = body != null ? flagsIn(body[0]) : new Set<string>()
    let m: RegExpExecArray | null
    while ((m = callRe.exec(source)) != null) out.set(m[1], flags)
  }

  return out
}

/** `--token-id=<id>` -> `token-id` */
function flagName(flag: string): string {
  return flag.replace(/^--/, '').split(/[=\s]/)[0]
}

const problems: string[] = []
function fail(kind: string, detail: string): void {
  problems.push(`${kind}: ${detail}`)
}

// ---------------------------------------------------------------- routes
const routes = actualRoutes()
const documented = new Map<string, number>()
for (const e of endpoints) {
  const key = `${e.method} ${e.path}`
  documented.set(key, (documented.get(key) ?? 0) + 1)
}

for (const [key, count] of documented) {
  if (count > 1) fail('duplicate', `${key} is documented ${count} times`)
  if (!routes.has(key) && !NON_ROUTER_ROUTES.has(key)) {
    fail('phantom route', `${key} is documented but never registered`)
  }
}
for (const key of routes) {
  if (!documented.has(key)) fail('undocumented route', key)
}

// -------------------------------------------------------------- commands
const commands = actualCommands()
const cited = new Set<string>()
for (const e of endpoints) {
  for (const c of e.cli) {
    cited.add(c.command)
    if (!commands.has(c.command)) {
      fail('phantom command', `"${c.command}" cited by ${e.id} does not exist`)
    }
    if (!c.usage.startsWith(c.command)) {
      fail(
        'usage mismatch',
        `${e.id}: usage "${c.usage}" does not start with "${c.command}"`
      )
    }
  }
}
for (const name of commands) {
  if (!cited.has(name) && !LOCAL_ONLY_COMMANDS.has(name)) {
    fail(
      'undocumented command',
      `"${name}" is registered but no endpoint cites it`
    )
  }
}

// Documented flags must be flags the command really parses. This is the check
// that would have caught the old doc's invented options.
const flagsByCommand = actualFlags()
for (const e of endpoints) {
  for (const c of e.cli) {
    const real = flagsByCommand.get(c.command)
    if (real == null) continue
    for (const fl of c.flags ?? []) {
      const name = flagName(fl.flag)
      if (!real.has(name)) {
        fail(
          'phantom flag',
          `${e.id}: "${c.command}" does not accept --${name}`
        )
      }
    }
    // Usage strings must not advertise flags the parser would reject either.
    for (const m of c.usage.matchAll(/--([a-z0-9-]+)/g)) {
      if (!real.has(m[1])) {
        fail(
          'phantom flag in usage',
          `${e.id}: "${c.command}" usage shows --${m[1]}`
        )
      }
    }
  }
}
const CORE_TYPES = path.join(
  ROOT,
  'node_modules/edge-core-js/src/types/types.ts'
)
const coreSource = fs.existsSync(CORE_TYPES)
  ? fs.readFileSync(CORE_TYPES, 'utf8')
  : ''
const INTERNAL_TYPES = path.join(ROOT, 'src/cli/engine/internal.ts')
const internalSource = fs.existsSync(INTERNAL_TYPES)
  ? fs.readFileSync(INTERNAL_TYPES, 'utf8')
  : ''
for (const e of endpoints) {
  if (e.coreCall == null) {
    if (e.coreNote == null || e.coreNote === '') {
      fail('missing core note', `${e.id} has no coreCall and no coreNote`)
    }
    continue
  }
  const member = e.coreCall.split('.').pop() ?? ''
  // `$internalStuff` is core's private surface and is absent from the public
  // types, so those names are checked against the engine's own shim instead.
  const haystack = e.coreCall.includes('$internalStuff')
    ? internalSource
    : coreSource
  if (haystack !== '' && !new RegExp(`\\b${member}\\b`).test(haystack)) {
    fail(
      'unknown core call',
      `${e.id} names "${e.coreCall}" but "${member}" is absent from ${
        e.coreCall.includes('$internalStuff')
          ? 'src/cli/engine/internal.ts'
          : 'edge-core-js'
      }`
    )
  }
}

// ---------------------------------------------------------------- errors
const knownCodes = new Set(errorCodes.map(e => e.code))
for (const e of endpoints) {
  for (const code of e.errors ?? []) {
    if (!knownCodes.has(code)) {
      fail(
        'unknown error code',
        `${e.id} lists "${code}", absent from the catalogue`
      )
    }
  }
}

// --------------------------------------------------------------- shapes
for (const e of endpoints) {
  if (e.success.status === 204 && e.success.schema != null) {
    fail('bad response', `${e.id} is 204 but declares a body schema`)
  }
  if (
    e.success.status === 200 &&
    e.success.schema == null &&
    e.success.doc == null
  ) {
    fail(
      'bad response',
      `${e.id} is 200 with neither a schema nor a prose description`
    )
  }
  for (const name of e.path.matchAll(/\{(\w+)\}/g)) {
    const declared = (e.pathParams ?? []).some(p => p.name === name[1])
    if (!declared)
      fail('missing path param', `${e.id} does not declare {${name[1]}}`)
  }
}

// ---------------------------------------------------------------- report
const routeCount = routes.size + NON_ROUTER_ROUTES.size
if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s):\n`)
  for (const p of problems) console.error(`  ${p}`)
  console.error(
    `\n${documented.size} documented / ${routeCount} actual routes, ` +
      `${cited.size} documented / ${commands.size} actual commands`
  )
  process.exit(1)
}
console.log(
  `✓ docs/api matches the code: ${documented.size} routes, ` +
    `${cited.size} of ${commands.size} commands (${LOCAL_ONLY_COMMANDS.size} local-only)`
)
