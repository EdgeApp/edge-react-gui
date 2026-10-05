import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeAssetActionType,
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeTransaction
} from 'edge-core-js'

import {
  getPluginIdIcon,
  getTxActionDisplayInfo
} from '../../actions/CategoriesActions'
import { lstrings } from '../../locales/strings'
import { edgeDark } from '../../theme/variables/edgeDark'
import { edgeLight } from '../../theme/variables/edgeLight'

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
  privacy?: boolean
  tokenId?: string | null
  toPluginId?: string
}

/**
 * A broadcast send, as the Houdini plugin leaves it: the spend target is the
 * provider's deposit address, and the payee rides on the saved action alone.
 */
const makeSwapSendTx = (opts: SwapTxOpts = {}): EdgeTransaction => {
  const {
    assetActionType = 'swap',
    fromPluginId = 'bitcoin',
    fromTokenId = null,
    metadata,
    privacy = false,
    tokenId = null,
    toPluginId = 'bitcoin'
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
      actionType: 'swapSend',
      swapInfo: { pluginId: 'houdini', displayName: 'HoudiniSwap' },
      orderId: '9zdiWHWi2Q4Y7NRPB8k7mL',
      isEstimate: true,
      fromAsset: {
        pluginId: fromPluginId,
        tokenId: fromTokenId,
        nativeAmount: '38693'
      },
      toAsset: { pluginId: toPluginId, tokenId: null, nativeAmount: '37580' },
      payoutAddress: RECIPIENT_ADDRESS,
      privacy
    }
  } as unknown as EdgeTransaction
}

describe('getTxActionDisplayInfo, send titles', () => {
  it('titles a private same-asset send as a Stealth Send', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({ privacy: true }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(lstrings.transaction_details_stealth_send)
  })

  it('titles a private cross-asset send as a Stealth Swap & Send', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({ privacy: true, toPluginId: 'ethereum' }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(
      lstrings.transaction_details_stealth_swap_and_send
    )
  })

  it('titles a transparent send as a Swap & Send', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({ toPluginId: 'ethereum' }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(lstrings.transaction_details_swap_and_send)
  })

  it('outranks a stored metadata name on a private send', () => {
    // A recipient-style name reaching the transaction by any route must not
    // win the merge, or the flow displays what it exists to conceal.
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({
        privacy: true,
        metadata: { name: RECIPIENT_ADDRESS }
      }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(lstrings.transaction_details_stealth_send)
    expect(mergedData.name).not.toContain(RECIPIENT_ADDRESS)
  })

  it('lets a stored name stand on a transparent send', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({ metadata: { name: 'Alice' } }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe('Alice')
  })
})

describe('getTxActionDisplayInfo, the parent network-fee row', () => {
  // A token send files its fee under `tokenId: null` with the same send
  // action, so the private-send display rules hold there too, but the row is
  // the fee, not the send.
  const feeRow = makeSwapSendTx({
    assetActionType: 'swapNetworkFee',
    fromPluginId: 'ethereum',
    fromTokenId: '0000000000000000000000000000000000000001',
    privacy: true,
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

describe('getPluginIdIcon', () => {
  it('follows the theme and fits a single-color logo', () => {
    expect(getPluginIdIcon('houdini', edgeDark)).toEqual({
      uri: 'https://content.edge.app/exchangeIcons/houdini/icon.png',
      fit: true
    })
    expect(getPluginIdIcon('houdini', edgeLight)).toEqual({
      uri: 'https://content.edge.app/exchangeIcons/houdini/icon-light.png',
      fit: true
    })
  })

  it('keeps the one cropped image for every other provider', () => {
    const lifiIcon = { uri: 'https://content.edge.app/lifi.png', fit: false }
    expect(getPluginIdIcon('lifi', edgeDark)).toEqual(lifiIcon)
    expect(getPluginIdIcon('lifi', edgeLight)).toEqual(lifiIcon)
  })

  it('has no logo for an unknown or missing provider', () => {
    expect(getPluginIdIcon('notAProvider', edgeDark)).toBeUndefined()
    expect(getPluginIdIcon(undefined, edgeDark)).toBeUndefined()
  })
})
