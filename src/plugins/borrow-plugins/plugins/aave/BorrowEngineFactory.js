// @flow
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

export type BorrowEngineBlueprint = {
  aaveNetwork: AaveNetwork
}

export const makeBorrowEngineFactory = (blueprint: BorrowEngineBlueprint) => {
  return async (wallet: EdgeCurrencyWallet): Promise<BorrowEngine> => {
    const { aaveNetwork } = blueprint

    const walletAddress = (await wallet.getReceiveAddress()).publicAddress

    //
    // Collaterals and Debts
    //

    const reserveTokenBalances = await aaveNetwork.getReserveTokenBalances(walletAddress)
    const collaterals: BorrowCollateral[] = reserveTokenBalances
      .filter(({ aBalance }) => !aBalance.eq(0))
      .map(({ tokenId, aBalance }) => {
        return {
          tokenId,
          nativeAmount: aBalance.toString()
        }
      })
    const debts: BorrowDebt[] = reserveTokenBalances
      .filter(({ vBalance }) => !vBalance.eq(0))
      .map(({ tokenId, vBalance }) => {
        return {
          tokenId,
          nativeAmount: vBalance.toString(),
          apr: 0.0825
        }
      })

    //
    // Engine Instance
    //

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
}
