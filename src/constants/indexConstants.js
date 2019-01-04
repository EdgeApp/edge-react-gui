// @flow

import s from '../locales/strings.js'
export * from './SceneKeys'
export * from './IconConstants'
export * from './DropDownValueConstants'
export * from './FeeConstants'
export * from './ErrorConstants'
export { REQUEST_STATUS } from './RequestStatusConstants'
export * from './WalletAndCurrencyConstants.js'

export const LEFT_TO_RIGHT = 'leftToRight'
export const RIGHT_TO_LEFT = 'rightToLeft'
export const NONE = 'none'
export const FROM = 'from'
export const TO = 'to'
export const ALWAYS = 'always'
export const LOGOUT = 'LOGOUT'

export const CRYPTO_EXCHANGE = 'cryptoExchange'
export const PASSWORD_RECOVERY_LINK = 'passwordRecoveryLink'
export const IOS = 'ios'
export const ANDROID = 'android'
export const PUSH_DELAY_SECONDS = 86400
export const LOCAL_STORAGE_BACKGROUND_PUSH_KEY = 'EdgeWalletLastPushNotification'

export const SPECIAL_CURRENCY_INFO = {
  XLM: {
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo_id,
      identifierName: s.strings.unique_identifier_memo_id,
      identifierKeyboardType: 'numeric'
    },
    minimumPopupModals: {
      minimumNativeBalance: '10000000',
      modalMessage: s.strings.request_xlm_minimum_notification_body
    }
  },
  XRP: {
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_destination_tag,
      identifierName: s.strings.unique_identifier_destination_tag,
      identifierKeyboardType: 'numeric'
    },
    minimumPopupModals: {
      minimumNativeBalance: '20000000',
      modalMessage: s.strings.request_xrp_minimum_notification_body
    }
  },
  XMR: {
    noMaxSpend: true,
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_payment_id,
      identifierName: s.strings.unique_identifier_payment_id,
      identifierKeyboardType: 'default'
    }
  },
  EOS: {
    needsAccountNameSetup: true,
    noChangeMiningFee: true,
    uniqueIdentifier: {
      addButtonText: s.strings.unique_identifier_dropdown_option_memo,
      identifierName: s.strings.unique_identifier_memo,
      identifierKeyboardType: 'default'
    }
  }
}

export const getSpecialCurrencyInfo = (currencyCode: string): Object => {
  if (SPECIAL_CURRENCY_INFO[currencyCode]) {
    return SPECIAL_CURRENCY_INFO[currencyCode]
  } else {
    return {}
  }
}
