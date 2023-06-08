import { asArray, asBoolean, asEither, asNumber, asObject, asOptional, asString, Cleaner } from 'cleaners'

function asNullable<T>(cleaner: Cleaner<T>): Cleaner<T | null> {
  return function asNullable(raw) {
    if (raw == null) return null
    return cleaner(raw)
  }
}

function asCorePluginInit<T>(cleaner: Cleaner<T>): Cleaner<T | false> {
  return function asCorePlugin(raw) {
    if (raw === false || raw == null) return false
    return cleaner(raw)
  }
}

export const asEnvConfig = asObject({
  // API keys:
  AIRBITZ_API_KEY: asOptional(asString, ''),
  BUGSNAG_API_KEY: asOptional(asString, 'a0000000000000000000000000000000'),
  IP_API_KEY: asOptional(asString, ''),

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
  PLUGIN_API_KEYS: asOptional(
    asObject({
      banxa: asOptional(
        asObject({
          partnerUrl: asString,
          apiKey: asString
        })
      ),
      Bitrefill: asOptional(asString),
      moonpay: asOptional(asString),
      simplex: asOptional(
        asObject({
          partner: asString,
          jwtTokenProvider: asString,
          publicKey: asString
        })
      ),
      ionia: asOptional(
        asObject({
          clientId: asString,
          clientSecret: asString,
          ioniaBaseUrl: asString,
          merchantId: asNumber,
          scope: asString
        })
      )
    }).withRest,
    () => ({
      banxa: undefined,
      Bitrefill: undefined,
      moonpay: undefined,
      simplex: undefined,
      ionia: undefined
    })
  ),
  WYRE_CLIENT_INIT: asOptional(
    asObject({
      baseUri: asString
    }),
    () => ({
      baseUri: 'https://api.sendwyre.com'
    })
  ),
  AZTECO_API_KEY: asNullable(asString),

  // Core plugin options:
  AVALANCHE_INIT: asCorePluginInit(
    asObject({
      alethioApiKey: asOptional(asString, ''),
      amberdataApiKey: asOptional(asString, ''),
      blockchairApiKey: asOptional(asString, ''),
      evmScanApiKey: asOptional(asArray(asString), () => []),
      gasStationApiKey: asOptional(asString, ''),
      infuraProjectId: asOptional(asString, ''),
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),
  BINANCE_SMART_CHAIN_INIT: asCorePluginInit(
    asObject({
      bscscanApiKey: asOptional(asArray(asString), () => []),
      evmScanApiKey: asOptional(asArray(asString), () => [])
    }).withRest
  ),
  CHANGE_NOW_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  CHANGEHERO_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  ETHEREUM_INIT: asCorePluginInit(
    asObject({
      alethioApiKey: asOptional(asString, ''),
      amberdataApiKey: asOptional(asString, ''),
      blockchairApiKey: asOptional(asString, ''),
      evmScanApiKey: asOptional(asArray(asString), () => []),
      gasStationApiKey: asOptional(asString, ''),
      infuraProjectId: asOptional(asString, ''),
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),
  ETHEREUM_POW_INIT: asCorePluginInit(
    asObject({
      alethioApiKey: asOptional(asString, ''),
      amberdataApiKey: asOptional(asString, ''),
      blockchairApiKey: asOptional(asString, ''),
      evmScanApiKey: asOptional(asArray(asString), () => []),
      gasStationApiKey: asOptional(asString, ''),
      infuraProjectId: asOptional(asString, ''),
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),
  EXOLIX_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  FANTOM_INIT: asCorePluginInit(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), () => []),
      ftmscanApiKey: asOptional(asString, ''),
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),
  FIO_INIT: asEither(
    asOptional(asBoolean, true), // Defaults to true if missing.
    asObject({
      fioRegApiToken: asOptional(asString, ''),
      tpid: asOptional(asString, 'finance@edge'),
      freeRegApiToken: asOptional(asString, ''),
      freeRegRefCode: asOptional(asString, '')
    }).withRest
  ),
  GODEX_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  LIFI_INIT: asCorePluginInit(
    asObject({
      affiliateFeeBasis: asOptional(asString, '50'),
      appId: asOptional(asString, 'edge'),
      integrator: asOptional(asString, 'edgeapp')
    }).withRest
  ),
  KOVAN_INIT: asCorePluginInit(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), () => []),
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),
  LETSEXCHANGE_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  MONERO_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  OPTIMISM_INIT: asCorePluginInit(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), () => [])
    }).withRest
  ),
  POLYGON_INIT: asCorePluginInit(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), () => []),
      polygonscanApiKey: asOptional(asArray(asString), () => [])
    }).withRest
  ),
  SIDESHIFT_INIT: asCorePluginInit(
    asObject({
      affiliateId: asOptional(asString, '')
    }).withRest
  ),
  SPOOKY_SWAP_INIT: asCorePluginInit(
    asObject({
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),
  SWAPUZ_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  THORCHAIN_INIT: asCorePluginInit(
    asObject({
      affiliateFeeBasis: asOptional(asString, '50'),
      appId: asOptional(asString, 'edge'),
      ninerealmsClientId: asOptional(asString, ''),
      thorname: asOptional(asString, 'ej')
    }).withRest
  ),
  TOMB_SWAP_INIT: asCorePluginInit(
    asObject({
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),

  // App options:
  APP_CONFIG: asOptional(asString, 'edge'),
  BETA_FEATURES: asOptional(asBoolean, false),
  USE_FAKE_CORE: asOptional(asBoolean, false),
  USE_FIREBASE: asOptional(asBoolean, true),
  USE_WELCOME_SCREENS: asOptional(asBoolean, true),

  YOLO_DEEP_LINK: asNullable(asString),
  YOLO_PASSWORD: asNullable(asString),
  YOLO_PIN: asNullable(asString),
  YOLO_USERNAME: asNullable(asString),

  // Debug options:
  ALLOW_DEVELOPER_MODE: asOptional(asBoolean, true),
  DEBUG_CORE: asOptional(asBoolean, false),
  DEBUG_PLUGINS: asOptional(asBoolean, false),
  DEBUG_ACCOUNTBASED: asOptional(asBoolean, false),
  DEBUG_VERBOSE_ERRORS: asOptional(asBoolean, false),
  DEBUG_THEME: asOptional(asBoolean, false),
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
      port: asOptional(asString, '8008')
    }),
    { host: 'localhost', port: '8008' }
  )
}).withRest
