#!/usr/bin/env node
/**
 * After `split-env-json`, split a full `keys.json` into:
 *   - baked `keys.json` — local-only secrets (same keep-list as slimKeysJson)
 *   - `appKeys.json` — Couch / infoRollup payload (plugin maps + globalKeys)
 *
 * Usage:
 *   node -r sucrase/register scripts/splitBakedAndServerKeys.js [dir]
 *
 * Never prints secret values.
 */

const fs = require('fs')
const path = require('path')

const { slimKeys } = require('./slimKeysJson')

const PLUGIN_MAPS = ['corePlugins', 'swapPlugins', 'guiApiKeys', 'rampPlugins']
const GLOBAL_KEY_NAMES = [
  'AZTECO_API_KEY',
  'COINGECKO_API_KEY',
  'IP_API_KEY',
  'STAKEKIT_API_KEY',
  'UNSTOPPABLE_DOMAINS_API_KEY',
  'WALLETCONNECT_PROJECT_ID',
  'KILN_TESTNET_API_KEY',
  'KILN_TESTNET_ACCOUNT_ID',
  'KILN_MAINNET_API_KEY',
  'KILN_MAINNET_ACCOUNT_ID'
]
const NEVER_SERVE_TOP = new Set([
  'EDGE_API_KEY',
  'EDGE_API_SECRET',
  'BUGSNAG_API_KEY',
  'POSTHOG_API_KEY'
])
const NEVER_SERVE_PREFIXES = ['YOLO_', 'SENTRY_']

const isPlainObject = v =>
  v != null && typeof v === 'object' && !Array.isArray(v)

const isNeverServed = key =>
  NEVER_SERVE_TOP.has(key) || NEVER_SERVE_PREFIXES.some(p => key.startsWith(p))

function main() {
  const dir = path.resolve(process.argv[2] ?? '.')
  const keysPath = path.join(dir, 'keys.json')
  const serverPath = path.join(dir, 'appKeys.json')

  if (!fs.existsSync(keysPath)) {
    console.error(`keys.json not found: ${keysPath}`)
    process.exit(1)
  }

  const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'))
  if (!isPlainObject(keys)) {
    console.error('keys.json is not an object')
    process.exit(1)
  }

  const server = {}
  const mapCounts = {}
  for (const mapName of PLUGIN_MAPS) {
    const src = isPlainObject(keys[mapName]) ? keys[mapName] : {}
    const out = {}
    let objects = 0
    let flags = 0
    for (const [id, value] of Object.entries(src)) {
      if (id === 'posthog' && mapName === 'guiApiKeys') continue
      if (isPlainObject(value) || Array.isArray(value)) {
        out[id] = value
        objects++
      } else {
        flags++
      }
    }
    server[mapName] = out
    mapCounts[mapName] = {
      ids: Object.keys(out).length,
      objects,
      flagsSkipped: flags
    }
  }

  const globalKeys = {}
  if (isPlainObject(keys.globalKeys)) {
    for (const [k, v] of Object.entries(keys.globalKeys)) {
      if (isNeverServed(k)) continue
      globalKeys[k] = v
    }
  }
  for (const [k, v] of Object.entries(keys)) {
    if (PLUGIN_MAPS.includes(k) || k === 'globalKeys') continue
    if (isNeverServed(k)) continue
    const named = GLOBAL_KEY_NAMES.includes(k) || k.startsWith('KILN_')
    const leftoverPartner = typeof v === 'string'
    if (named || leftoverPartner) globalKeys[k] = v
  }
  server.globalKeys = globalKeys

  const { slim, kept, dropped } = slimKeys(keys)
  fs.writeFileSync(keysPath, JSON.stringify(slim, null, 2) + '\n', {
    mode: 0o600
  })
  fs.writeFileSync(serverPath, JSON.stringify(server, null, 2) + '\n', {
    mode: 0o600
  })

  console.log(`server maps ${JSON.stringify(mapCounts)}`)
  console.log(
    `server globalKeys ids ${Object.keys(globalKeys).sort().join(',')}`
  )
  console.log(`baked kept (${kept.length}): ${kept.sort().join(', ')}`)
  console.log(`baked dropped (${dropped.length}): ${dropped.sort().join(', ')}`)
  console.log(`wrote ${keysPath}`)
  console.log(`wrote ${serverPath}`)
}

if (require.main === module) main()
