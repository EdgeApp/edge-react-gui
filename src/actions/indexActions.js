//@flow
export * from './CryptoExchangeActions'
export * from '../modules/UI/scenes/CreateWallet/action'
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
