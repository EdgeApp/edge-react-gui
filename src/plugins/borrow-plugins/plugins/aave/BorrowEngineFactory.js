// @flow
import { div } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'

import { MAX_FLOAT_PRECISION } from '../../constants'
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
      .map(({ tokenId, vBalance, variableApr }) => {
        return {
          tokenId,
          nativeAmount: vBalance.toString(),
          apr: variableApr
        }
      })

    //
    // Loan to value
    //

    const userData = await aaveNetwork.lendingPool.getUserAccountData(walletAddress)
    const { totalCollateralETH, totalDebtETH } = userData
    const loanToValue = parseFloat(div(totalDebtETH.toString(), totalCollateralETH.toString(), MAX_FLOAT_PRECISION))

    //
    // Engine Instance
    //

    return {
      currencyWallet: wallet,
      collaterals,
      debts,

      loanToValue,

      async getAprQuote(tokenId?: string): Promise<number> {
        if (tokenId == null) throw new Error('Getting wrapped native token not supported yet. ' + 'Explicitly pass in tokenId for the wrapped token.')

        const edgeToken = wallet.currencyConfig.allTokens[tokenId]
        const tokenAddress: string | void = edgeToken?.networkLocation?.contractAddress

        if (tokenAddress == null) throw new Error(`Unable to find token on wallet for ${tokenId} tokenId`)

        const { variableApr } = await aaveNetwork.getReserveTokenRates(tokenAddress)

        return variableApr
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
