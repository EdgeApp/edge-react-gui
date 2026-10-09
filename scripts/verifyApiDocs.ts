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

import { groupOrder } from '../docs/api/groups'
import { errorCodes } from '../docs/api/shared'
import * as errorGroups from '../src/cli/engine/errorGroups'
import { asCommandsTableJson } from '../src/cli/generatedSchemas'
import { kindOf } from './cliUsage'
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

/**
 * The generated table, cleaned on load rather than cast.
 *
 * `asCommandsTable` is the writer's own cleaner, so this gate reads the file
 * through the same shape `buildCliCommands` writes it with. A third
 * hand-written `interface` plus a cast is the drift a gate exists to catch,
 * and it suppresses the check in the one place that is supposed to notice.
 */
const generated = asCommandsTableJson(
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

/**
 * Flags each command's parser really accepts, and the kind it reads each one
 * as.
 *
 * The kind, because the name alone was not enough: `login-with-key` and
 * `login-with-pin` accepted `use-login-id` — so both directions of the name
 * check passed — and read it as `'boolstr'`, which demands a value, against
 * a usage line publishing the bare `[--use-login-id[=false]]` the kind
 * refuses.
 */
function registeredFlags(): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>()
  const PAIR =
    /['"]?([a-zA-Z0-9-]+)['"]?\s*:\s*'(string|boolean|repeat|boolstr)'/g
  const flagsIn = (text: string): Map<string, string> => {
    const flags = new Map<string, string>()
    const block = /flags:\s*\{([\s\S]*?)\}/.exec(text)
    if (block == null) return flags
    let m: RegExpExecArray | null
    PAIR.lastIndex = 0
    while ((m = PAIR.exec(block[1])) != null) flags.set(m[1], m[2])
    // A shared flag group, spread in: `...AUTH_FLAGS`. Five login handlers
    // declared the same three auth flags, and reading only the literal pairs
    // made this gate report every one of them as "published but refused" —
    // a false positive that would have argued for keeping the duplication.
    for (const spread of block[1].matchAll(/\.\.\.([A-Z][A-Z0-9_]*)/g)) {
      const decl = new RegExp(
        `const ${spread[1]} = \\{([\\s\\S]*?)\\n\\}`
      ).exec(commandSource)
      if (decl == null) continue
      PAIR.lastIndex = 0
      while ((m = PAIR.exec(decl[1])) != null) flags.set(m[1], m[2])
    }
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
    const flags = body != null ? flagsIn(body[0]) : new Map<string, string>()
    let m: RegExpExecArray | null
    while ((m = callRe.exec(commandSource)) != null) out.set(m[1], flags)
  }
  for (const c of generated.commands) {
    const flags = new Map<string, string>()
    for (const a of c.args) if (a.flag != null) flags.set(a.flag, a.kind)
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
// Path parameters are base58 identifiers, and nothing else. Base58 has no
// `/`, `?` or `#`, so such a value survives a URL as written. A base64 wallet
// id (`7o7i6/tlI+qi…=`) or a free-text username does not: it needs
// percent-encoding, and a caller who forgets gets a 404 rather than an error
// that names the mistake. Those travel as named arguments instead.
const BASE58_PARAMS = new Set([
  'sessionId',
  'objectId',
  'pendingId',
  'lobbyId',
  'syncKey'
])

// A REST path reads in the same order the command does: scope, then command,
// then the one argument the command takes bare. Anything the caller names
// stays in the query or the body.
for (const r of routes) {
  const segments = r.routePath.split('/').filter(x => x !== '')
  const params = segments.filter(x => x.startsWith('{'))

  for (const seg of params) {
    const name = seg.slice(1, -1)
    if (!BASE58_PARAMS.has(name)) {
      fail(
        'path shape',
        `${r.method} ${r.routePath} carries "${name}" on the path; only ` +
          `base58 identifiers (${[...BASE58_PARAMS].join(', ')}) may be path ` +
          'parameters — everything else needs a named argument'
      )
    }
  }

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
  if (pos != null) {
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

// --------------------------------------------------------- section by core
// A call is filed under the object it acts on. That is the rule the reference
// is organised by, and it is easy to break by putting a route in a convenient
// file: `account.createCurrencyWallet` sat in `wallets.ts`, and so appeared
// under Wallet, for as long as nobody read that section closely.
const SECTION_BY_CORE: Array<[RegExp, string]> = [
  [/^context\.\$internalStuff\./, 'admin'],
  [/^context\./, 'context'],
  [/^account\./, 'account'],
  [/^wallet\./, 'wallet'],
  [/^EdgeSwapQuote\./, 'account'],
  [/^EdgeLoginRequest\./, 'account']
]
const sectionOf = new Map<string, string>(
  groupOrder.map(g => [g.id, g.section])
)
for (const r of routes) {
  if (r.core == null) continue
  const rule = SECTION_BY_CORE.find(([re]) => re.test(r.core ?? ''))
  if (rule == null) continue
  const actual = sectionOf.get(r.group)
  if (actual !== rule[1]) {
    fail(
      'section',
      `${r.id} fronts ${r.core} but sits in "${r.group}", which is filed ` +
        `under "${actual ?? '?'}" instead of "${rule[1]}"`
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
//
// This is the set of names the generator *publishes*, derived the same way
// `buildCliCommands` derives them: `cli.flags.find(x => x.maps === field)`
// first, then the kebab-cased field name. Adding both — the override's name
// and the field's — makes the set a superset, which is harmless when asking
// "is an accepted flag declared?" and produces a false positive on every
// renamed field when asking the reverse. Six of those, against three real
// findings, the first time the reverse check ran.
const declaredFlags = new Map<string, Set<string>>()
// And the kind each declaration implies, for the flags whose kind the
// declaration actually fixes: a field's own type through `kindOf` — the
// function `buildCliCommands` generates with — or the explicit `kind` on a
// `cliExtra` entry. A renamed field is in `declaredFlags` under both names,
// so this map is keyed by the name the generator would publish only.
const declaredKinds = new Map<string, Map<string, string>>()
for (const r of routes) {
  for (const cli of [r.cli, ...r.cliExtra]) {
    if (cli == null) continue
    const set = declaredFlags.get(cli.command) ?? new Set<string>()
    const kinds = declaredKinds.get(cli.command) ?? new Map<string, string>()
    for (const f of cli.flags) set.add(f.name)
    for (const x of cli.extra) {
      set.add(x.name)
      kinds.set(x.name, x.kind)
    }
    for (const f of [...(r.query ?? []), ...(r.body ?? [])]) {
      if (f.name === cli.positional) continue
      const mapped = cli.flags.find(x => x.maps === f.name)
      const name = mapped?.name ?? kebab(f.name)
      set.add(name)
      kinds.set(
        name,
        mapped?.repeat === true ? 'repeat' : kindOf(f.type, !f.optional)
      )
    }
    declaredFlags.set(cli.command, set)
    declaredKinds.set(cli.command, kinds)
  }
}
for (const [command, real] of flagsByCommand) {
  const declared = declaredFlags.get(command)
  if (declared == null) continue
  for (const [name, kind] of real) {
    // A `json` field is passed as a string flag and parsed by the command,
    // so the two names for one shape are not a disagreement.
    const want = declaredKinds.get(command)?.get(name)
    const equal =
      want == null || want === kind || (want === 'json' && kind === 'string')
    if (!equal) {
      fail(
        'flag kind disagrees with the declaration',
        `"${command}" reads --${name} as '${kind}', but the route declares ` +
          `it as '${want}' — which is what the usage line publishes`
      )
    }
  }
  for (const name of real.keys()) {
    if (!declared.has(name)) {
      fail(
        'undeclared flag',
        `"${command}" accepts --${name}, no route declares it`
      )
    }
  }
  // And the other direction, which is the one that reaches users. The
  // declaration is what `buildCliHelp` and `cliUsage` publish, so a flag a
  // route declares is printed in the usage line and in `params` whether or
  // not the parser takes it — and for a `custom: true` command the parser is
  // hand-written, so the two drift apart silently. `docs/api/README.md`
  // promises "no flag on one side missing from the other"; only one side was
  // ever checked. `wallet.ts` records two instances of this being fixed by
  // hand with no gate added, and three more were live when this was written.
  for (const name of declared) {
    if (!real.has(name)) {
      fail(
        'published flag the command refuses',
        `"${command}" publishes --${name} in its usage, but its parser ` +
          'answers `Unknown option`'
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

// Every shared group reaches the published surface. `extractRoutes` used to
// read `errors: WALLET_ERRORS` as no codes at all and drop every
// `...WALLET_ERRORS` element, so 56 entries across 21 routes were missing
// from the reference and from `edge-cli help` — and the check above could
// not see it, because it only asks whether an extracted code is a real one
// and the codes were gone before it looked. This asks the other question.
//
// For a group some route *declares*, read out of the route sources rather
// than inferred from the published codes: a group whose codes all vanished
// is exactly the regression, so "some of its codes are published" cannot be
// the test. A group no route mentions is vacuous and skipped, which is what
// lets the commit that adds the groups precede the routes that use them.
const routeSource = fs
  .readdirSync(path.join(ROOT, 'src/cli/engine/routes'))
  .filter(f => f.endsWith('.ts'))
  .map(f =>
    fs.readFileSync(path.join(ROOT, 'src/cli/engine/routes', f), 'utf8')
  )
  .join('\n')
const publishedCodes = new Set(routes.flatMap(r => r.errors))
for (const [group, codes] of Object.entries(errorGroups)) {
  if (!Array.isArray(codes)) continue
  if (!new RegExp(`\\b${group}\\b`).test(routeSource)) continue
  const missing = codes.filter(code => !publishedCodes.has(String(code)))
  if (missing.length > 0) {
    fail(
      'unpublished error group',
      `${group} has ${missing.length} code(s) no route publishes: ` +
        `${missing.join(', ')} — a route declares the group but the ` +
        `extractor did not expand it`
    )
  }
}

// ------------------------------------------------- paths named in the prose
// Narrative text is not generated, so a rename can leave it behind. Any
// `METHOD /path` mentioned anywhere in the docs must be a real route.
const realPaths = new Set(routes.map(r => `${r.method} ${r.routePath}`))
/** Paths on other services that the prose legitimately mentions. */
const EXTERNAL_PATHS = new Set(['GET /v1/infoRollup/{appId}'])
const proseSources: Array<[string, string]> = []
// `buildApiDocs.ts` and `groups.ts` hold the reference's Overview and its
// per-group prose, which ship in `index.html` and `openapi.json` — and they
// were not scanned, so three separate claims in them went out wrong: a
// threat model the engine denies, a warning above the key routes
// that contradicted it, and `POST …/objects/{objectId}/delete`, an endpoint
// that does not exist (the route is `object/delete/{objectId}`, singular,
// with the id last). Published prose is published prose wherever it is
// written.
for (const file of [
  'docs/EDGE_CLI.md',
  'docs/api/README.md',
  'docs/api/groups.ts',
  'scripts/buildApiDocs.ts'
]) {
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

// ---------------------------------------------------------------------------
// The global flags, against the table `docs/EDGE_CLI.md` publishes.
//
// Every route-derived surface in this branch is generated and gated; the
// global flags were the last hand-maintained table, written out in the
// client's help, again in the engine's `printHelp()` and again in the docs,
// and all three had drifted — `-h, --help` was "Display options", "Show
// help" and "Show options".
//
// The two help texts are now rendered from `src/cli/flagTable.ts`, so this
// checks the one remaining copy: the guide's table has to carry every flag
// with the right `Who`, and its description has to *start with* the
// canonical one — the guide may add prose after it, not instead of it.
// ---------------------------------------------------------------------------
{
  const { GLOBAL_FLAGS } = require('../src/cli/flagTable') as {
    GLOBAL_FLAGS: Array<{
      docName: string
      who: 'client' | 'engine' | 'both'
      description: string
    }>
  }
  const docsText = fs.readFileSync(path.join(ROOT, 'docs/EDGE_CLI.md'), 'utf8')

  /** Every flag row in the guide's table: name, audience, description. */
  const docRows = new Map<string, { who: string; description: string }>()
  for (const m of docsText.matchAll(
    /^\| `([^`]+)` \| (client|engine|both) \| ([^|]*)\|/gm
  )) {
    docRows.set(m[1].trim(), { who: m[2], description: m[3].trim() })
  }
  if (docRows.size === 0) {
    fail('global flags', 'no flag rows found in docs/EDGE_CLI.md')
  }

  const canonical = new Set(GLOBAL_FLAGS.map(f => f.docName))
  for (const flag of GLOBAL_FLAGS) {
    const row = docRows.get(flag.docName)
    if (row == null) {
      fail(
        'undocumented flag',
        `${flag.docName} is in src/cli/flagTable.ts but not in docs/EDGE_CLI.md`
      )
      continue
    }
    if (row.who !== flag.who) {
      fail(
        'wrong audience',
        `${flag.docName} is "${flag.who}" in src/cli/flagTable.ts and "${row.who}" in docs/EDGE_CLI.md`
      )
    }
    if (!row.description.startsWith(flag.description)) {
      fail(
        'flag description drift',
        `${flag.docName} reads "${row.description}" in docs/EDGE_CLI.md; it must begin with "${flag.description}"`
      )
    }
  }
  for (const name of docRows.keys()) {
    if (!canonical.has(name)) {
      fail(
        'stale documented flag',
        `${name} is in docs/EDGE_CLI.md but not in src/cli/flagTable.ts`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// User-facing text with no reader.
//
// Two single-source claims were false. Fifteen commands carried a
// hand-written `help:` string that nothing rendered — `help.ts` reads
// `docs?.summary ?? target.help`, and a command with a route always has a
// summary — so each was a second description of a command, worded
// differently from the one that ships, that a maintainer could fix without
// changing anything a user sees. And two of `fieldDocs.ts`'s constants, the
// module whose whole purpose is to be the one place a repeated field is
// described, had no importer, one of them stating the field differently from
// the description actually published.
//
// Both are the same defect: a string a reader believes is the source and
// isn't. So both are gated rather than tidied.
// ---------------------------------------------------------------------------
{
  const helpDocs = new Set(
    Object.keys(
      (
        JSON.parse(
          fs.readFileSync(
            path.join(ROOT, 'src/cli/generated/helpDocs.json'),
            'utf8'
          )
        ) as { commands: Record<string, { summary?: string }> }
      ).commands
    )
  )
  for (const m of commandSource.matchAll(
    /(?<![\w.])(?:command|objectIdCmd|walletActionCmd)\(\s*'([a-z0-9-]+)',\s*\{([\s\S]*?)\n {2}\},/g
  )) {
    if (!m[2].includes('\n    help: ')) continue
    if (helpDocs.has(m[1])) {
      fail(
        'unreachable help string',
        `${m[1]} has a help: string and a generated summary, so help.ts never reads it`
      )
    }
  }

  const fieldDocs = fs.readFileSync(
    path.join(ROOT, 'src/cli/engine/fieldDocs.ts'),
    'utf8'
  )
  const users = [
    read(path.join(ROOT, 'src/cli/engine/routes')),
    fs.readFileSync(path.join(ROOT, 'src/cli/engine/schemas.ts'), 'utf8')
  ].join('\n')
  for (const m of fieldDocs.matchAll(/^export const (\w+_DOC)\b/gm)) {
    if (!new RegExp(`\\b${m[1]}\\b`).test(users)) {
      fail(
        'unused field description',
        `${m[1]} is declared in src/cli/engine/fieldDocs.ts and used by no schema or route`
      )
    }
  }
}

// ---------------------------------------------------------------------------
// The module map in `docs/EDGE_CLI.md`, against `src/cli/engine/`.
//
// The guide claimed the map was complete and credited
// `scripts/cliNodeSafeSmoke.js` with keeping it so. That script loads a
// hand-written list of shared GUI modules and the client entry; it says
// nothing about this map, and two modules added after the claim was written
// were missing from it. So the claim is gated here instead of asserted
// there — the map is the only hand-maintained inventory of the engine left,
// and a reader uses it to find the module that owns a concern.
// ---------------------------------------------------------------------------
{
  const docsText = fs.readFileSync(path.join(ROOT, 'docs/EDGE_CLI.md'), 'utf8')
  const engineDir = path.join(ROOT, 'src/cli/engine')
  const listed = new Set<string>()
  for (const m of docsText.matchAll(/^ {4}(\w[\w.]*\.ts)\b/gm)) {
    listed.add(m[1])
  }
  for (const name of fs.readdirSync(engineDir)) {
    if (!name.endsWith('.ts')) continue
    if (!listed.has(name)) {
      fail(
        'module missing from the map',
        `src/cli/engine/${name} is not in the module map in docs/EDGE_CLI.md`
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
