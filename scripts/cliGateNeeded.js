#!/usr/bin/env node
/**
 * Pre-commit decision: do the staged changes need the CLI gates?
 *
 * Exit 0 means no — and prints the one line that says so. Exit 1 means yes,
 * which is what makes `precommit:cli`'s `||` run them. The decision used to
 * be an inline `git diff --cached --quiet` in `package.json` with its own
 * pathspec; see `scripts/util/cliGatePaths.js` for what that missed.
 *
 * Usage: node scripts/cliGateNeeded.js
 */
'use strict'

const { spawnSync } = require('child_process')
const path = require('path')

const { GATE_PATHS, uncoveredModules } = require('./util/cliGatePaths')

const root = path.join(__dirname, '..')

// A shared module outside every gate path means the gates cannot see an edit
// to it, so the honest answer to "do we need them?" is yes, loudly.
const uncovered = uncoveredModules()
if (uncovered.length > 0) {
  console.error(
    'FAIL: these CLI-shared modules are outside every gate path: ' +
      `${uncovered.join(', ')}. Add the path to GATE_PATHS in ` +
      'scripts/util/cliGatePaths.js.'
  )
  process.exit(1)
}

const result = spawnSync(
  'git',
  ['diff', '--cached', '--quiet', '--', ...GATE_PATHS],
  { cwd: root, encoding: 'utf8' }
)
// `--quiet` exits 1 when there is a difference. Anything else — git missing,
// a signal — is not an answer, so the gates run.
if (result.status === 0 && result.error == null && result.signal == null) {
  console.log('· no CLI changes staged; skipping the CLI gates')
  process.exit(0)
}
process.exit(1)
