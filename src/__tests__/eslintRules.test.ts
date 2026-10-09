import { describe, expect, it } from '@jest/globals'
import { spawnSync } from 'child_process'
import path from 'path'

/**
 * The plugin's `RuleTester` cases, run in their own Node process.
 *
 * The rules are `.mjs` modules, which jest's react-native transform does not
 * load, so the cases live in `scripts/eslint-plugin-edge/ruleTests.mjs` and
 * this asserts the process exits cleanly. Before them nothing ran
 * `no-module-scope-lstrings` against known-bad input — `npm run lint` never
 * fires it on today's tree — so a selector that stopped matching was
 * invisible to every gate.
 */
describe('eslint-plugin-edge rules', () => {
  it('pass their RuleTester cases', () => {
    const root = path.resolve(__dirname, '../..')
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts/eslint-plugin-edge/ruleTests.mjs')],
      { cwd: root, encoding: 'utf8' }
    )
    expect(`${result.stdout}${result.stderr}`).toContain('all passed')
    expect(result.status).toBe(0)
  }, 60_000)
})
