// @flow

export * from './SceneKeys'
export * from './IconConstants'
export * from './DropDownValueConstants'
export { REQUEST_STATUS } from './RequestStatusConstants'
export * from './WalletAndCurrencyConstants.js'
export * from './CountryConstants.js'

export const ANDROID = 'android'
export const IOS = 'ios'
export const FROM = 'from'
export const TO = 'to'

export const CRYPTO_EXCHANGE = 'cryptoExchange'
export const mock_plugin = {
  pluginId: 'banxa',
  uri: 'https://edge.banxa.com',
  name: 'Banxa',
  permissions: ['camera'],
  id: 'banxa.bank',
  paymentType: { bank: true, cash: false },
  description: 'Fee: 4-6% / Settlement: 5 min-24 hours↵Limit: $50000/day',
  title: 'POLi Bank Transfer',
  partnerIconPath: 'https://edge.app/wp-content/uploads/2019/08/banxa.png',
  cryptoCodes: ['BTC', 'ETH'],
  paymentTypeLogoKey: 'poli',
  addOnUrl: '/?country=AU&payment=POLI',
  priority: 1
}
