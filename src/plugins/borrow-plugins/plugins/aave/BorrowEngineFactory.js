// @flow

import { type Cleaner, asMaybe } from 'cleaners'
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
  aaveNetwork: AaveNetwork,
  // Cleans an EdgeToken to a contract address
  asTokenContractAddress: Cleaner<string>
}

export const makeBorrowEngineFactory = (blueprint: BorrowEngineBlueprint) => {
  return async (wallet: EdgeCurrencyWallet): Promise<BorrowEngine> => {
    const { aaveNetwork, asTokenContractAddress } = blueprint
    const walletAddress = (await wallet.getReceiveAddress()).publicAddress

    //
    // Private Methods
    //

    const addressToTokenId = (address: string): string | void => {
      const addressNormalized = address.toLowerCase()
      const tokenIds = Object.keys(wallet.currencyConfig.allTokens)
      for (const tokenId of tokenIds) {
        const token = wallet.currencyConfig.allTokens[tokenId]
        const networkLocation = asMaybe(asTokenContractAddress)(token)

        if (networkLocation == null) continue

        if (networkLocation === addressNormalized) {
          return tokenId
        }
      }
    }

    //
    // Collaterals and Debts
    //

    const reserveTokenBalances = await aaveNetwork.getReserveTokenBalances(walletAddress)
    const collaterals: BorrowCollateral[] = reserveTokenBalances
      .filter(({ aBalance }) => !aBalance.eq(0))
      .map(({ address, aBalance }) => {
        return {
          tokenId: addressToTokenId(address),
          nativeAmount: aBalance.toString()
        }
      })
    const debts: BorrowDebt[] = reserveTokenBalances
      .filter(({ vBalance }) => !vBalance.eq(0))
      .map(({ address, vBalance }) => {
        return {
          tokenId: addressToTokenId(address),
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
