// @flow
const { makeConfig } = require('cleaner-config')
const { asBoolean, asNumber, asObject, asOptional, asString, asArray, asNull, asEither } = require('cleaners')

const configComment = (comment: string) => ({ [`-------- ${comment} --------`]: asOptional(asNumber, 0) })

const asConfig = asObject({
  ...configComment('api keys'),
  AIRBITZ_API_KEY: asOptional(asString, ''),
  BUGSNAG_API_KEY: asOptional(asString, ''),

  ...configComment('GUI plugin options'),
  PLUGIN_API_KEYS: asOptional(
    asObject({
      Bitrefill: asOptional(asString, '')
    }),
    { Bitrefill: '' }
  ),

  ...configComment('core plugin options (remove `x_` to activate)'),
  x_BINANCE_SMART_CHAIN_INIT: asOptional(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), [])
    }),
    { evmScanApiKey: [] }
  ),
  x_CHANGE_NOW_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_CURRENCYCONVERTERAPI_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_ETHEREUM_INIT: asOptional(
    asObject({
      alethioApiKey: asOptional(asString, ''),
      amberdataApiKey: asOptional(asString, ''),
      blockchairApiKey: asOptional(asString, ''),
      evmScanApiKey: asOptional(asArray(asString), []),
      gasStationApiKey: asOptional(asString, ''),
      infuraProjectId: asOptional(asString, ''),
      quiknodeApiKey: asOptional(asString, '')
    }),
    {
      alethioApiKey: '',
      amberdataApiKey: '',
      blockchairApiKey: '',
      evmScanApiKey: [],
      gasStationApiKey: '',
      infuraProjectId: '',
      quiknodeApiKey: ''
    }
  ),
  x_EXOLIX_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  X_FANTOM_INIT: asOptional(
    asObject({
      evmScanApiKey: asOptional(asString, ''),
      quiknodeApiKey: asOptional(asString, '')
    }),
    {
      evmScanApiKey: '',
      quiknodeApiKey: ''
    }
  ),
  X_FIO_INIT: asOptional(
    asObject({
      fioRegApiToken: asOptional(asString, '')
    }),
    { fioRegApiToken: '' }
  ),
  x_FOX_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_GODEX_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_LETSEXCHANGE_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_MONERO_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_NOMICS_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_POLYGON_INIT: asOptional(
    asObject({
      evmScanApiKey: asOptional(asArray(asString), [])
    }),
    { evmScanApiKey: [] }
  ),
  X_SIDESHIFT_INIT: asOptional(
    asObject({
      affiliateId: asOptional(asString, '')
    }),
    { affiliateId: '' }
  ),
  x_SPOOKY_SWAP_INIT: asOptional(
    asObject({
      quiknodeApiKey: asOptional(asString, '')
    }),
    { quiknodeApiKey: '' }
  ),
  x_SWITCHAIN_INIT: asOptional(
    asObject({
      apiKey: asOptional(asString, '')
    }),
    { apiKey: '' }
  ),
  x_TOMB_SWAP_INIT: asOptional(
    asObject({
      quiknodeApiKey: asOptional(asString, '')
    }),
    { quiknodeApiKey: '' }
  ),

  ...configComment('app options'),
  USE_FAKE_CORE: asOptional(asBoolean, false),
  USE_TEST_AUTH_SERVER: asOptional(asBoolean, false),
  USE_FIREBASE: asOptional(asBoolean, true),
  YOLO_DEEP_LINK: asOptional(asEither(asString, asNull), null),
  YOLO_PASSWORD: asOptional(asEither(asString, asNull), null),
  YOLO_PIN: asOptional(asEither(asNumber, asNull), null),
  YOLO_USERNAME: asOptional(asEither(asString, asNull), null),
  APP_CONFIG: asOptional(asString, 'edge'),

  ...configComment('debug options'),
  DEBUG_CORE: asOptional(asBoolean, false),
  DEBUG_PLUGINS: asOptional(asBoolean, false),
  DEBUG_VERBOSE_ERRORS: asOptional(asBoolean, false),
  DISABLE_WARNINGS: asOptional(asBoolean, false)
})

module.exports.config = makeConfig(asConfig, 'env.json')
