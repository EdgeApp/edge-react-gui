// @flow

export const ADD_TOKEN = 'addToken'
export const CHANGE_MINING_FEE_EXCHANGE = 'changeMiningFeeExchange'
export const CHANGE_MINING_FEE_SEND_CONFIRMATION = 'changeMiningFeeSendConfirmation'
export const CHANGE_PASSWORD = 'changePassword'
export const CHANGE_PIN = 'changePin'
export const CREATE_WALLET = 'createWallet'
export const CREATE_WALLET_NAME = 'createWalletName'
export const CREATE_WALLET_REVIEW = 'createWalletReview'
export const CREATE_WALLET_SELECT_CRYPTO = 'createWalletSelectCrypto'
export const CREATE_WALLET_SELECT_FIAT = 'createWalletSelectFiat'
export const DEFAULT_FIAT_SETTING = 'defaultFiatSetting'
export const EDGE = 'edge'
export const EDGE_LOGIN = 'edgeLogin'
export const EDIT_TOKEN = 'editToken'
export const EXCHANGE = 'exchange'
export const EXCHANGE_NOT_USED = 'exchange_notused'
export const LOGIN = 'login'
export const MANAGE_TOKENS = 'manageTokens'
export const MANAGE_TOKENS_NOT_USED = 'manageTokens_notused'
export const OTP_SETUP = 'otpSetup'
export const RECOVER_PASSWORD = 'passwordRecovery'
export const REQUEST = 'request'
export const ROOT = 'root'
export const SCAN = 'scan'
export const SCAN_NOT_USED = 'scan_notused'
export const SEND_CONFIRMATION = 'sendConfirmation'
export const SEND_CONFIRMATION_NOT_USED = 'sendconfirmation_notused'
export const SETTINGS_OVERVIEW = 'settingsOverview'
export const SETTINGS_OVERVIEW_TAB = 'settingsOverviewTab'
export const TRANSACTION_DETAILS = 'transactionDetails'
export const TRANSACTION_LIST = 'transactionList'
export const WALLET_LIST = 'walletList'
export const WALLET_LIST_NOT_USED = 'walletList_notused'
export const WALLET_LIST_SCENE = 'walletListScene' // distinguished as actual scene vs. stack

export const CURRENCY_SETTINGS = {
  'btcSettings': {
    pluginName: 'bitcoin',
    currencyCode: 'BTC'
  },
  'bchSettings': {
    pluginName: 'bitcoinCash',
    currencyCode: 'BCH'
  },
  'ethSettings': {
    pluginName: 'ethereum',
    currencyCode: 'ETH'
  },
  'ltcSettings': {
    pluginName: 'litecoin',
    currencyCode: 'LTC'
  },
  'dashSettings': {
    pluginName: 'dash',
    currencyCode: 'DASH'
  }
}
