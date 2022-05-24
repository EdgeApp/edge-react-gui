// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'

import { type ApprovableAction, type BorrowEngine, type BorrowRequest, type DepositRequest, type RepayRequest, type WithdrawRequest } from '../../types'

export type BorrowEngineBlueprint = {}

export const makeBorrowEngineFactory =
  (blueprint: BorrowEngineBlueprint) =>
  async (wallet: EdgeCurrencyWallet): Promise<BorrowEngine> => {
    return {
      currencyWallet: wallet,
      collaterals: [
        {
          tokenId: '2260fac5e5542a773aa44fbcfedf7c193bc2c599',
          nativeAmount: '100000000'
        }
      ],
      debts: [
        {
          tokenId: '6b175474e89094c44da98b954eedeac495271d0f',
          nativeAmount: '60000000000000000000000',
          apr: 0.0825
        }
      ],

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
