/**
 * Drift checker for the API surface.
 *
 * Reads the route declarations and the registered CLI commands out of
 * `src/cli`, and asserts they describe the same API: no route without a
 * command it claims, no command nobody declares, no flag on one side missing
 * from the other, and no `core` naming a member `edge-core-js` does not have.
 *
 *   node -r sucrase/register scripts/verifyApiDocs.ts
 *
 * Exits non-zero on any drift, so it can gate CI.
 */
import fs from 'fs'
import path from 'path'

import { errorCodes } from '../docs/api/shared'
import { extractRoutes, kebab } from './extractRoutes'

const ROOT = path.resolve(__dirname, '..')
const COMMANDS_DIR = path.join(ROOT, 'src/cli/commands')
const CORE_TYPES = path.join(
  ROOT,
  'node_modules/edge-core-js/src/types/types.ts'
)
const INTERNAL_TYPES = path.join(ROOT, 'src/cli/engine/internal.ts')

/** Commands that talk to no route. */
const LOCAL_ONLY_COMMANDS = new Set(['help'])

function read(dir: string): string {
  return fs
    .readdirSync(dir)
    .filter(name => name.endsWith('.ts'))
    .map(name => fs.readFileSync(path.join(dir, name), 'utf8'))
    .join('\n')
}

const commandSource = read(COMMANDS_DIR)

interface GeneratedTable {
  commands: Array<{
    command: string
    args: Array<{ flag?: string }>
    bodyFlag?: string
  }>
}

/** The generated table, alongside the hand-written modules. */
const generated: GeneratedTable = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/cli/generated/commands.json'), 'utf8')
)

function registeredCommands(): Set<string> {
  const found = new Set<string>()
  const re =
    /(?<![\w.])(?:command|objectIdCmd|walletActionCmd)\(\s*'([a-z0-9-]+)'/g
  let m: RegExpExecArray | null
  while ((m = re.exec(commandSource)) != null) found.add(m[1])
  for (const c of generated.commands) found.add(c.command)
  return found
}

/** Flags each command's parser really accepts. */
function registeredFlags(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  const flagsIn = (text: string): Set<string> => {
    const flags = new Set<string>()
    const block = /flags:\s*\{([\s\S]*?)\}/.exec(text)
    if (block == null) return flags
    const re =
      /['"]?([a-zA-Z0-9-]+)['"]?\s*:\s*'(?:string|boolean|repeat|boolstr)'/g
    let m: RegExpExecArray | null
    while ((m = re.exec(block[1])) != null) flags.add(m[1])
    return flags
  }
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
  for (const block of commandSource.split(/\n(?=(?:const \w+ = )?command\()/)) {
    const name = /^(?:const \w+ = )?command\(\s*\n?\s*'([a-z0-9-]+)'/.exec(
      block
    )
    if (name != null) out.set(name[1], flagsIn(block))
  }
  for (const [bodyRe, callRe] of helpers) {
    const body = bodyRe.exec(commandSource)
    const flags = body != null ? flagsIn(body[0]) : new Set<string>()
    let m: RegExpExecArray | null
    while ((m = callRe.exec(commandSource)) != null) out.set(m[1], flags)
  }
  for (const c of generated.commands) {
    const flags = new Set<string>()
    for (const a of c.args) if (a.flag != null) flags.add(a.flag)
    if (c.bodyFlag != null) flags.add(c.bodyFlag)
    out.set(c.command, flags)
  }
  return out
}

const problems: string[] = []
function fail(kind: string, detail: string): void {
  problems.push(`${kind}: ${detail}`)
}

const routes = extractRoutes()
const commands = registeredCommands()
const flagsByCommand = registeredFlags()
const coreSource = fs.existsSync(CORE_TYPES)
  ? fs.readFileSync(CORE_TYPES, 'utf8')
  : ''
const internalSource = fs.existsSync(INTERNAL_TYPES)
  ? fs.readFileSync(INTERNAL_TYPES, 'utf8')
  : ''

// -------------------------------------------------------------- uniqueness
const seen = new Map<string, number>()
for (const r of routes) {
  const key = `${r.method} ${r.routePath}`
  seen.set(key, (seen.get(key) ?? 0) + 1)
}
for (const [key, count] of seen) {
  if (count > 1) fail('duplicate route', `${key} declared ${count} times`)
}

// ------------------------------------------------------------ path shape
// A REST path reads in the same order the command does: scope, then command,
// then the one argument the command takes bare. Anything the caller names
// stays in the query or the body.
for (const r of routes) {
  const segments = r.routePath.split('/').filter(x => x !== '')
  const params = segments.filter(x => x.startsWith('{'))

  for (const [i, seg] of segments.entries()) {
    if (!seg.startsWith('{')) continue
    const name = seg.slice(1, -1)
    if (name === 'sessionId') continue
    if (i !== segments.length - 1) {
      fail(
        'path shape',
        `${r.method} ${r.routePath} puts {${name}} before a literal segment; ` +
          'a positional is the final segment'
      )
    }
  }

  // `{sessionId}` is scope, so it may lead; nothing else may repeat it.
  if (params.length > 2) {
    fail(
      'path shape',
      `${r.method} ${r.routePath} takes more than one argument`
    )
  }

  // A plural collection segment means the call acts on many; these all act on
  // exactly one.
  for (const seg of segments) {
    if (seg === 'wallets' || seg === 'objects' || seg === 'swap-quotes') {
      fail(
        'path shape',
        `${r.method} ${r.routePath} names "${seg}" plural but acts on one`
      )
    }
  }

  // The positional must actually be on the path, or the CLI and REST disagree
  // about where the argument goes.
  const pos = r.cli?.positional
  if (pos != null && r.cli?.positionalInPath !== false) {
    if (!r.routePath.endsWith(`/{${pos}}`)) {
      fail(
        'path shape',
        `${r.method} ${r.routePath} declares positional "${pos}" but does not ` +
          'carry it as the final path segment'
      )
    }
  }

  // A written `path` carries scope and command only. The positional is
  // appended from `cli.positional`, so spelling it out here would be a second
  // copy of the same name, free to disagree with the first. `{sessionId}` is
  // scope rather than an argument, and a route with no command has nothing to
  // derive from.
  for (const m of r.declaredPath.matchAll(/\{(\w+)\}/g)) {
    if (m[1] === 'sessionId') continue
    if (r.cli == null) continue
    fail(
      'path shape',
      `${r.id} writes {${m[1]}} into its path; declare ` +
        `\`positional: '${m[1]}'\` on the command and let the path derive it`
    )
  }
}

// ---------------------------------------------------------------- commands
const claimed = new Set<string>()
for (const r of routes) {
  for (const cli of [r.cli, ...r.cliExtra]) {
    if (cli == null) continue
    claimed.add(cli.command)
    if (!commands.has(cli.command)) {
      fail(
        'phantom command',
        `"${cli.command}" claimed by ${r.id} is not registered`
      )
    }
  }
}
for (const name of commands) {
  if (!claimed.has(name) && !LOCAL_ONLY_COMMANDS.has(name)) {
    fail('undeclared command', `"${name}" is registered but no route claims it`)
  }
}

// ------------------------------------------------------------------- flags
// A command may serve several routes, so gather what it declares across all.
const declaredFlags = new Map<string, Set<string>>()
for (const r of routes) {
  for (const cli of [r.cli, ...r.cliExtra]) {
    if (cli == null) continue
    const set = declaredFlags.get(cli.command) ?? new Set<string>()
    for (const f of cli.flags) set.add(f.name)
    for (const x of cli.extra) set.add(x.name)
    if (cli.bodyFlag != null) set.add(cli.bodyFlag)
    // Fields with no override become their kebab-cased name.
    for (const f of [...(r.query ?? []), ...(r.body ?? [])]) {
      if (f.name === cli.positional) continue
      set.add(kebab(f.name))
    }
    declaredFlags.set(cli.command, set)
  }
}
for (const [command, real] of flagsByCommand) {
  const declared = declaredFlags.get(command)
  if (declared == null) continue
  for (const name of real) {
    if (!declared.has(name)) {
      fail(
        'undeclared flag',
        `"${command}" accepts --${name}, no route declares it`
      )
    }
  }
}

// -------------------------------------------------------------- core calls
for (const r of routes) {
  if (r.core == null) {
    if (r.coreNote == null || r.coreNote === '') {
      fail('missing core note', `${r.id} has no core call and no @coreNote`)
    }
    continue
  }
  const member = r.core.split('.').pop() ?? ''
  const haystack = r.core.includes('$internalStuff')
    ? internalSource
    : coreSource
  if (haystack !== '' && !new RegExp(`\\b${member}\\b`).test(haystack)) {
    fail('unknown core call', `${r.id} names "${r.core}", absent from core`)
  }
}

// ------------------------------------------------------------------ shapes
const knownCodes = new Set(errorCodes.map(e => e.code))
for (const r of routes) {
  for (const code of r.errors) {
    if (!knownCodes.has(code)) {
      fail('unknown error code', `${r.id} lists "${code}"`)
    }
  }
  if (r.summary === '') fail('missing summary', `${r.id} has no JSDoc summary`)
}

// ------------------------------------------------- paths named in the prose
// Narrative text is not generated, so a rename can leave it behind. Any
// `METHOD /path` mentioned anywhere in the docs must be a real route.
const realPaths = new Set(routes.map(r => `${r.method} ${r.routePath}`))
/** Paths on other services that the prose legitimately mentions. */
const EXTERNAL_PATHS = new Set(['GET /v1/getKeys'])
const proseSources: Array<[string, string]> = []
for (const file of ['docs/EDGE_CLI.md', 'docs/api/README.md']) {
  const full = path.join(ROOT, file)
  if (fs.existsSync(full))
    proseSources.push([file, fs.readFileSync(full, 'utf8')])
}
for (const r of routes) {
  const text = [
    r.summary,
    r.description ?? '',
    ...r.notes,
    r.coreNote ?? ''
  ].join(' ')
  proseSources.push([r.id, text])
}
for (const [where, text] of proseSources) {
  for (const m of text.matchAll(
    /\b(GET|POST|PUT|PATCH|DELETE) (\/[\w{}/-]+)/g
  )) {
    const cited = `${m[1]} ${m[2]}`
    // `…` stands in for an elided prefix; only check fully-written paths.
    if (m[2].includes('…')) continue
    if (!realPaths.has(cited) && !EXTERNAL_PATHS.has(cited)) {
      fail(
        'stale path in prose',
        `${where} cites "${cited}", which is not a route`
      )
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s):\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(
  `✓ surface matches: ${routes.length} routes, ` +
    `${claimed.size} of ${commands.size} commands (${LOCAL_ONLY_COMMANDS.size} local-only)`
)
