import { asArray, asMaybe, asObject, asString, asValue } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { ethers } from 'ethers'

const asNetworkAdapterConfigs = asArray(
  asMaybe(
    asObject({
      type: asValue('rpc'),
      servers: asArray(asString)
    })
  )
)

// TODO: Finish this so that we can leverage the wallet's network instead of using a JsonRrpProvider
export class EdgeWalletProvider extends ethers.providers.JsonRpcProvider {
  wallet: EdgeCurrencyWallet

  constructor(wallet: EdgeCurrencyWallet) {
    const { defaultSettings } = wallet.currencyInfo
    const networkAdapterConfigs = asMaybe(asNetworkAdapterConfigs)(defaultSettings?.otherSettings?.networkAdapterConfigs)
    if (networkAdapterConfigs == null) {
      throw new Error('Expected EdgeCurrencyWallet which has network adapters')
    }
    const rpcNetworkAdapterConfigs = networkAdapterConfigs.filter((config): config is Exclude<typeof config, undefined> => config != null)
    if (rpcNetworkAdapterConfigs.length === 0) {
      throw new Error('Expected EdgeCurrencyWallet which has RPC network adapters')
    }
    const rpcUrls = rpcNetworkAdapterConfigs.reduce((urls: string[], config) => [...urls, ...config.servers], [])
    super(rpcUrls[0])
    this.wallet = wallet
  }
}
