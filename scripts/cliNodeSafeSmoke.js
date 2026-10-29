#!/usr/bin/env node
/**
 * Pre-commit / CI smoke: ensure CLI-shared GUI modules stay Node-loadable
 * (no react-native* on the require graph) and the CLI entry parses.
 *
 * Usage: node scripts/cliNodeSafeSmoke.js
 */
'use strict'

const path = require('path')
const { spawnSync } = require('child_process')

// The same list `precommit:cli` decides on, so the gate's reach and the
// modules it checks cannot drift apart.
const { SHARED_MODULES } = require('./util/cliGatePaths')
const { CLI_ENTRIES } = require('./util/moduleGraph')

const root = path.join(__dirname, '..')

const CHILD_TIMEOUT_MS = 60_000

/**
 * A child killed by a signal (segfault in the native addon, OOM, timeout)
 * reports `status: null`, so the exit code has to be derived rather than
 * forwarded — `process.exit(null)` would exit 0 and pass the gate.
 */
function failIfUnsuccessful(result, label) {
  if (result.error == null && result.signal == null && result.status === 0) {
    return
  }
  console.error(`FAIL ${label}`)
  const out = `${result.stdout || ''}${result.stderr || ''}`.trim()
  if (out !== '') console.error(out)
  if (result.error != null)
    console.error(`spawn error: ${result.error.message}`)
  if (result.signal != null) console.error(`killed by signal: ${result.signal}`)
  process.exit(
    typeof result.status === 'number' && result.status !== 0 ? result.status : 1
  )
}

/**
 * The `Module._load` hook that makes a `react-native*` require throw.
 *
 * One source for it, because it guards two kinds of child: a single shared
 * module, and a whole entry point run with `--help`. Both interpolate this
 * constant, so a specifier added here covers the whole gate — a second copy
 * would let half of it go on passing. The entry points used to run with no
 * poison at all, so the 50-odd modules outside `src/cli` that only they
 * reach were checked by nothing.
 */
const POISON = `
const Module = require('module')
const orig = Module._load
Module._load = function (request, parent, isMain) {
  const id = request
  if (
    id === 'react-native' ||
    id.startsWith('react-native/') ||
    id.startsWith('react-native-') ||
    id === '@sentry/react-native' ||
    id.startsWith('@react-native')
  ) {
    const from = parent && parent.filename ? parent.filename : '(unknown)'
    const err = new Error('RN_LEAK ' + id + ' from ' + from)
    err.code = 'RN_LEAK'
    throw err
  }
  return orig.apply(this, arguments)
}
`

function assertNodeSafe(relPath) {
  const abs = path.join(root, relPath)
  const probe = `${POISON}
require(${JSON.stringify(abs)})
console.log('OK ' + ${JSON.stringify(relPath)})
`
  const result = spawnSync(
    process.execPath,
    ['-r', 'sucrase/register', '-e', probe],
    {
      cwd: root,
      encoding: 'utf8',
      env: process.env,
      timeout: CHILD_TIMEOUT_MS
    }
  )
  failIfUnsuccessful(result, relPath)
  process.stdout.write(result.stdout || '')
}

/**
 * An entry point, loaded under the poison and asked for `--help`.
 *
 * `--help` because requiring an entry runs its `main`, and help is the one
 * argument that makes both of them print and exit 0 without touching the
 * network, a socket or the account directory. Loading it is the point: it
 * pulls the whole value-import graph — every module either entry point
 * reaches, most of them outside
 * `src/cli` — so a `react-native` import anywhere in it fails here, whether
 * or not `SHARED_MODULES` happens to name the file.
 */
function assertEntryNodeSafe(relPath) {
  const abs = path.join(root, relPath)
  const probe = `${POISON}
process.argv = [process.argv[0], ${JSON.stringify(abs)}, '--help']
require(${JSON.stringify(abs)})
`
  const result = spawnSync(
    process.execPath,
    ['-r', 'sucrase/register', '-e', probe],
    { cwd: root, encoding: 'utf8', env: process.env, timeout: CHILD_TIMEOUT_MS }
  )
  failIfUnsuccessful(result, `${relPath} --help`)
  console.log(`OK ${relPath} --help`)
}

console.log('cliNodeSafeSmoke: checking shared modules…')
for (const mod of SHARED_MODULES) {
  assertNodeSafe(mod)
}
console.log('cliNodeSafeSmoke: checking CLI entry points…')
for (const entry of CLI_ENTRIES) {
  assertEntryNodeSafe(entry)
}
console.log('cliNodeSafeSmoke: all checks passed')
