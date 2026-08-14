/**
 * Split a legacy `env.json` into `config.json` (non-secret) + `keys.json`
 * (secret). Classification lives here with the CLI — it is migration-only and
 * is not part of the app runtime.
 *
 * Usage:
 *   socket npm run split-env-json
 *   socket npm run split-env-json -- --force
 *   socket npm run split-env-json -- path/to/env.json
 *   socket npm run split-env-json -- --force path/to/env.json outDir/
 *
 * Never prints secret values. Refuses to overwrite existing outputs unless
 * `--force` is passed.
 */

import { asMap, asUnknown } from 'cleaners'
import fs from 'fs'
import path from 'path'

import { deepMerge, isPlainObject } from '../src/configKeysMerge'

const asUnknownMap = asMap(asUnknown)

/** Legacy `*_INIT` field name -> edge-core currency plugin ID. */
export const CURRENCY_INIT_MAP: Record<string, string> = {
  ABSTRACT_INIT: 'abstract',
  ALGORAND_INIT: 'algorand',
  AMOY_INIT: 'amoy',
  ARBITRUM_INIT: 'arbitrum',
  AVALANCHE_INIT: 'avalanche',
  AXELAR_INIT: 'axelar',
  BASE_INIT: 'base',
  BINANCE_SMART_CHAIN_INIT: 'binancesmartchain',
  BOTANIX_INIT: 'botanix',
  CARDANO_INIT: 'cardano',
  CARDANO_TESTNET_INIT: 'cardanotestnet',
  MAYACHAIN_INIT: 'mayachain',
  CELO_INIT: 'celo',
  COREUM_INIT: 'coreum',
  COSMOSHUB_INIT: 'cosmoshub',
  ECASH_INIT: 'ecash',
  ETHEREUM_INIT: 'ethereum',
  ETHEREUM_POW_INIT: 'ethereumpow',
  FANTOM_INIT: 'fantom',
  FILECOIN_INIT: 'filecoin',
  FILECOINFEVM_INIT: 'filecoinfevm',
  FILECOINFEVM_CALIBRATION_INIT: 'filecoinfevmcalibration',
  FIO_INIT: 'fio',
  HEDERA_INIT: 'hedera',
  HOLESKY_INIT: 'holesky',
  HYPEREVM_INIT: 'hyperevm',
  LIBERLAND_INIT: 'liberland',
  OPBNB_INIT: 'opbnb',
  MONAD_INIT: 'monad',
  MONERO_INIT: 'monero',
  NYM_INIT: 'nym',
  OPTIMISM_INIT: 'optimism',
  OSMOSIS_INIT: 'osmosis',
  POLKADOT_INIT: 'polkadot',
  POLYGON_INIT: 'polygon',
  PULSECHAIN_INIT: 'pulsechain',
  RSK_INIT: 'rsk',
  SEPOLIA_INIT: 'sepolia',
  SOLANA_INIT: 'solana',
  SONIC_INIT: 'sonic',
  THORCHAIN_INIT: 'thorchainrune',
  TON_INIT: 'ton',
  ZKSYNC_INIT: 'zksync',
  BITCOIN_INIT: 'bitcoin',
  BITCOINCASH_INIT: 'bitcoincash',
  DASH_INIT: 'dash',
  DIGIBYTE_INIT: 'digibyte',
  DOGE_INIT: 'dogecoin',
  GROESTLCOIN_INIT: 'groestlcoin',
  LITECOIN_INIT: 'litecoin',
  PIVX_INIT: 'pivx',
  ZCOIN_INIT: 'zcoin'
}

/** Legacy `*_INIT` field name -> swap plugin ID. */
export const SWAP_INIT_MAP: Record<string, string> = {
  CHANGEHERO_INIT: 'changehero',
  CHANGE_NOW_INIT: 'changenow',
  CHANGELLY_INIT: 'changelly',
  EXOLIX_INIT: 'exolix',
  GODEX_INIT: 'godex',
  LIFI_INIT: 'lifi',
  LETSEXCHANGE_INIT: 'letsexchange',
  NEXCHANGE_INIT: 'nexchange',
  SIDESHIFT_INIT: 'sideshift',
  SWAPUZ_INIT: 'swapuz',
  XGRAM_INIT: 'xgram',
  NYM_SWAP_INIT: 'nymswap',
  BRIDGELESS_INIT: 'bridgeless',
  RANGO_INIT: 'rango',
  MAYA_PROTOCOL_INIT: 'mayaprotocol',
  THORCHAIN_INIT: 'thorchain',
  SWAPKIT_INIT: 'swapkit',
  SWAPKITV3_INIT: 'swapkitv3',
  TOMB_SWAP_INIT: 'tombSwap',
  XRPDEX_INIT: 'xrpdex',
  '0XGASLESS_INIT': '0xgasless'
}

// Field names (in plugin init objects) that hold secrets and therefore belong
// in keys.json rather than the committable config.json.
// Case-insensitive. Prefer generic patterns; name only what the generics miss.
// `apiKey(?!s)` already covers *ApiKey fields. `tonCenterApiKeys` needs an
// explicit entry because the `(?!s)` lookahead excludes the trailing `s`.
// Partner / affiliate identifiers that look "public" still go to keys.json so
// they can be rotated via signed infoRollup appKeys without a store release.
const SECRET_FIELD_RE =
  /(apiKey(?!s)|API_KEY|SECRET|TOKEN|DSN|ACCOUNT_ID|PROJECT_SLUG|ORGANIZATION_SLUG|privateKey|hmacUser|ninerealmsClientId|tonCenterApiKeys|projectId|affiliateId|partnerId|referrerAddress|publicKey|orgId)/i

// Top-level env fields that are secret regardless of their (non-object) value.
// Loose partner secrets and auth + Sentry all land flat in keys.json; the
// server delivers the same loose secrets nested under a `globalKeys` section.
const SECRET_TOP_LEVEL = new Set([
  'EDGE_API_KEY',
  'EDGE_API_SECRET',
  'AIRBITZ_API_KEY',
  'BUGSNAG_API_KEY',
  'CMC_PRO_API_KEY'
])
const SECRET_TOP_LEVEL_PREFIXES = ['SENTRY_']

/**
 * Loose partner secrets that are the "global keys": stored flat in keys.json
 * (not inside a plugin map). The signed infoRollup `appKeys` overlay delivers
 * the same secrets nested under `globalKeys`.
 */
const GLOBAL_KEYS_FIELDS = new Set([
  'AZTECO_API_KEY',
  'COINGECKO_API_KEY',
  'IP_API_KEY',
  'STAKEKIT_API_KEY',
  'UNSTOPPABLE_DOMAINS_API_KEY',
  'WALLETCONNECT_PROJECT_ID',
  'POSTHOG_API_KEY'
])
const GLOBAL_KEYS_PREFIXES = ['KILN_']

/**
 * Top-level legacy fields to drop entirely on split (neither config nor keys).
 * Unused leftovers that no runtime code reads.
 */
const DROP_TOP_LEVEL = new Set(['ZEC_NODE'])

/**
 * PLUGIN_API_KEYS providers to drop entirely on split (neither config nor
 * keys). Retired partners that should not ship in either file.
 */
function shouldDropPluginApiKeyProvider(provider: string): boolean {
  const id = provider.toLowerCase()
  if (id === 'bity') return true
  if (id === 'ionia' || id.startsWith('ionia-')) return true
  if (id === 'kado' || id.startsWith('kado')) return true
  return false
}

function isGlobalKeysField(field: string): boolean {
  if (GLOBAL_KEYS_FIELDS.has(field)) return true
  return GLOBAL_KEYS_PREFIXES.some(prefix => field.startsWith(prefix))
}

export function isSecretField(fieldName: string): boolean {
  return SECRET_FIELD_RE.test(fieldName)
}

export function isSecretTopLevel(field: string): boolean {
  if (SECRET_TOP_LEVEL.has(field)) return true
  if (SECRET_TOP_LEVEL_PREFIXES.some(prefix => field.startsWith(prefix))) {
    return true
  }
  return isSecretField(field)
}

export interface ConfigFile {
  [key: string]: unknown
  corePlugins: Record<string, unknown>
  swapPlugins: Record<string, unknown>
  guiApiKeys: Record<string, unknown>
  rampPlugins: Record<string, unknown>
}

export interface KeysFile {
  [key: string]: unknown
  corePlugins: Record<string, unknown>
  swapPlugins: Record<string, unknown>
  guiApiKeys: Record<string, unknown>
  rampPlugins: Record<string, unknown>
}

export interface SplitResult {
  config: ConfigFile
  keys: KeysFile
}

/**
 * Legacy XOR mask used by `asObfuscatedString` (not a secret). A handful of
 * env.json fields — notably Changelly's apiKey — were stored as char-code
 * arrays XOR'd with this constant. Decode them to plain strings at split time
 * so keys.json never carries the array form the plugins cannot consume.
 */
const OBFUSCATION_MASK = 0x5a

function isCharCodeArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(item => typeof item === 'number')
  )
}

function deobfuscateSecret(path: string, value: unknown): unknown {
  if (!isCharCodeArray(value)) return value
  const plain = String.fromCharCode(
    ...value.map(code => code ^ OBFUSCATION_MASK)
  )
  console.log(
    `deobfuscated ${path} (${value.length} codes -> ${plain.length} chars)`
  )
  return plain
}

/**
 * Classify a legacy plugin init value for the flag-only config model.
 *
 * Config only stores enablement: `true` / `false`. The entire init object (or
 * bare string) lands in keys so signed infoRollup appKeys can rotate every
 * field. Char-code arrays on secret-named fields are still deobfuscated at
 * split time.
 */
function splitPluginValue(
  value: unknown,
  path: string
): {
  config: boolean | undefined
  keys: unknown
} {
  if (value === false) return { config: false, keys: undefined }
  if (value === true) return { config: true, keys: undefined }
  if (!isPlainObject(value)) {
    // Bare strings (e.g. moonpay) are keys-only; config stays absent.
    return { config: undefined, keys: deobfuscateSecret(path, value) }
  }

  const keysPart: Record<string, unknown> = {}
  for (const [field, fieldValue] of Object.entries(value)) {
    keysPart[field] = isSecretField(field)
      ? deobfuscateSecret(`${path}.${field}`, fieldValue)
      : fieldValue
  }
  // Empty `{}` is still stored in keys so merge(true, {}) === {} (legacy
  // "enabled with defaults"), rather than collapsing to a bare `true`.
  return { config: true, keys: keysPart }
}

function assignKeys(
  target: Record<string, unknown>,
  id: string,
  value: unknown
): void {
  if (value === undefined) return
  if (isPlainObject(value) && isPlainObject(target[id])) {
    target[id] = deepMerge(target[id], value)
    return
  }
  target[id] = value
}

/**
 * Convert a legacy flat `env.json` object into the split `{ config, keys }`
 * files. Unmapped `*_INIT` fields (and WYRE_CLIENT_INIT) are intentionally
 * dropped; WALLET_CONNECT_INIT becomes a flat keys.WALLETCONNECT_PROJECT_ID
 * string (not a plugin); POSTHOG_INIT becomes config.POSTHOG_API_HOST + a
 * flat keys.POSTHOG_API_KEY; loose partner secrets (Azteco, Kiln, …) land
 * flat in keys.json; YOLO_* stays in config.
 *
 * Plugin maps in config.json are flag-only (`true` / `false`). Init objects
 * live in the matching keys.json map (`corePlugins`, `swapPlugins`,
 * `guiApiKeys`, `rampPlugins`).
 */
export function splitEnv(legacyEnv: unknown): SplitResult {
  const env = isPlainObject(legacyEnv) ? legacyEnv : {}

  const config: ConfigFile = {
    corePlugins: {},
    swapPlugins: {},
    guiApiKeys: {},
    rampPlugins: {}
  }
  const keys: KeysFile = {
    corePlugins: {},
    swapPlugins: {},
    guiApiKeys: {},
    rampPlugins: {}
  }

  for (const [field, value] of Object.entries(env)) {
    const coreId = CURRENCY_INIT_MAP[field]
    const swapId = SWAP_INIT_MAP[field]

    if (coreId != null || swapId != null) {
      const { config: flag, keys: init } = splitPluginValue(value, field)
      if (coreId != null) {
        if (flag !== undefined) config.corePlugins[coreId] = flag
        assignKeys(keys.corePlugins, coreId, init)
      }
      if (swapId != null) {
        if (flag !== undefined) config.swapPlugins[swapId] = flag
        assignKeys(keys.swapPlugins, swapId, init)
      }
      continue
    }

    if (field === 'PLUGIN_API_KEYS') {
      for (const [provider, providerValue] of Object.entries(
        asUnknownMap(value ?? {})
      )) {
        if (shouldDropPluginApiKeyProvider(provider)) continue
        const path = `PLUGIN_API_KEYS.${provider}`
        if (provider === 'posthog') {
          // Legacy: posthog lived under PLUGIN_API_KEYS; promote out of plugins.
          if (isPlainObject(providerValue)) {
            if (typeof providerValue.apiHost === 'string') {
              config.POSTHOG_API_HOST = providerValue.apiHost
            }
            if (providerValue.apiKey != null) {
              keys.POSTHOG_API_KEY = deobfuscateSecret(
                `${path}.apiKey`,
                providerValue.apiKey
              )
            }
          }
          continue
        }
        const { config: flag, keys: init } = splitPluginValue(
          providerValue,
          path
        )
        if (flag !== undefined) config.guiApiKeys[provider] = flag
        assignKeys(keys.guiApiKeys, provider, init)
      }
      continue
    }

    if (field === 'RAMP_PLUGIN_INITS') {
      for (const [id, rampValue] of Object.entries(asUnknownMap(value ?? {}))) {
        const { config: flag, keys: init } = splitPluginValue(
          rampValue,
          `RAMP_PLUGIN_INITS.${id}`
        )
        // Always record a flag for object/boolean ramps so config lists them.
        if (flag !== undefined) config.rampPlugins[id] = flag
        assignKeys(keys.rampPlugins, id, init)
      }
      continue
    }

    if (field === 'POSTHOG_INIT') {
      // Host stays in config; api key is a flat global key.
      if (isPlainObject(value)) {
        if (typeof value.apiHost === 'string') {
          config.POSTHOG_API_HOST = value.apiHost
        }
        if (value.apiKey != null) {
          keys.POSTHOG_API_KEY = deobfuscateSecret(
            `${field}.apiKey`,
            value.apiKey
          )
        }
      }
      continue
    }

    if (field === 'WALLET_CONNECT_INIT') {
      // WalletConnect is not a plugin. Extract projectId as a global key;
      // disable = omit the key. Never write a config flag or a plugin map entry.
      if (value === false || value == null) continue
      if (isPlainObject(value) && value.projectId != null) {
        keys.WALLETCONNECT_PROJECT_ID = deobfuscateSecret(
          `${field}.projectId`,
          value.projectId
        )
      }
      continue
    }

    // Drop all remaining legacy *_INIT fields (unused plugins, WYRE, etc.).
    if (field.endsWith('_INIT')) continue

    // Drop unused top-level leftovers (no runtime reader).
    if (DROP_TOP_LEVEL.has(field)) continue

    // Everything else is a top-level app/debug field.
    if (isGlobalKeysField(field)) {
      keys[field] = deobfuscateSecret(field, value)
      continue
    }
    if (isSecretTopLevel(field)) {
      const plain = deobfuscateSecret(field, value)
      // Legacy env.json used AIRBITZ_API_KEY; the runtime and HMAC auth read
      // EDGE_API_KEY. Rename on split so a migrated keys.json is usable.
      if (field === 'AIRBITZ_API_KEY') {
        keys.EDGE_API_KEY ??= plain
        continue
      }
      keys[field] = plain
    } else config[field] = value
  }

  return { config, keys }
}

function usage(): never {
  console.error(`Usage: splitEnvJson.ts [--force] [env.json] [outDir]

Reads a legacy env.json and writes config.json + keys.json (gitignored).
Defaults: ./env.json -> ./config.json and ./keys.json
Pass --force to overwrite existing output files.`)
  process.exit(1)
}

function parseArgs(argv: string[]): {
  force: boolean
  envPath: string
  outDir: string
} {
  let force = false
  const positional: string[] = []
  for (const arg of argv) {
    if (arg === '--force' || arg === '-f') {
      force = true
      continue
    }
    if (arg === '--help' || arg === '-h') usage()
    if (arg.startsWith('-')) {
      console.error(`Unknown flag: ${arg}`)
      usage()
    }
    positional.push(arg)
  }
  return {
    force,
    envPath: path.resolve(positional[0] ?? 'env.json'),
    outDir: path.resolve(positional[1] ?? '.')
  }
}

function writeJson(filePath: string, value: unknown, force: boolean): void {
  if (!force && fs.existsSync(filePath)) {
    console.error(
      `Refusing to overwrite existing ${filePath} (pass --force to replace)`
    )
    process.exit(1)
  }
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', {
    mode: 0o600
  })
}

function main(): void {
  const { force, envPath, outDir } = parseArgs(process.argv.slice(2))

  if (!fs.existsSync(envPath)) {
    console.error(`env.json not found: ${envPath}`)
    process.exit(1)
  }

  let legacyEnv: unknown
  try {
    legacyEnv = JSON.parse(fs.readFileSync(envPath, 'utf8'))
  } catch (error) {
    console.error(`Failed to parse ${envPath}: ${String(error)}`)
    process.exit(1)
  }

  const { config, keys } = splitEnv(legacyEnv)

  fs.mkdirSync(outDir, { recursive: true })
  const configPath = path.join(outDir, 'config.json')
  const keysPath = path.join(outDir, 'keys.json')

  writeJson(configPath, config, force)
  writeJson(keysPath, keys, force)

  const configPluginCounts = {
    corePlugins: Object.keys(config.corePlugins).length,
    swapPlugins: Object.keys(config.swapPlugins).length,
    guiApiKeys: Object.keys(config.guiApiKeys).length,
    rampPlugins: Object.keys(config.rampPlugins).length
  }
  const keysPluginCounts = {
    corePlugins: Object.keys(keys.corePlugins).length,
    swapPlugins: Object.keys(keys.swapPlugins).length,
    guiApiKeys: Object.keys(keys.guiApiKeys).length,
    rampPlugins: Object.keys(keys.rampPlugins).length
  }

  // Counts only — never dump field values (keys.json is secret).
  console.log(`Wrote ${configPath}`)
  console.log(`  plugin map sizes: ${JSON.stringify(configPluginCounts)}`)
  console.log(`Wrote ${keysPath}`)
  console.log(`  plugin map sizes: ${JSON.stringify(keysPluginCounts)}`)
}

// Only run the CLI when this file is the entry script (tests import helpers).
if (require.main === module) {
  main()
}
