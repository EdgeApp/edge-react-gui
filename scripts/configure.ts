import { makeConfig } from 'cleaner-config'
import { asArray, asBoolean, asNumber, asObject, asOptional, asString, Cleaner } from 'cleaners'

function asNullable<T>(cleaner: Cleaner<T>): Cleaner<T | null> {
  return function asNullable(raw) {
    if (raw == null) return null
    return cleaner(raw)
  }
}

const asConfig = asObject({
  // API keys:
  AIRBITZ_API_KEY: asOptional(asString, ''),
  BUGSNAG_API_KEY: asOptional(asString, ''),
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
      Bitrefill: asOptional(asString, '')
    }),
    { Bitrefill: '' }
  ),
  WYRE_CLIENT_INIT: asOptional(
    asObject({
      baseUri: asString
    }),
    {
      baseUri: 'https://api.sendwyre.com'
    }
  ),
  AZTECO_API_KEY: asNullable(asString),

  // Core plugin options:
  BINANCE_SMART_CHAIN_INIT: asNullable(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), [])
    })
  ),
  CHANGE_NOW_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  CHANGEHERO_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  CURRENCYCONVERTERAPI_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  ETHEREUM_INIT: asNullable(
    asObject({
      alethioApiKey: asOptional(asString, ''),
      amberdataApiKey: asOptional(asString, ''),
      blockchairApiKey: asOptional(asString, ''),
      evmScanApiKey: asOptional(asArray(asString), []),
      gasStationApiKey: asOptional(asString, ''),
      infuraProjectId: asOptional(asString, ''),
      quiknodeApiKey: asOptional(asString, '')
    })
  ),
  EXOLIX_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  FANTOM_INIT: asNullable(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), []),
      quiknodeApiKey: asOptional(asString, '')
    })
  ),
  FIO_INIT: asNullable(
    asObject({
      fioRegApiToken: asOptional(asString, '')
    })
  ),
  FOX_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  GODEX_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  KOVAN_INIT: asNullable(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), []),
      quiknodeApiKey: asOptional(asString, '') // TODO: is this right?
    })
  ),
  LETSEXCHANGE_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  MONERO_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  NOMICS_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  POLYGON_INIT: asNullable(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), [])
    })
  ),
  SIDESHIFT_INIT: asNullable(
    asObject({
      affiliateId: asOptional(asString, '')
    })
  ),
  SPOOKY_SWAP_INIT: asNullable(
    asObject({
      quiknodeApiKey: asOptional(asString, '')
    })
  ),
  SWITCHAIN_INIT: asNullable(
    asObject({
      apiKey: asOptional(asString, '')
    })
  ),
  THORCHAIN_INIT: asNullable(
    asObject({
      affiliateFeeBasis: asOptional(asString, '50'),
      thorname: asOptional(asString, 'ej')
    })
  ),
  TOMB_SWAP_INIT: asNullable(
    asObject({
      quiknodeApiKey: asOptional(asString, '')
    })
  ),

  // App options:
  APP_CONFIG: asOptional(asString, 'edge'),
  BETA_FEATURES: asOptional(asBoolean, false),
  BETA_FEATURES_DEV_MODE_ONLY: asOptional(asBoolean, false),
  USE_FAKE_CORE: asOptional(asBoolean, false),
  USE_FIREBASE: asOptional(asBoolean, true),
  YOLO_DEEP_LINK: asNullable(asString),
  YOLO_PASSWORD: asNullable(asString),
  YOLO_PIN: asNullable(asNumber),
  YOLO_USERNAME: asNullable(asString),

  // Debug options:
  DEBUG_CORE: asOptional(asBoolean, false),
  DEBUG_PLUGINS: asOptional(asBoolean, false),
  DEBUG_VERBOSE_ERRORS: asOptional(asBoolean, false),
  DEBUG_THEME: asOptional(asBoolean, false),
  DISABLE_WARNINGS: asOptional(asBoolean, false),
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
})

export const config = makeConfig(asConfig, 'env.json')
