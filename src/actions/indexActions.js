//@flow
export * from './CryptoExchangeActions'
export * from './EdgeLoginActions'
export * from '../modules/UI/scenes/CreateWallet/action'
export * from '../modules/UI/scenes/Scan/action'
export * from '../modules/UI/components/ABAlert/action'
export function dispatchAction (type: string) {
  return {
    type
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
