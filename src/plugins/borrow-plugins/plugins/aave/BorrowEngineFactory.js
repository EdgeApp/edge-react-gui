// @flow
import { gt } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'

import {
  type ApprovableAction,
  type BorrowCollateral,
  type BorrowDebt,
  type BorrowEngine,
  type BorrowRequest,
  type DepositRequest,
  type RepayRequest,
  type WithdrawRequest
} from '../../types'
import { type AaveNetwork } from './AaveNetwork'
import { addressToTokenId } from './util/addressToTokenId'

export type BorrowEngineBlueprint = {
  aaveNetwork: AaveNetwork,
  enabledTokens: {
    [symbol: string]: {
      isCollateral: boolean,
      isDebt: boolean
    }
  }
}

export const makeBorrowEngineFactory =
  (blueprint: BorrowEngineBlueprint) =>
  async (wallet: EdgeCurrencyWallet): Promise<BorrowEngine> => {
    const { aaveNetwork, enabledTokens } = blueprint

    const walletAddress = (await wallet.getReceiveAddress()).publicAddress

    const reserveTokens = await aaveNetwork.getAllReservesTokens()
    const collateralTokens = reserveTokens.filter(token => enabledTokens[token.symbol]?.isCollateral)
    const debtTokens = reserveTokens.filter(token => enabledTokens[token.symbol]?.isDebt)

    const whenCollaterals: Promise<BorrowCollateral>[] = collateralTokens.map(async token => {
      const { aToken } = await aaveNetwork.getReserveTokensAddresses(token.address)
      const balance = await aToken.balanceOf(walletAddress)

      return {
        tokenId: addressToTokenId(token.address),
        nativeAmount: balance.toString()
      }
    })
    const whenDebts: Promise<BorrowDebt>[] = debtTokens.map(async token => {
      const { vToken } = await aaveNetwork.getReserveTokensAddresses(token.address)
      const balance = await vToken.balanceOf(walletAddress)

      return {
        tokenId: addressToTokenId(token.address),
        nativeAmount: balance.toString(),
        apy: 0
      }
    })
    await Promise.all([...whenCollaterals, ...whenDebts])

    const collaterals: $PropertyType<BorrowEngine, 'collaterals'> = (await Promise.all(whenCollaterals)).filter(item => gt(item.nativeAmount, '0'))
    const debts: $PropertyType<BorrowEngine, 'debts'> = (await Promise.all(whenDebts)).filter(item => gt(item.nativeAmount, '0'))

    return {
      currencyWallet: wallet,
      collaterals,
      debts,

      loanToValue: 55,

      async getAprQuote(tokenId?: string): Promise<number> {
        return 0.0381
      },

      async deposit(request: DepositRequest): Promise<ApprovableAction> {
        return {
          networkFee: {
            currencyCode: wallet.currencyInfo.currencyCode,
            nativeAmount: '2100000000000000'
          },
          approve: async () => {}
        }
      },
      async withdraw(request: WithdrawRequest): Promise<ApprovableAction> {
        return {
          networkFee: {
            currencyCode: wallet.currencyInfo.currencyCode,
            nativeAmount: '2100000000000000'
          },
          approve: async () => {}
        }
      },
      async borrow(request: BorrowRequest): Promise<ApprovableAction> {
        return {
          networkFee: {
            currencyCode: wallet.currencyInfo.currencyCode,
            nativeAmount: '2100000000000000'
          },
          approve: async () => {}
        }
      },
      async repay(request: RepayRequest): Promise<ApprovableAction> {
        return {
          networkFee: {
            currencyCode: wallet.currencyInfo.currencyCode,
            nativeAmount: '2100000000000000'
          },
          approve: async () => {}
        }
      },
      async close(): Promise<ApprovableAction> {
        return {
          networkFee: {
            currencyCode: wallet.currencyInfo.currencyCode,
            nativeAmount: '2100000000000000'
          },
          approve: async () => {}
        }
      }
    }
  }
