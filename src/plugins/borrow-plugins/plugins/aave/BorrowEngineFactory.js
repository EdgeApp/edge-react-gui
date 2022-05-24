// @flow

import { div } from 'biggystring'
import { type Cleaner, asMaybe, asObject, asString } from 'cleaners'
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import { BigNumber, ethers } from 'ethers'

import { type CallInfo, makeApprovableCall, makeTxCalls } from '../../common/ApprovableCall'
import { composeApprovableActions } from '../../common/util/composeApprovableActions'
import { MAX_JS_FLOAT_PRECISION } from '../../constants'
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

    const REFERRAL_CODE = 0 // No referral code is used for AAVE contract calls

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
    const asWalletParam = (walletParam?: EdgeCurrencyWallet) => {
      // Fallback to engine's wallet
      if (walletParam == null) return wallet
      if (walletParam.currencyInfo.pluginId !== wallet.currencyInfo.pluginId)
        throw new Error(`Wallet parameter's plugin ID must match borrow engine's wallet plugin ID`)
      return walletParam
    }
    const asDepositRequest = asObject({
      tokenId: asTokenIdParam,
      nativeAmount: asString,
      fromWallet: asWalletParam
    })
    const asWithdrawRequest = asObject({
      tokenId: asTokenIdParam,
      nativeAmount: asString,
      toWallet: asWalletParam
    })

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
    // Loan to value
    //

    const userData = await aaveNetwork.lendingPool.getUserAccountData(walletAddress)
    const { totalCollateralETH, totalDebtETH } = userData
    const loanToValue = parseFloat(div(totalDebtETH.toString(), totalCollateralETH.toString(), MAX_JS_FLOAT_PRECISION))

    //
    // Engine Instance
    //

    return {
      currencyWallet: wallet,
      collaterals,
      debts,

      loanToValue,

      async getAprQuote(tokenId?: string): Promise<number> {
        tokenId = asTokenIdParam(tokenId)

        const edgeToken = asEdgeToken(tokenId)
        const tokenAddress = asTokenAddress(edgeToken)

        if (tokenAddress == null) throw new Error(`Unable to find token on wallet for ${tokenId} tokenId`)

        const { variableApr } = await aaveNetwork.getReserveTokenRates(tokenAddress)

        return variableApr
      },

      async deposit(request: DepositRequest): Promise<ApprovableAction> {
        const { nativeAmount, tokenId, fromWallet } = asDepositRequest(request)

        const token = asEdgeToken(tokenId)
        const tokenAddress = asTokenAddress(token)

        const asset = tokenAddress
        const amount = BigNumber.from(nativeAmount)
        const onBehalfOf = (await fromWallet.getReceiveAddress()).publicAddress

        const gasPrice = await aaveNetwork.provider.getGasPrice()

        const tokenContract = await aaveNetwork.makeTokenContract(tokenAddress)

        const txCallInfos: CallInfo[] = []

        const allowance = await tokenContract.allowance(onBehalfOf, aaveNetwork.lendingPool.address)
        if (!allowance.sub(nativeAmount).gte(0)) {
          const approveTx = await tokenContract.populateTransaction.approve(aaveNetwork.lendingPool.address, ethers.constants.MaxUint256, {
            gasLimit: '500000',
            gasPrice
          })
          txCallInfos.push({
            tx: approveTx,
            wallet,
            token,
            metadata: {
              name: 'AAVE',
              category: 'expense:approval',
              notes: `AAVE contract approval`
            }
          })
        }

        const depositTx = await aaveNetwork.lendingPool.populateTransaction.deposit(asset, amount, onBehalfOf, REFERRAL_CODE, { gasLimit: '800000', gasPrice })
        txCallInfos.push({
          tx: depositTx,
          wallet,
          token,
          metadata: {
            name: 'AAVE',
            category: 'transfer:deposit',
            notes: `Deposit ${token.currencyCode} collateral`
          }
        })

        const actions = await makeTxCalls(txCallInfos)

        return composeApprovableActions(...actions)
      },
      async withdraw(request: WithdrawRequest): Promise<ApprovableAction> {
        const { nativeAmount, tokenId, toWallet } = asWithdrawRequest(request)

        const token = asEdgeToken(tokenId)
        const tokenAddress = asTokenAddress(token)

        const asset = tokenAddress
        const amount = BigNumber.from(nativeAmount)
        const to = (await toWallet.getReceiveAddress()).publicAddress

        const gasPrice = await aaveNetwork.provider.getGasPrice()

        const withdrawTx = await aaveNetwork.lendingPool.populateTransaction.withdraw(asset, amount, to, { gasLimit: '800000', gasPrice })

        return await makeApprovableCall({
          tx: withdrawTx,
          wallet,
          token,
          metadata: {
            name: 'AAVE',
            category: 'transfer:withdraw',
            notes: `Withdraw ${token.currencyCode} collateral`
          }
        })
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
