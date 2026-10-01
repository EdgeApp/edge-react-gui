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
 * These reach a third party the suites cannot stand in for, so they have no
 * coverage at all — not in `test:cli:offline` and not in `test:cli:network`,
 * whose three suites do not mention any of them. The excuse is recorded here
 * so the gate's own output says that plainly rather than implying a script
 * covers them.
 */
const NETWORK_ONLY: Record<string, string> = {
  'rates-query': 'Hits the live rates server; no suite covers it.',
  'rates-usd-to-native': 'Hits the live rates server; no suite covers it.',
  'fetch-swap-quotes':
    'Polls the swap providers and needs funded wallets; no suite covers it.',
  'get-payment-protocol-info':
    'Fetches a BIP70 request from a merchant; no suite covers it.'
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
  [/\brefuses\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([a-z0-9-]+)'/g, 1],
  [/\brefusesInternal\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([a-z0-9-]+)'/g, 1],
  [/\bnotInFakeWorld\(\s*'[^']*'\s*,\s*'[^']*'\s*,\s*'([a-z0-9-]+)'/g, 1],
  [/\bcli\(\s*'([a-z0-9-]+)'/g, 1],
  // testCliSubscribe spawns the held-open command as a child process rather
  // than through a helper: spawn('node', [...CLI, ...BASE, 'subscribe'], …)
  [/\bspawn(?:Sync)?\(\s*'node'[^)]*?'([a-z0-9-]+)'\s*\]/g, 1]
]
const run = new Set<string>()
for (const [pattern, group] of CALL_SITES) {
  for (const m of tests.matchAll(pattern)) run.add(m[group])
}

const missing: string[] = []
const stale: string[] = []
for (const name of [...commands].sort()) {
  const covered = run.has(name)
  const excused = NETWORK_ONLY[name] != null
  if (!covered && !excused) missing.push(name)
  if (covered && excused) stale.push(name)
}

const offline = [...commands].filter(c => run.has(c)).length
if (missing.length > 0 || stale.length > 0) {
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
  process.exit(1)
}
console.log(
  `✓ ${offline}/${commands.size} commands run offline ` +
    `(${Object.keys(NETWORK_ONLY).length} need the network)`
)
