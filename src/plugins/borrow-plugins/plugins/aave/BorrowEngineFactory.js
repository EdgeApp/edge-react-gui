// @flow

import { type Cleaner, asMaybe } from 'cleaners'
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'

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
    // Cleaners
    //

    const asEdgeToken = (tokenId: string) => {
      const edgeToken = wallet.currencyConfig.allTokens[tokenId]
      if (edgeToken == null) throw new Error(`Unable to find token on wallet for ${tokenId} tokenId`)
      return edgeToken
    }
    const asTokenAddress = (token: EdgeToken) => {
      const tokenAddress = asMaybe(asTokenContractAddress)(token)
      if (tokenAddress == null) throw new Error(`Unable to find contract address for ${token.displayName} (${token.currencyCode})`)
      return tokenAddress
    }
    const asTokenIdParam = (tokenId?: string) => {
      if (tokenId == null) throw new Error('Getting wrapped native token not supported yet. ' + 'Explicitly pass in tokenId for the wrapped token.')
      return tokenId
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
      .map(({ address, vBalance, variableApr }) => {
        return {
          tokenId: addressToTokenId(address),
          nativeAmount: vBalance.toString(),
          apr: variableApr
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
        tokenId = asTokenIdParam(tokenId)

        const edgeToken = asEdgeToken(tokenId)
        const tokenAddress = asTokenAddress(edgeToken)

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
