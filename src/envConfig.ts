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

const asEvmApiKeys = asObject({
  alethioApiKey: asOptional(asString, ''),
  amberdataApiKey: asOptional(asString, ''),
  blockchairApiKey: asOptional(asString, ''),
  evmScanApiKey: asOptional(asArray(asString), () => []),
  gasStationApiKey: asOptional(asString, ''),
  infuraProjectId: asOptional(asString, ''),
  poktPortalApiKey: asOptional(asString, ''),
  quiknodeApiKey: asOptional(asString, '')
}).withRest

export const asEnvConfig = asObject({
  // API keys:
  AIRBITZ_API_KEY: asOptional(asString, ''),
  BUGSNAG_API_KEY: asOptional(asString, 'a0000000000000000000000000000000'),
  COINGECKO_API_KEY: asOptional(asString, 'a0000000000000000000000000000000'),
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
          hmacUser: asString,
          apiKey: asString
        })
      ),
      Bitrefill: asOptional(asString),
      kado: asOptional(
        asObject({
          apiKey: asString
        })
      ),
      moonpay: asOptional(asString),
      mtpelerin: asOptional(asString),
      paybis: asOptional(
        asObject({
          partnerUrl: asString,
          apiKey: asString
        })
      ),
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
      kado: undefined,
      moonpay: undefined,
      mtpelerin: undefined,
      paybis: undefined,
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
  STAKEKIT_API_KEY: asNullable(asString),

  // Core plugin options:
  ARBITRUM_INIT: asCorePluginInit(asEvmApiKeys),
  AVALANCHE_INIT: asCorePluginInit(asEvmApiKeys),
  BASE_INIT: asCorePluginInit(asEvmApiKeys),
  BINANCE_SMART_CHAIN_INIT: asCorePluginInit(asEvmApiKeys),
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
  COREUM_INIT: asCorePluginInit(asBoolean),
  ETHEREUM_INIT: asCorePluginInit(asEvmApiKeys),
  ETHEREUM_POW_INIT: asCorePluginInit(asEvmApiKeys),
  EXOLIX_INIT: asCorePluginInit(
    asObject({
      apiKey: asOptional(asString, '')
    }).withRest
  ),
  FANTOM_INIT: asCorePluginInit(asEvmApiKeys),
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
  KOVAN_INIT: asCorePluginInit(asEvmApiKeys),
  GOERLI_INIT: asCorePluginInit(asEvmApiKeys),
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
  OPTIMISM_INIT: asCorePluginInit(asEvmApiKeys),
  OSMOSIS_INIT: asCorePluginInit(asBoolean),
  PULSECHAIN_INIT: asCorePluginInit(asEvmApiKeys),

  POLYGON_INIT: asCorePluginInit(asEvmApiKeys),
  SIDESHIFT_INIT: asCorePluginInit(
    asObject({
      affiliateId: asOptional(asString, '')
    }).withRest
  ),
  SOLANA_INIT: asCorePluginInit(
    asObject({
      alchemyApiKey: asOptional(asString, ''),
      poktPortalApiKey: asOptional(asString, '')
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
      thorname: asOptional(asString, 'ej'),
      thorswapApiKey: asOptional(asString)
    }).withRest
  ),
  TOMB_SWAP_INIT: asCorePluginInit(
    asObject({
      quiknodeApiKey: asOptional(asString, '')
    }).withRest
  ),
  WALLET_CONNECT_INIT: asCorePluginInit(
    asObject({
      projectId: asOptional(asString, '')
    }).withRest
  ),
  XRPDEX_INIT: asCorePluginInit(
    asObject({
      appId: asOptional(asString, 'edge')
    }).withRest
  ),

  // App options:
  APP_CONFIG: asOptional(asString, 'edge'),
  ENABLE_STAKING: asOptional(asBoolean, true),
  ENABLE_VISA_PROGRAM: asOptional(asBoolean, false),
  BETA_FEATURES: asOptional(asBoolean, false),
  KEYS_ONLY_PLUGINS: asOptional(asObject(asBoolean), {}),
  USE_FAKE_CORE: asOptional(asBoolean, false),
  USE_FIREBASE: asOptional(asBoolean, true),
  USE_WELCOME_SCREENS: asOptional(asBoolean, true), // Used by whitelabels
  POSTHOG_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, ''),
      apiHost: asOptional(asString, '')
    })
  ),

  YOLO_DEEP_LINK: asNullable(asString),
  YOLO_PASSWORD: asNullable(asString),
  YOLO_PIN: asNullable(asString),
  YOLO_USERNAME: asNullable(asString),

  // Debug options:
  ALLOW_DEVELOPER_MODE: asOptional(asBoolean, true),
  DEV_TAB: asOptional(asBoolean, false),
  DEBUG_CORE: asOptional(asBoolean, false),
  DEBUG_PLUGINS: asOptional(asBoolean, false),
  DEBUG_ACCOUNTBASED: asOptional(asBoolean, false),
  DEBUG_EXCHANGES: asOptional(asBoolean, false),
  DEBUG_VERBOSE_ERRORS: asOptional(asBoolean, false),
  DEBUG_THEME: asOptional(asBoolean, false),
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
      port: asOptional(asString, '8008')
    }),
    { host: 'localhost', port: '8008' }
  ),
  EXPERIMENT_CONFIG_OVERRIDE: asOptional(asObject(asString), {})
}).withRest
