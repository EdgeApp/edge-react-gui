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
const asPluginMap = asOptional(
  asObject<unknown>(asUnknown),
  (): Record<string, unknown> => ({})
)

export const asEnvConfig = asObject({
  // API keys:
  EDGE_API_KEY: asOptional(asString, ''),
  EDGE_API_SECRET: asOptional(asBase16),

  COINGECKO_API_KEY: asOptional(asString, ''),
  IP_API_KEY: asOptional(asString, ''),
  SENTRY_DSN_URL: asOptional(asString, 'SENTRY_DSN_URL'),
  SENTRY_MAP_UPLOAD_URL: asOptional(asString, 'SENTRY_MAP_UPLOAD_URL'),
  SENTRY_MAP_UPLOAD_AUTH_TOKEN: asOptional(
    asString,
    'SENTRY_MAP_UPLOAD_AUTH_TOKEN'
  ),
  SENTRY_ORGANIZATION_SLUG: asOptional(asString, 'SENTRY_ORGANIZATION_SLUG'),
  SENTRY_PROJECT_SLUG: asOptional(asString, 'SENTRY_PROJECT_SLUG'),

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
      // Categories to enable (e.g., ['phaze', 'coinrank'])
      enabledCategories: asOptional(asArray(asString), () => []),
      // Whether to mask sensitive headers in API logs
      maskSensitiveHeaders: asOptional(asBoolean, true),
      // Header names to mask (case-insensitive)
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

  // Plugin init maps, keyed by plugin ID:
  //
  // - corePlugins:   edge-core currency plugin inits
  // - swapPlugins:   swap plugin inits
  // - pluginApiKeys: GUI provider keys (formerly PLUGIN_API_KEYS) plus
  //                  walletconnect and posthog
  // - rampPlugins:   ramp plugin inits (formerly RAMP_PLUGIN_INITS)
  corePlugins: asPluginMap,
  swapPlugins: asPluginMap,
  pluginApiKeys: asPluginMap,
  rampPlugins: asPluginMap,

  AZTECO_API_KEY: asNullable(asString),
  STAKEKIT_API_KEY: asNullable(asString),
  KILN_TESTNET_API_KEY: asNullable(asString),
  KILN_TESTNET_ACCOUNT_ID: asNullable(asString),
  KILN_MAINNET_API_KEY: asNullable(asString),
  KILN_MAINNET_ACCOUNT_ID: asNullable(asString),
  UNSTOPPABLE_DOMAINS_API_KEY: asNullable(asString),

  // App options:
  APP_CONFIG: asOptional(asString, 'edge'),
  ENABLE_STAKING: asOptional(asBoolean, true),
  ENABLE_VISA_PROGRAM: asOptional(asBoolean, false),
  BETA_FEATURES: asOptional(asBoolean, false),
  KEYS_ONLY_PLUGINS: asOptional(asObject(asBoolean), {}),
  USE_FAKE_CORE: asOptional(asBoolean, false),
  USE_FIREBASE: asOptional(asBoolean, true),
  USE_WELCOME_SCREENS: asOptional(asBoolean, true), // Used by whitelabels

  YOLO_DEEP_LINK: asNullable(asString),
  YOLO_PASSWORD: asNullable(asString),
  YOLO_PIN: asNullable(asString),
  YOLO_USERNAME: asNullable(asString),

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
}).withRest
