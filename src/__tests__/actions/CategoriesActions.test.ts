import { describe, expect, it } from '@jest/globals'
import type {
  EdgeAccount,
  EdgeAssetActionType,
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeTransaction
} from 'edge-core-js'
import { sprintf } from 'sprintf-js'

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
const SWAP_PROVIDER_NAME = 'MoonPay Trade (DeFi)'

// Only the fields `getTxActionDisplayInfo` actually reads:
const account = {
  currencyWallets: {},
  swapConfig: {
    mptradedefi: {
      swapInfo: { pluginId: 'mptradedefi', displayName: SWAP_PROVIDER_NAME }
    }
  },
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

/**
 * A sale as the MoonPay ramp plugin leaves it: a send to the provider's
 * deposit address carrying a fiat action, and no name of its own.
 */
const makeFiatSellTx = (metadata?: EdgeMetadata): EdgeTransaction => {
  return {
    txid: 'txid',
    tokenId: null,
    currencyCode: 'BTC',
    nativeAmount: '-563825',
    isSend: true,
    metadata,
    assetAction: { assetActionType: 'sell' },
    spendTargets: [{ publicAddress: DEPOSIT_ADDRESS, nativeAmount: '563825' }],
    savedAction: {
      actionType: 'fiat',
      orderId: 'f8a1c2d4',
      isEstimate: true,
      fiatPlugin: { providerId: 'moonpay', providerDisplayName: 'MoonPay' },
      payinAddress: DEPOSIT_ADDRESS,
      fiatAsset: { fiatCurrencyCode: 'iso:USD', fiatAmount: '471.04' },
      cryptoAsset: {
        pluginId: 'bitcoin',
        tokenId: null,
        nativeAmount: '563825'
      }
    }
  } as unknown as EdgeTransaction
}

describe('getTxActionDisplayInfo, fiat sale titles', () => {
  const sellTitle = sprintf(lstrings.transaction_details_sold_1s, 'Bitcoin')

  it('titles a sale by its asset', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeFiatSellTx(),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(sellTitle)
  })

  it('outranks a stored swap provider name on a sale', () => {
    const { mergedData, userData } = getTxActionDisplayInfo(
      makeFiatSellTx({ name: SWAP_PROVIDER_NAME }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(sellTitle)
    // The stored name itself is left alone:
    expect(userData.name).toBe(SWAP_PROVIDER_NAME)
  })

  it('outranks a stored swap provider name whose plugin is not loaded', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeFiatSellTx({ name: SWAP_PROVIDER_NAME }),
      { ...account, swapConfig: {} } as unknown as EdgeAccount,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(sellTitle)
  })

  it('outranks a loaded swap provider name that has no contact', () => {
    const houdiniAccount = {
      ...account,
      swapConfig: {
        houdini: {
          swapInfo: { pluginId: 'houdini', displayName: 'HoudiniSwap' }
        }
      }
    } as unknown as EdgeAccount
    const { mergedData } = getTxActionDisplayInfo(
      makeFiatSellTx({ name: 'HoudiniSwap' }),
      houdiniAccount,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(sellTitle)
  })

  it('lets any other stored name stand on a sale', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeFiatSellTx({ name: 'MoonPay' }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe('MoonPay')
  })

  it('lets a stored swap provider name stand on a swap', () => {
    const { mergedData } = getTxActionDisplayInfo(
      makeSwapSendTx({ metadata: { name: SWAP_PROVIDER_NAME } }),
      account,
      bitcoinWallet
    )
    expect(mergedData.name).toBe(SWAP_PROVIDER_NAME)
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
