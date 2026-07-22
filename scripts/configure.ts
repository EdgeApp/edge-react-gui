import { makeConfig } from 'cleaner-config'
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

// Config-scoped cleaner for `config.json` only. Secrets belong in `keys.json`
// and must not be defaulted/written here by `makeConfig` during `prepare`.
function asNullable<T>(cleaner: Cleaner<T>): Cleaner<T | null> {
  return function asNullable(raw) {
    if (raw == null) return null
    return cleaner(raw)
  }
}

const asPluginMap = asOptional(
  asObject<unknown>(asUnknown),
  (): Record<string, unknown> => ({})
)

const asConfigJson = asObject({
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

  // Plugin init maps (non-secret halves only; secrets live in keys.json):
  corePlugins: asPluginMap,
  swapPlugins: asPluginMap,
  pluginApiKeys: asPluginMap,
  rampPlugins: asPluginMap,

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

export const config = makeConfig(asConfigJson, 'config.json')
