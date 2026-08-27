import { EdgeCurrencyInfo } from 'edge-core-js/types'

import { makeOuterPlugin } from '../common/innerPlugin'
import type { ZcashTools } from './ZcashTools'
import {
  asZcashInfoPayload,
  ZcashInfoPayload,
  ZcashNetworkInfo
} from './zcashTypes'

export const networkInfo: ZcashNetworkInfo = {
  rpcNode: {
    networkName: 'mainnet',
    defaultHost: 'zec.rocks',
    defaultPort: 443
  },
  defaultNetworkFee: '10000' // hardcoded default ZEC fee
}

export const currencyInfo: EdgeCurrencyInfo = {
  currencyCode: 'ZEC',
  assetDisplayName: 'Zcash',
  chainDisplayName: 'Zcash',
  pluginId: 'zcash',
  requiredConfirmations: 10,
  syncDisplayPrecision: 6,
  unsafeBroadcastTx: true,
  unsafeSyncNetwork: true,
  walletType: 'wallet:zcash',

  // Explorers:
  addressExplorer: 'https://blockchair.com/zcash/address/%s?from=edgeapp',
  transactionExplorer:
    'https://blockchair.com/zcash/transaction/%s?from=edgeapp',

  denominations: [
    {
      name: 'ZEC',
      multiplier: '100000000',
      symbol: 'Z'
    }
  ],

  // https://zips.z.cash/zip-0302
  memoOptions: [{ type: 'text', maxLength: 512 }],

  // Deprecated:
  displayName: 'Zcash'
}

export const zcash = makeOuterPlugin<
  ZcashNetworkInfo,
  ZcashTools,
  ZcashInfoPayload
>({
  currencyInfo,
  asInfoPayload: asZcashInfoPayload,
  networkInfo,

  async getInnerPlugin() {
    return await import(
      /* webpackChunkName: "zcash" */
      './ZcashTools'
    )
  }
})
