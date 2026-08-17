import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeAssetActionType,
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeTransaction,
  EdgeTxActionSwapType
} from 'edge-core-js'

import { getTxActionDisplayInfo } from '../../actions/CategoriesActions'
import { lstrings } from '../../locales/strings'

const BITCOIN_WALLET_ID = 'bitcoin-wallet-id'
const RECIPIENT_ADDRESS = 'bc1qrecipientaddressthepayeecontrols'
const DEPOSIT_ADDRESS = '13e6qqcAZCgApTDyMNG8brru4PmtjbReUd'

// Only the fields `getTxActionDisplayInfo` actually reads:
const account = {
  currencyWallets: {},
  currencyConfig: {
    bitcoin: {
      currencyInfo: { currencyCode: 'BTC' },
      allTokens: {}
    },
    ethereum: {
      currencyInfo: { currencyCode: 'ETH' },
      allTokens: {
        '0000000000000000000000000000000000000001': { currencyCode: 'USDC' }
      }
    }
  }
} as unknown as EdgeAccount

const bitcoinWallet = {
  id: BITCOIN_WALLET_ID,
  currencyInfo: { pluginId: 'bitcoin', assetDisplayName: 'Bitcoin' },
  currencyConfig: account.currencyConfig.bitcoin
} as unknown as EdgeCurrencyWallet

const ethereumWallet = {
  id: 'ethereum-wallet-id',
  currencyInfo: { pluginId: 'ethereum', assetDisplayName: 'Ethereum' },
  currencyConfig: account.currencyConfig.ethereum
} as unknown as EdgeCurrencyWallet

interface SwapTxOpts {
  assetActionType?: EdgeAssetActionType
  fromPluginId?: string
  fromTokenId?: string | null
  metadata?: EdgeMetadata
  swapType?: EdgeTxActionSwapType
  tokenId?: string | null
}

/**
 * A broadcast send-shaped swap, as the Houdini plugin and the send scene leave
 * it: the spend target is the provider's deposit address, and the payee rides
 * on the saved action alone.
 */
const makeSwapSendTx = (opts: SwapTxOpts = {}): EdgeTransaction => {
  const {
    assetActionType = 'swap',
    fromPluginId = 'bitcoin',
    fromTokenId = null,
    metadata,
    swapType,
    tokenId = null
  } = opts

  return {
    txid: 'txid',
    tokenId,
    currencyCode: 'BTC',
    nativeAmount: '-38693',
    isSend: true,
    metadata,
    assetAction: { assetActionType },
    spendTargets: [{ publicAddress: DEPOSIT_ADDRESS, nativeAmount: '38693' }],
    savedAction: {
      actionType: 'swap',
      swapInfo: { pluginId: 'houdini', displayName: 'HoudiniSwap' },
      orderId: '9zdiWHWi2Q4Y7NRPB8k7mL',
      isEstimate: true,
      fromAsset: {
        pluginId: fromPluginId,
        tokenId: fromTokenId,
        nativeAmount: '38693'
      },
      toAsset: { pluginId: 'bitcoin', tokenId: null, nativeAmount: '37580' },
      payoutAddress: RECIPIENT_ADDRESS,
      swapType
    }
  } as unknown as EdgeTransaction
}

describe('getTxActionDisplayInfo, private send titles', () => {
  it('titles a private send by the flow, not the asset', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({ swapType: 'stealthSend' }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(lstrings.transaction_details_stealth_send)
  })

  it('outranks a stored metadata name on a private send', () => {
    // A recipient-style name reaching the transaction by any route must not
    // win the merge, or the flow displays what it exists to conceal.
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({
        swapType: 'stealthSend',
        metadata: { name: RECIPIENT_ADDRESS }
      }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(lstrings.transaction_details_stealth_send)
    expect(mergedData.name).not.toContain(RECIPIENT_ADDRESS)
  })

  it('lets a stored name stand on a non-private swap-send', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({ swapType: 'swapSend', metadata: { name: 'Alice' } }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe('Alice')
  })
})

describe('getTxActionDisplayInfo, the parent network-fee row', () => {
  // A token send files its fee under `tokenId: null` with the same swap
  // action. Stamping that row with the flow is what keeps the private-send
  // display rules true there, but the row is the fee, not the send.
  const feeRow = makeSwapSendTx({
    assetActionType: 'swapNetworkFee',
    fromPluginId: 'ethereum',
    fromTokenId: '0000000000000000000000000000000000000001',
    swapType: 'stealthSend',
    tokenId: null
  })

  it('keeps the network-fee title rather than the flow title', () => {
    const { mergedData } = getTxActionDisplayInfo(
      feeRow,
      account,
      ethereumWallet
    )
    expect(mergedData.name).toBe(lstrings.transaction_details_swap_network_fee)
    expect(mergedData.name).not.toBe(lstrings.transaction_details_stealth_send)
  })

  it('still outranks a stored metadata name on the fee row', () => {
    const namedFeeRow: EdgeTransaction = {
      ...feeRow,
      metadata: { name: RECIPIENT_ADDRESS }
    }
    const { mergedData } = getTxActionDisplayInfo(
      namedFeeRow,
      account,
      ethereumWallet
    )
    expect(mergedData.name).not.toContain(RECIPIENT_ADDRESS)
  })

  it('keeps the network-fee category', () => {
    const { mergedData } = getTxActionDisplayInfo(
      feeRow,
      account,
      ethereumWallet
    )
    expect(mergedData.category).toContain(lstrings.wc_smartcontract_network_fee)
  })
})
