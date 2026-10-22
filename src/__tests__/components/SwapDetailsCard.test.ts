import { describe, expect, it } from '@jest/globals'
import type { EdgeTransaction, EdgeTxAction } from 'edge-core-js'

import { getSwapSourceNativeAmount } from '../../components/cards/SwapDetailsCard'

const makeSwapAction = (
  pluginId: string,
  tokenId: string | null,
  nativeAmount?: string
): EdgeTxAction => ({
  actionType: 'swap',
  swapInfo: {
    pluginId: 'lifi',
    displayName: 'LI.FI',
    supportEmail: 'support@edge.app'
  },
  isEstimate: true,
  fromAsset: { pluginId, tokenId, nativeAmount },
  toAsset: { pluginId: 'polygon', tokenId: null, nativeAmount: '1000' },
  payoutAddress: '0x0',
  payoutWalletId: 'polygonWallet'
})

const makeTransaction = (
  transaction: Partial<EdgeTransaction>
): EdgeTransaction => ({
  blockHeight: 0,
  currencyCode: 'USDC',
  date: 0,
  isSend: true,
  memos: [],
  nativeAmount: '0',
  networkFee: '0',
  networkFees: [{ tokenId: null, nativeAmount: '10238000000000000' }],
  ourReceiveAddresses: [],
  signedTx: '',
  tokenId: null,
  txid: '',
  walletId: 'arcWallet',
  ...transaction
})

describe('getSwapSourceNativeAmount', () => {
  // A pending Arc USDC swap spends only its fee as the transaction value:
  const pulledSwap = { nativeAmount: '-10238000000000000' }

  it('reads the saved swap action when the call sends no value', () => {
    const transaction = makeTransaction({
      ...pulledSwap,
      savedAction: makeSwapAction('arc', null, '3000000000000000000')
    })
    expect(getSwapSourceNativeAmount(transaction, 'arc')).toBe(
      '3000000000000000000'
    )
  })

  it('subtracts the fee when there is no saved action', () => {
    const transaction = makeTransaction({
      nativeAmount: '-3010238000000000000'
    })
    expect(getSwapSourceNativeAmount(transaction, 'arc')).toBe(
      '3000000000000000000'
    )
  })

  it('subtracts the fee when the saved action has no amount', () => {
    const transaction = makeTransaction({
      ...pulledSwap,
      savedAction: makeSwapAction('arc', null)
    })
    expect(getSwapSourceNativeAmount(transaction, 'arc')).toBe('0')
  })

  it('ignores a saved action for another asset', () => {
    const otherToken = makeTransaction({
      ...pulledSwap,
      savedAction: makeSwapAction('arc', 'eurc', '5000000')
    })
    expect(getSwapSourceNativeAmount(otherToken, 'arc')).toBe('0')

    const otherChain = makeTransaction({
      ...pulledSwap,
      savedAction: makeSwapAction('polygon', null, '5000000')
    })
    expect(getSwapSourceNativeAmount(otherChain, 'arc')).toBe('0')
  })

  it('subtracts only the fee paid in the transaction asset', () => {
    const transaction = makeTransaction({
      nativeAmount: '-5000000',
      networkFees: [
        { tokenId: 'eurc', nativeAmount: '0' },
        { tokenId: null, nativeAmount: '10238000000000000' }
      ],
      tokenId: 'eurc'
    })
    expect(getSwapSourceNativeAmount(transaction, 'arc')).toBe('5000000')
  })

  it('ignores a saved action that is not a swap', () => {
    const transaction = makeTransaction({
      ...pulledSwap,
      savedAction: {
        actionType: 'tokenApproval',
        tokenApproved: {
          pluginId: 'arc',
          tokenId: null,
          nativeAmount: '3000000000000000000'
        },
        tokenContractAddress: '0x3600000000000000000000000000000000000000',
        contractAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE'
      }
    })
    expect(getSwapSourceNativeAmount(transaction, 'arc')).toBe('0')
  })
})
