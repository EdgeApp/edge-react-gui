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

const root = path.join(__dirname, '..')

const SHARED_MODULES = [
  'src/util/fiatConstants.ts',
  'src/util/network.ts',
  'src/util/utils.ts',
  'src/util/exchangeRates.ts',
  'src/locales/strings.ts',
  'src/locales/intl.ts',
  'src/locales/bootLocale.ts',
  'src/locales/nodeLocale.ts',
  'src/cli/bootNodeLocale.ts',
  'src/util/txDisplay/index.ts',
  'src/util/localAccountSettings.ts',
  'src/util/spamThreshold.ts',
  'src/util/txTagging/index.ts',
  'src/util/exchangeDenom.ts',
  'src/util/fillTxsFiat.ts',
  'src/util/txExport/index.ts',
  'src/util/exportTxInfo.ts',
  'src/cli/engine/nodeApiSigner.ts',
  'src/util/keysServer.ts',
  'src/cli/engine/fetchPluginKeys.ts',
  'src/cli/engine/makeCoreContext.ts'
]

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

function assertNodeSafe(relPath) {
  const abs = path.join(root, relPath)
  const probe = `
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

function assertCliHelp() {
  const result = spawnSync(
    process.execPath,
    ['-r', 'sucrase/register', 'src/cli/index.ts', '--help'],
    { cwd: root, encoding: 'utf8', env: process.env, timeout: CHILD_TIMEOUT_MS }
  )
  failIfUnsuccessful(result, 'cli --help')
  console.log('OK cli --help')
}

console.log('cliNodeSafeSmoke: checking shared modules…')
for (const mod of SHARED_MODULES) {
  assertNodeSafe(mod)
}
console.log('cliNodeSafeSmoke: checking CLI entry…')
assertCliHelp()
console.log('cliNodeSafeSmoke: all checks passed')
