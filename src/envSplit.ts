// Classification helpers that convert the legacy flat `env.json` shape into the
// split `{ config, keys }` files consumed by `makeEnvFromFiles`. Shared by the
// unit tests and by the throwaway local migration script.

import { deepMerge, isPlainObject } from './envFiles'

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
// Match secret-bearing field names. `apiKey` uses a negative lookahead so the
// map name `pluginApiKeys` is not treated as a secret field itself.
const SECRET_FIELD_RE =
  /(apiKey(?!s)|API_KEY|SECRET|TOKEN|DSN|ACCOUNT_ID|PROJECT_SLUG|ORGANIZATION_SLUG|privateKey|jwtTokenProvider|clientSecret|hmacUser|nowNodesApiKey|evmScanApiKey|alchemyApiKey|heliusApiKey|poktPortalApiKey|quiknodeApiKey|infuraProjectId|blockchairApiKey|drpcApiKey|gasStationApiKey|alethioApiKey|amberdataApiKey|blockfrostProjectId|koiosApiKey|maestroApiKey|glifApiKey|subscanApiKey|fioRegApiToken|ninerealmsClientId|thorswapApiKey|rangoApiKey|tonCenterApiKeys|projectId|edgeApiKey)/i

// Top-level env fields that are secret regardless of their (non-object) value.
const SECRET_TOP_LEVEL = new Set([
  'EDGE_API_KEY',
  'EDGE_API_SECRET',
  'AZTECO_API_KEY',
  'STAKEKIT_API_KEY',
  'UNSTOPPABLE_DOMAINS_API_KEY',
  'AIRBITZ_API_KEY',
  'BUGSNAG_API_KEY',
  'CMC_PRO_API_KEY'
])
const SECRET_TOP_LEVEL_PREFIXES = ['SENTRY_', 'KILN_', 'YOLO_']

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
  pluginApiKeys: Record<string, unknown>
  rampPlugins: Record<string, unknown>
}

export interface KeysFile {
  [key: string]: unknown
  pluginApiKeys: Record<string, unknown>
  rampPlugins: Record<string, unknown>
}

export interface SplitResult {
  config: ConfigFile
  keys: KeysFile
}

// Split a single plugin init value into its non-secret (config) and secret
// (keys) halves.
function splitPluginValue(value: unknown): {
  config: unknown
  keys: Record<string, unknown> | undefined
} {
  if (!isPlainObject(value)) {
    // Booleans and other primitive enablement flags stay entirely in config.
    return { config: value, keys: undefined }
  }
  const configPart: Record<string, unknown> = {}
  const keysPart: Record<string, unknown> = {}
  for (const [field, fieldValue] of Object.entries(value)) {
    if (isSecretField(field)) keysPart[field] = fieldValue
    else configPart[field] = fieldValue
  }
  const hasSecrets = Object.keys(keysPart).length > 0
  return { config: configPart, keys: hasSecrets ? keysPart : undefined }
}

function assignSecret(
  target: Record<string, unknown>,
  id: string,
  secret: Record<string, unknown> | undefined
): void {
  if (secret === undefined) return
  target[id] = deepMerge(target[id], secret)
}

/**
 * Convert a legacy flat `env.json` object into the split `{ config, keys }`
 * files. Unmapped `*_INIT` fields (and WYRE_CLIENT_INIT) are intentionally
 * dropped; POSTHOG_INIT/WALLET_CONNECT_INIT move into pluginApiKeys.
 */
export function splitEnv(legacyEnv: unknown): SplitResult {
  const env = isPlainObject(legacyEnv) ? legacyEnv : {}

  const config: ConfigFile = {
    corePlugins: {},
    swapPlugins: {},
    pluginApiKeys: {},
    rampPlugins: {}
  }
  const keys: KeysFile = {
    pluginApiKeys: {},
    rampPlugins: {}
  }

  for (const [field, value] of Object.entries(env)) {
    const coreId = CURRENCY_INIT_MAP[field]
    const swapId = SWAP_INIT_MAP[field]

    if (coreId != null || swapId != null) {
      const { config: cfg, keys: secret } = splitPluginValue(value)
      if (coreId != null) {
        config.corePlugins[coreId] = cfg
        assignSecret(keys.pluginApiKeys, coreId, secret)
      }
      if (swapId != null) {
        config.swapPlugins[swapId] = cfg
        assignSecret(keys.pluginApiKeys, swapId, secret)
      }
      continue
    }

    if (field === 'PLUGIN_API_KEYS') {
      for (const [provider, providerValue] of Object.entries(asMap(value))) {
        if (isPlainObject(providerValue)) {
          const { config: cfg, keys: secret } = splitPluginValue(providerValue)
          if (isPlainObject(cfg) && Object.keys(cfg).length > 0) {
            config.pluginApiKeys[provider] = cfg
          }
          assignSecret(keys.pluginApiKeys, provider, secret)
        } else {
          // Bare strings (e.g. Bitrefill, moonpay) are treated as secrets.
          keys.pluginApiKeys[provider] = providerValue
        }
      }
      continue
    }

    if (field === 'RAMP_PLUGIN_INITS') {
      for (const [id, rampValue] of Object.entries(asMap(value))) {
        const { config: cfg, keys: secret } = splitPluginValue(rampValue)
        if (isPlainObject(cfg) && Object.keys(cfg).length > 0) {
          config.rampPlugins[id] = cfg
        } else if (!isPlainObject(rampValue)) {
          config.rampPlugins[id] = cfg
        }
        assignSecret(keys.rampPlugins, id, secret)
      }
      continue
    }

    if (field === 'POSTHOG_INIT') {
      const { config: cfg, keys: secret } = splitPluginValue(value)
      if (isPlainObject(cfg) && Object.keys(cfg).length > 0) {
        config.pluginApiKeys.posthog = cfg
      }
      assignSecret(keys.pluginApiKeys, 'posthog', secret)
      continue
    }

    if (field === 'WALLET_CONNECT_INIT') {
      const { config: cfg, keys: secret } = splitPluginValue(value)
      if (isPlainObject(cfg) && Object.keys(cfg).length > 0) {
        config.pluginApiKeys.walletconnect = cfg
      }
      assignSecret(keys.pluginApiKeys, 'walletconnect', secret)
      continue
    }

    // Drop all remaining legacy *_INIT fields (unused plugins, WYRE, etc.).
    if (field.endsWith('_INIT')) continue

    // Everything else is a top-level app/debug field.
    if (isSecretTopLevel(field)) keys[field] = value
    else config[field] = value
  }

  return { config, keys }
}

function asMap(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {}
}
