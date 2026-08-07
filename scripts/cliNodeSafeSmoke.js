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
  'src/cli/engine/routes/rates.ts',
  'src/cli/engine/makeCoreContext.ts'
]

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
    { cwd: root, encoding: 'utf8', env: process.env }
  )
  if (result.status !== 0) {
    const out = `${result.stdout || ''}${result.stderr || ''}`
    console.error(`FAIL ${relPath}`)
    console.error(out.trim() || `exit ${result.status}`)
    process.exit(result.status === 0 ? 1 : result.status)
  }
  process.stdout.write(result.stdout || '')
}

function assertCliHelp() {
  const result = spawnSync(
    process.execPath,
    ['-r', 'sucrase/register', 'src/cli/index.ts', '--help'],
    { cwd: root, encoding: 'utf8', env: process.env, timeout: 60_000 }
  )
  if (result.status !== 0) {
    console.error('FAIL cli --help')
    console.error(`${result.stdout || ''}${result.stderr || ''}`.trim())
    process.exit(result.status === 0 ? 1 : result.status)
  }
  console.log('OK cli --help')
}

console.log('cliNodeSafeSmoke: checking shared modules…')
for (const mod of SHARED_MODULES) {
  assertNodeSafe(mod)
}
console.log('cliNodeSafeSmoke: checking CLI entry…')
assertCliHelp()
console.log('cliNodeSafeSmoke: all checks passed')
