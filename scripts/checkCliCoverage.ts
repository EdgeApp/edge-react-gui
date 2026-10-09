/**
 * Which commands no automated test ever runs.
 *
 * Live coverage was about half the surface until the fake world existed, and
 * the only way anyone knew that was by counting by hand. This counts instead,
 * and fails on a command that nothing exercises unless it is listed below with
 * a reason.
 */
import fs from 'fs'
import path from 'path'

import { asCommandsTableJson } from '../src/cli/generatedSchemas'

const ROOT = path.resolve(__dirname, '..')

/**
 * Commands no automated suite exercises, and why.
 *
 * Empty, and the gate below fails on an entry an offline test does reach, so
 * it stays empty while the suites can refuse a bad request without a server.
 * `get-payment-protocol-info` was the last entry: it fetches a BIP70 request
 * from a merchant, which no suite can stand in for, but a URL that is not a
 * URL fails inside the plugin before any socket opens — so the offline suite
 * can pin how the route classifies it, which is the part that was wrong.
 *
 * A command that reaches a third party the suites cannot stand in for goes
 * here with its reason, so the gate's own output says it has no coverage
 * rather than implying a script covers it.
 */
const NETWORK_ONLY: Record<string, string> = {}

/**
 * Commands whose only offline call site is a refusal, and what covers them.
 *
 * A refusal is not coverage of the handler: `refuses('…', 'INSUFFICIENT_FUNDS',
 * 'spend', …)` proves the route rejects a request, and the body past that
 * rejection never runs. This gate counted the two the same way and printed
 * "118/118 commands run offline" — a figure quoted elsewhere at the time,
 * over a surface a quarter of which no handler ever ran for.
 *
 * In the fake world `makeFakeCoreContext` builds the real currency plugins,
 * so a wallet there has no funds and no network: the commands below cannot
 * reach a success inside `testCliFake.ts` at all. Each says what does reach
 * it instead. A value that starts with `src/` is a suite path and is checked
 * to exist, so deleting the suite an entry names fails this gate — the only
 * read used to be `REFUSAL_ONLY[name] == null`, so removing
 * `spendHandlers.test.ts` left it printing `✓ … 28 refusal-only`. A value
 * that is not a path is an unverified prose reason, and says why the command
 * cannot run offline at all.
 */
const REFUSAL_ONLY: Record<string, string> = {
  // The spend path: no funds in the fake world, so these are driven through
  // their handlers with a wallet whose four core calls resolve.
  spend: 'src/__tests__/cli/spendHandlers.test.ts',
  'spend-max': 'src/__tests__/cli/spendHandlers.test.ts (useMax)',
  'make-spend': 'src/__tests__/cli/spendHandlers.test.ts',
  'sign-tx': 'src/__tests__/cli/spendHandlers.test.ts (staged flow)',
  'broadcast-tx': 'src/__tests__/cli/spendHandlers.test.ts (staged flow)',
  'save-tx': 'src/__tests__/cli/spendHandlers.test.ts (staged flow)',
  accelerate: 'src/__tests__/cli/spendHandlers.test.ts',
  'save-tx-metadata': 'src/__tests__/cli/saveTxHandlers.test.ts',
  'save-tx-action': 'src/__tests__/cli/saveTxHandlers.test.ts',
  // A voucher exists only while a login is waiting on 2FA, so there is none
  // to approve or reject offline — and the refusals are now the whole of
  // what the offline suite can reach, since an id that is not pending is
  // refused rather than forwarded.
  'approve-voucher': 'src/__tests__/cli/vouchers.test.ts',
  'reject-voucher': 'src/__tests__/cli/vouchers.test.ts',
  'sweep-private-keys': 'needs a funded key to sweep from',
  'get-payment-protocol-info':
    'fetches a BIP70 request from a merchant; the refusal pins the ' +
    'classification, which is the part that was wrong',

  // Handles: only a spend or a swap produces one, and neither completes
  // offline.
  'object-get':
    'src/__tests__/cli/routeHelpers.test.ts (handler and projection)',
  'object-delete': 'src/__tests__/cli/routeHelpers.test.ts (handler)',

  // Swaps need a live partner to quote.
  'fetch-swap-quotes': 'needs a swap partner to answer a quote',
  'swap-quote-get': 'needs a live quote handle',
  'approve-swap-quote': 'needs a live quote handle',
  'close-swap-quote': 'needs a live quote handle',

  // Rates come from the exchange-rate servers.
  'rates-query': 'src/__tests__/cli/ratesRoutes.test.ts',
  'rates-usd-to-native': 'src/__tests__/cli/ratesRoutes.test.ts',

  // The admin routes talk to a real sync server or a real lobby.
  'admin-sync-repo': 'needs a sync server to push to',
  'admin-repo-get': 'needs a repo on a sync server',
  'admin-repo-set': 'needs a repo on a sync server',
  'admin-send-lobby-reply': 'needs a lobby on the login server',

  // Login-server flows the fake server does not implement.
  'request-otp-reset': 'needs the login server to start a timed reset',
  'cancel-otp-reset': 'needs a reset in progress on the login server',
  'delete-remote-account': 'the fake login server cannot serve it yet',
  'fetch-challenge': 'the fake login server cannot issue a CAPTCHA',
  'forget-account':
    'the one local user is the logged-in one, so only the refusal is ' +
    'reachable in a single-account fake world'
}

// Cleaned on load, through the writer's own cleaner: a second hand-written
// shape with a cast is what lets a reader and the writer part ways, which is
// the drift this gate is here to notice.
const generated = asCommandsTableJson(
  fs.readFileSync(path.join(ROOT, 'src/cli/generated/commands.json'), 'utf8')
)

const commands = new Set(generated.commands.map(c => c.command))
const handDir = path.join(ROOT, 'src/cli/commands')
for (const file of fs.readdirSync(handDir)) {
  const text = fs.readFileSync(path.join(handDir, file), 'utf8')
  for (const m of text.matchAll(/\bcommand\(\s*'([a-z0-9-]+)'/g)) {
    commands.add(m[1])
  }
}

const tests = ['scripts/testCliFake.ts', 'scripts/testCliSubscribe.ts']
  .map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'))
  .join('\n')

/**
 * Commands the offline suites actually invoke.
 *
 * Read from the call sites, not from every quoted string in the file: the
 * helpers each take the command name at a known position, so
 *   ok('label', 'command', …)
 *   refuses('label', 'CODE', 'command', …)
 *   refusesInternal('label', 'message', 'command', …)
 *   notInFakeWorld('label', 'marker', 'command', …)
 *   cli('command', …)
 * A bare scan counted labels, comments, URL fragments and unrelated literals,
 * so a command that was merely mentioned passed the gate. This can still
 * under-count — a command invoked through a variable is invisible — which is
 * the safe direction for a coverage gate to be wrong in.
 */
const CALL_SITES: Array<[RegExp, number]> = [
  [/\bok\(\s*'[^']*'\s*,\s*'([a-z0-9-]+)'/g, 1],
  [/\bcli\(\s*'([a-z0-9-]+)'/g, 1],
  // testCliSubscribe spawns the held-open command as a child process rather
  // than through a helper: spawn('node', [...CLI, ...BASE, 'subscribe'], …)
  [/\bspawn(?:Sync)?\(\s*'node'[^)]*?'([a-z0-9-]+)'\s*\]/g, 1]
]

/**
 * The same, for the helpers that assert a *refusal*.
 *
 * Counted apart, because the handler body does not run: these three prove the
 * route rejects a request, which is worth having and is not coverage of what
 * the command does.
 */
const REFUSAL_SITES: Array<[RegExp, number]> = [
  [/\brefuses\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([a-z0-9-]+)'/g, 1],
  [/\brefusesInternal\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([a-z0-9-]+)'/g, 1],
  [/\bnotInFakeWorld\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([a-z0-9-]+)'/g, 1]
]

const matched = (sites: Array<[RegExp, number]>): Set<string> => {
  const found = new Set<string>()
  for (const [pattern, group] of sites) {
    for (const m of tests.matchAll(pattern)) found.add(m[group])
  }
  return found
}
const reached = matched(CALL_SITES)
const refused = matched(REFUSAL_SITES)
const run = new Set<string>([...reached, ...refused])

const missing: string[] = []
const stale: string[] = []
const unexcusedRefusals: string[] = []
const staleRefusals: string[] = []
// A named suite that is not there any more. The reason half cannot be
// checked; the path half can, and the four entries that named a suite
// covering something else were found by writing this.
const missingSuites: string[] = []
for (const [name, excuse] of Object.entries(REFUSAL_ONLY)) {
  // Only for a command this tree has. An entry for a command the next
  // commit adds names a suite that arrives with it, and this gate runs on
  // every commit's own tree.
  if (!commands.has(name)) continue
  if (!excuse.startsWith('src/')) continue
  const file = excuse.split(' ')[0]
  if (!fs.existsSync(path.join(ROOT, file))) {
    missingSuites.push(`${name}: ${file}`)
  }
}
for (const name of [...commands].sort()) {
  const covered = run.has(name)
  const excused = NETWORK_ONLY[name] != null
  if (!covered && !excused) missing.push(name)
  if (covered && excused) stale.push(name)
  if (!reached.has(name) && refused.has(name) && !excused) {
    if (REFUSAL_ONLY[name] == null) unexcusedRefusals.push(name)
  }
  if (reached.has(name) && REFUSAL_ONLY[name] != null) {
    staleRefusals.push(name)
  }
}

const offline = [...commands].filter(c => reached.has(c)).length
if (
  missing.length > 0 ||
  stale.length > 0 ||
  unexcusedRefusals.length > 0 ||
  staleRefusals.length > 0 ||
  missingSuites.length > 0
) {
  console.error('✗ CLI coverage:\n')
  for (const name of missing) {
    console.error(
      `  ${name}: no offline test runs it. Add one to testCliFake.ts, or ` +
        'list it in NETWORK_ONLY with the reason it cannot run offline.'
    )
  }
  for (const name of stale) {
    console.error(
      `  ${name}: listed as network-only, but an offline test runs it. ` +
        'Remove the entry.'
    )
  }
  for (const name of unexcusedRefusals) {
    console.error(
      `  ${name}: the only offline call site is a refusal, so the handler ` +
        'never runs. Add an `ok(…)` case, or list it in REFUSAL_ONLY with ' +
        'the suite that drives it or the reason it cannot run offline.'
    )
  }
  for (const name of staleRefusals) {
    console.error(
      `  ${name}: listed in REFUSAL_ONLY, but an offline test now reaches ` +
        'its handler. Remove the entry.'
    )
  }
  for (const entry of missingSuites) {
    console.error(
      `  ${entry}: the suite this entry names is not there. Point it at the ` +
        'suite that drives the handler now, or give a reason instead.'
    )
  }
  process.exit(1)
}
console.log(
  `✓ ${offline}/${commands.size} commands reach their handler offline, ` +
    `${Object.keys(REFUSAL_ONLY).length} refusal-only, ` +
    `${Object.keys(NETWORK_ONLY).length} with no offline test`
)
