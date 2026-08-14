import {
  asArray,
  asBoolean,
  asObject,
  asOptional,
  asString,
  asUnknown,
  asValue,
  type Cleaner
} from 'cleaners'

import { asBase16 } from './util/cleaners/asHex'

function asNullable<T>(cleaner: Cleaner<T>): Cleaner<T | null> {
  return function asNullable(raw) {
    if (raw == null) return null
    return cleaner(raw)
  }
}

// Plugin init maps are keyed by plugin ID and hold arbitrary init options that
// are validated by each plugin, so we intentionally keep the values loose here.
// They live in BOTH files: config.json owns enablement flags (plus every map's
// key set) and keys.json owns the secret halves. `resolvePluginMaps`
// deep-merges them per plugin ID.
const asPluginMap = asOptional(
  asObject<unknown>(asUnknown),
  (): Record<string, unknown> => ({})
)

/**
 * Cleaner for the committable, non-secret `config.json` file. This is the
 * source of truth for which fields are config-owned; `scripts/configure.ts`
 * runs it through `makeConfig` so secrets can never be defaulted/written here.
 */
export const asConfigJson = asObject({
  // Plugin init maps, keyed by plugin ID:
  corePlugins: asPluginMap,
  swapPlugins: asPluginMap,
  pluginApiKeys: asPluginMap,
  rampPlugins: asPluginMap,

  // PostHog host (the api key is KEYS.POSTHOG_API_KEY):
  POSTHOG_API_HOST: asOptional(asString),

  // Per-developer login shortcuts — temporary, never served remotely:
  YOLO_DEEP_LINK: asNullable(asString),
  YOLO_PASSWORD: asNullable(asString),
  YOLO_PIN: asNullable(asString),
  YOLO_USERNAME: asNullable(asString),

  // GUI plugin options:
  ACTION_QUEUE: asOptional(
    asObject({
      debugStore: asOptional(asBoolean, false),
      enableDryrun: asOptional(asBoolean, true),
      pushServerUri: asOptional(asString, 'https://push.edge.app'),
      mockMode: asOptional(asBoolean, false)
    }),
    {
      debugStore: false,
      enableDryrun: true,
      pushServerUri: 'https://push.edge.app',
      mockMode: false
    }
  ),

  // Debug logging configuration:
  LOG_CONFIG: asOptional(
    asObject({
      enabledCategories: asOptional(asArray(asString), () => []),
      maskSensitiveHeaders: asOptional(asBoolean, true),
      sensitiveHeaders: asOptional(asArray(asString), () => [
        'api-key',
        'user-api-key',
        'authorization',
        'x-api-key'
      ])
    }),
    () => ({
      enabledCategories: [],
      maskSensitiveHeaders: true,
      sensitiveHeaders: [
        'api-key',
        'user-api-key',
        'authorization',
        'x-api-key'
      ]
    })
  ),

  // App options:
  APP_CONFIG: asOptional(asString, 'edge'),
  ENABLE_STAKING: asOptional(asBoolean, true),
  ENABLE_VISA_PROGRAM: asOptional(asBoolean, false),
  BETA_FEATURES: asOptional(asBoolean, false),
  KEYS_ONLY_PLUGINS: asOptional(asObject(asBoolean), {}),
  USE_FAKE_CORE: asOptional(asBoolean, false),
  USE_FIREBASE: asOptional(asBoolean, true),
  USE_WELCOME_SCREENS: asOptional(asBoolean, true),

  // Debug options:
  ALLOW_DEVELOPER_MODE: asOptional(asBoolean, true),
  DEV_TAB: asOptional(asBoolean, false),
  DEBUG_CORE: asOptional(asBoolean, false),
  DEBUG_CURRENCY_PLUGINS: asOptional(asBoolean, false),
  DEBUG_PLUGINS: asOptional(asBoolean, false),
  DEBUG_ACCOUNTBASED: asOptional(asBoolean, false),
  DEBUG_EXCHANGES: asOptional(asBoolean, false),
  DEBUG_VERBOSE_LOGGING: asOptional(asBoolean, false),
  DEBUG_THEME: asOptional(asBoolean, false),
  MUTE_CONSOLE_OUTPUT: asOptional(
    asArray(
      asValue(
        'log',
        'info',
        'warn',
        'error',
        'debug',
        'trace',
        'group',
        'groupCollapsed',
        'groupEnd'
      )
    ),
    []
  ),
  ENABLE_FIAT_SANDBOX: asOptional(asBoolean, false),
  ENABLE_MAESTRO_BUILD: asOptional(asBoolean, false),
  ENABLE_TEST_SERVERS: asOptional(asBoolean),
  INFO_SERVER: asOptional(asArray(asString)),
  // Optional override of the login server URL(s), e.g. for pointing a debug
  // build at a local login server: ["http://192.168.1.50:3123"]. Do not include
  // `/api` in the path. Absent in production.
  LOGIN_SERVER: asOptional(asArray(asString)),
  ENABLE_REDUX_PERF_LOGGING: asOptional(asBoolean, false),
  LOG_SERVER: asNullable(
    asObject({
      host: asOptional(asString, 'localhost'),
      port: asOptional(asString, '8008')
    })
  ),
  THEME_SERVER: asOptional(
    asObject({
      host: asOptional(asString, 'localhost'),
      port: asOptional(asString, '8008'),
      overrideThemeFile: asOptional(
        asString,
        '/Users/username/Documents/overrideTheme.json'
      )
    }),
    {
      host: 'localhost',
      port: '8008',
      overrideThemeFile: '/Users/username/Documents/overrideTheme.json'
    }
  ),
  EXPERIMENT_CONFIG_OVERRIDE: asOptional(asObject(asString), {}),
  LOGBOX_DISABLE: asOptional(asBoolean, false)
})

/**
 * Partner secrets nested under `KEYS.globalKeys` (and the exported
 * `globalKeys` alias). On-disk `keys.json` may still carry these flat; load
 * and overlay paths nest them once. POSTHOG_API_KEY stays top-level on KEYS
 * (local-only, never served).
 */
export const globalKeysShape = {
  AZTECO_API_KEY: asNullable(asString),
  COINGECKO_API_KEY: asOptional(asString, ''),
  IP_API_KEY: asOptional(asString, ''),
  STAKEKIT_API_KEY: asNullable(asString),
  UNSTOPPABLE_DOMAINS_API_KEY: asNullable(asString),
  KILN_TESTNET_API_KEY: asNullable(asString),
  KILN_TESTNET_ACCOUNT_ID: asNullable(asString),
  KILN_MAINNET_API_KEY: asNullable(asString),
  KILN_MAINNET_ACCOUNT_ID: asNullable(asString)
}
export const asGlobalKeys = asObject(globalKeysShape).withRest
export const GLOBAL_KEY_NAMES = Object.keys(globalKeysShape)

/**
 * Cleaner for the private `keys.json` file. Flat partner-key fields are still
 * accepted for legacy on-disk files; `normalizeKeys` nests them under
 * `globalKeys` for the runtime `KEYS` object.
 */
export const asKeysJson = asObject({
  pluginApiKeys: asPluginMap,
  rampPlugins: asPluginMap,
  globalKeys: asOptional(asGlobalKeys, () => ({})),

  // Legacy flat partner keys (normalized into globalKeys at load):
  ...globalKeysShape,

  // Local-only telemetry credential (never served); stays top-level on KEYS:
  POSTHOG_API_KEY: asNullable(asString),

  // Auth + local-only telemetry (never served via getKeys):
  EDGE_API_KEY: asOptional(asString, ''),
  EDGE_API_SECRET: asOptional(asBase16),
  BUGSNAG_API_KEY: asNullable(asString),

  SENTRY_DSN_URL: asOptional(asString, 'SENTRY_DSN_URL'),
  SENTRY_MAP_UPLOAD_URL: asOptional(asString, 'SENTRY_MAP_UPLOAD_URL'),
  SENTRY_MAP_UPLOAD_AUTH_TOKEN: asOptional(
    asString,
    'SENTRY_MAP_UPLOAD_AUTH_TOKEN'
  ),
  SENTRY_ORGANIZATION_SLUG: asOptional(asString, 'SENTRY_ORGANIZATION_SLUG'),
  SENTRY_PROJECT_SLUG: asOptional(asString, 'SENTRY_PROJECT_SLUG')
})

export type ConfigJson = ReturnType<typeof asConfigJson>
export type KeysJson = ReturnType<typeof asKeysJson>
export type GlobalKeys = ReturnType<typeof asGlobalKeys>

/** Runtime keys after flat partner fields have been nested under globalKeys. */
export type RuntimeKeys = Omit<KeysJson, keyof typeof globalKeysShape> & {
  globalKeys: GlobalKeys
}
