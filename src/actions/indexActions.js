//@flow
export * from './CryptoExchangeActions'
export * from '../modules/UI/scenes/CreateWallet/action'
export function dispatchAction (type: string) {
  return {
    type
  }
}
