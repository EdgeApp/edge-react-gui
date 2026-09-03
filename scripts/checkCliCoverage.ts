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

const ROOT = path.resolve(__dirname, '..')

/**
 * Commands no test can reach, and why.
 *
 * Each of these calls a third-party API over the real internet, which the fake
 * world does not intercept, so they cannot run in a pre-commit hook.
 * `npm run test:cli:network` is where they belong.
 */
const NETWORK_ONLY: Record<string, string> = {}

const generated = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/cli/generated/commands.json'), 'utf8')
) as { commands: Array<{ command: string }> }

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
const run = new Set([...tests.matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1]))

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
