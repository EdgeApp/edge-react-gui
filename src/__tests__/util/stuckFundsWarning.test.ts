import type { EdgeBalanceMap, EdgeTokenId } from 'edge-core-js'

import {
  getGasFeeNativeAmount,
  getStuckFundsWarning
} from '../../util/stuckFundsWarning'

const makeBalanceMap = (
  entries: Array<[EdgeTokenId, string]>
): EdgeBalanceMap => new Map(entries)

const USDT_TOKEN_ID = 'dac17f958d2ee523a2206206994597c13d831ec7'

describe('getGasFeeNativeAmount', () => {
  it('totals only the fees paid in the gas asset', () => {
    expect(
      getGasFeeNativeAmount([
        { tokenId: null, nativeAmount: '2100' },
        { tokenId: USDT_TOKEN_ID, nativeAmount: '5000' },
        { tokenId: null, nativeAmount: '900' }
      ])
    ).toBe('3000')
  })

  it('returns zero when no fee is paid in the gas asset', () => {
    expect(
      getGasFeeNativeAmount([{ tokenId: USDT_TOKEN_ID, nativeAmount: '5000' }])
    ).toBe('0')
  })
})

describe('getStuckFundsWarning', () => {
  it('warns when a max send strands a token balance', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '1000'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '900'
      })
    ).toBe('tokens-remain')
  })

  it('warns when the leftover gas cannot cover another fee', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '1000'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '800'
      })
    ).toBe('tokens-remain')
  })

  it('stays quiet when the leftover gas covers another fee', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '1000'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '700'
      })
    ).toBeUndefined()
  })

  it('warns when a token send burns the last of the gas', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '100'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '0'
      })
    ).toBe('tokens-remain')
  })

  it('stays quiet when the wallet holds no tokens', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([[null, '1000']]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '900'
      })
    ).toBeUndefined()
  })

  it('ignores zero token balances', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '1000'],
          [USDT_TOKEN_ID, '0']
        ]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '900'
      })
    ).toBeUndefined()
  })

  it('warns when a token-less wallet swaps all its gas into a local token', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([[null, '1000']]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '900',
        receivesTokenInSameWallet: true
      })
    ).toBe('swap-into-token')
  })

  it('stays quiet when the swap payout leaves the wallet', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([[null, '1000']]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '900',
        receivesTokenInSameWallet: false
      })
    ).toBeUndefined()
  })

  it('stays quiet when a same-wallet swap buys back the gas it spends', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '100'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasReceivedNativeAmount: '5000',
        gasSpentNativeAmount: '0'
      })
    ).toBeUndefined()
  })

  it('still warns when the gas bought back is too small', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '100'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasReceivedNativeAmount: '50',
        gasSpentNativeAmount: '0'
      })
    ).toBe('tokens-remain')
  })

  it('stays quiet when the transaction empties the last token', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '100'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '0',
        spentTokenAmount: {
          tokenId: USDT_TOKEN_ID,
          nativeAmount: '100000000'
        }
      })
    ).toBeUndefined()
  })

  it('warns when the transaction leaves part of the token behind', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '100'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '100',
        gasSpentNativeAmount: '0',
        spentTokenAmount: {
          tokenId: USDT_TOKEN_ID,
          nativeAmount: '99999999'
        }
      })
    ).toBe('tokens-remain')
  })

  it('stays quiet on chains that charge no gas fee', () => {
    expect(
      getStuckFundsWarning({
        balanceMap: makeBalanceMap([
          [null, '0'],
          [USDT_TOKEN_ID, '100000000']
        ]),
        gasFeeNativeAmount: '0',
        gasSpentNativeAmount: '0'
      })
    ).toBeUndefined()
  })
})
