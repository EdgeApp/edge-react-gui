// @flow

export const LOGIN = 'login'
export const ROOT = 'root'
export const EDGE = 'edge'
export const ONBOARDING = 'onboarding'
export const CHANGE_PASSWORD = 'changePassword'
export const CHANGE_PIN = 'changePin'
export const OTP_SETUP = 'otpSetup'
export const RECOVER_PASSWORD = 'passwordRecovery'
export const EXCHANGE = 'exchange'
export const EDGE_LOGIN = 'edgeLogin'
export const WALLET_LIST = 'walletList'
export const WALLET_LIST_SCENE = 'walletListScene' // distinguished as actual scene vs. stack
export const WALLET_LIST_NOT_USED = 'walletList_notused'
export const CREATE_WALLET_CHOICE = 'createWalletChoice'
export const CREATE_WALLET_IMPORT = 'createWalletImport'
export const CREATE_WALLET_NAME = 'createWalletName'
export const CREATE_WALLET_SELECT_CRYPTO = 'createWalletSelectCrypto'
export const CREATE_WALLET_SELECT_FIAT = 'createWalletSelectFiat'
export const CREATE_WALLET_REVIEW = 'createWalletReview'
export const CREATE_WALLET_ACCOUNT_SETUP = 'createWalletAccountSetup'
export const CREATE_WALLET_ACCOUNT_SELECT = 'createWalletAccountSelect'
export const MANAGE_TOKENS = 'manageTokens'
export const MANAGE_TOKENS_NOT_USED = 'manageTokens_notused'
export const ADD_TOKEN = 'addToken'
export const EDIT_TOKEN = 'editToken'
export const TRANSACTION_LIST = 'transactionList'
export const TRANSACTION_DETAILS = 'transactionDetails'
export const TRANSACTIONS_EXPORT = 'transactionsExport'
export const SCAN = 'scan'
export const SCAN_NOT_USED = 'scan_notused'
export const SEND_CONFIRMATION = 'sendConfirmation'
export const SEND_CONFIRMATION_NOT_USED = 'sendconfirmation_notused'
export const SWAP_ACTIVATE_SHAPESHIFT = 'swapActivateShapeShift'
export const CHANGE_MINING_FEE_SEND_CONFIRMATION = 'changeMiningFeeSendConfirmation'
export const CHANGE_MINING_FEE_EXCHANGE = 'changeMiningFeeExchange'
export const REQUEST = 'request'
export const SETTINGS_OVERVIEW = 'settingsOverview'
export const SETTINGS_OVERVIEW_TAB = 'settingsOverviewTab'
export const DEFAULT_FIAT_SETTING = 'defaultFiatSetting'
export const EXCHANGE_SETTINGS = 'exchangeSettings'
export const EXCHANGE_SCENE = 'exchangeScene'
export const EXCHANGE_QUOTE_PROCESSING_SCENE = 'exchangeQuoteProcessing'
export const EXCHANGE_QUOTE_SCENE = 'exchangeQuote'
export const CREATE_WALLET = 'createWallet'
export const TERMS_OF_SERVICE = 'termsOfService'
export const PLUGIN_LIST = 'pluginList'
export const PLUGIN_VIEW = 'pluginView'
export const PLUGIN_VIEW_DEEP = 'pluginViewDeep'
export const PLUGIN_VIEW_LEGACY = 'pluginViewLegacy'
export const SPENDING_LIMITS = 'spendingLimits'

export const CURRENCY_SETTINGS = {
  btcSettings: {
    pluginName: 'bitcoin',
    currencyCode: 'BTC'
  },
  bchSettings: {
    pluginName: 'bitcoinCash',
    currencyCode: 'BCH'
  },
  ethSettings: {
    pluginName: 'ethereum',
    currencyCode: 'ETH'
  },
  dashSettings: {
    pluginName: 'dash',
    currencyCode: 'DASH'
  },
  eosSettings: {
    pluginName: 'eos',
    currencyCode: 'EOS'
  },
  ltcSettings: {
    pluginName: 'litecoin',
    currencyCode: 'LTC'
  },
  bsvSettings: {
    pluginName: 'bitcoinsv',
    currencyCode: 'BSV'
  },
  zcoinSettings: {
    pluginName: 'zcoin',
    currencyCode: 'XZC'
  },
  dgbSettings: {
    pluginName: 'digibyte',
    currencyCode: 'DGB'
  },
  qtumSettings: {
    pluginName: 'qtum',
    currencyCode: 'QTUM'
  },
  vtcSettings: {
    pluginName: 'vertcoin',
    currencyCode: 'VTC'
  },
  ftcSettings: {
    pluginName: 'feathercoin',
    currencyCode: 'FTC'
  },
  rvnSettings: {
    pluginName: 'ravencoin',
    currencyCode: 'RVN'
  },
  btgSettings: {
    pluginName: 'bitcoinGold',
    currencyCode: 'BTG'
  },
  smartcashSettings: {
    pluginName: 'smartcash',
    currencyCode: 'SMART'
  },
  grsSettings: {
    pluginName: 'groestlcoin',
    currencyCode: 'GRS'
  },
  ebstSettings: {
    pluginName: 'eboost',
    currencyCode: 'EBST'
  },
  /* rskSettings: {
     pluginName: 'rsk',
     currencyCode: 'RBTC'
  }, */
  ufoSettings: {
    pluginName: 'ufo',
    currencyCode: 'UFO'
  },
  xtzSettings: {
    pluginName: 'tezos',
    currencyCode: 'XTZ'
  }
}
