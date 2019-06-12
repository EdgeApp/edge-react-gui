// @flow

export * from './CryptoExchangeActions.js'
export * from './EdgeLoginActions.js'
export * from './OtpActions.js'
export * from './CreateWalletActions.js'
export * from './ScanActions.js'
export * from '../modules/Settings/SettingsActions.js'
export * from '../modules/Login/action.js'

export function dispatchActionObject (type: string, data: Object) {
  return {
    type,
    data
  }
}
export function dispatchActionArray (type: string, data: Array<any>) {
  return {
    type,
    data
  }
}

export function dispatchActionString (type: string, data: string) {
  return {
    type,
    data
  }
}

export function dispatchActionNumber (type: string, data: number) {
  return {
    type,
    data
  }
}
