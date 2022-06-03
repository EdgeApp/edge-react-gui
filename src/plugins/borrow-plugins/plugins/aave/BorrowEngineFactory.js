// @flow

import { type Cleaner, asMaybe } from 'cleaners'
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import { BigNumber, ethers } from 'ethers'

import { type CallInfo, asTxInfo, makeApprovableCall, makeTxCalls } from '../../common/ApprovableCall'
import { asGraceful } from '../../common/cleaners/asGraceful'
import { composeApprovableActions } from '../../common/util/composeApprovableActions'
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
    const INTEREST_RATE_MODE = 2 // Only variable is supported for now

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
    const getToken = (tokenId?: string): EdgeToken => {
      if (tokenId == null) throw new Error('Getting wrapped native token not supported yet. ' + 'Explicitly pass in tokenId for the wrapped token.')
      const token = wallet.currencyConfig.allTokens[tokenId]
      if (token == null) throw new Error(`Unable to find token on wallet for ${tokenId} tokenId`)
      return token
    }
    const getTokenAddress = (token: EdgeToken) => {
      const tokenAddress = asMaybe(asTokenContractAddress)(token)
      if (tokenAddress == null) throw new Error(`Unable to find contract address for ${token.displayName} (${token.currencyCode})`)
      return tokenAddress
    }
    const validateWalletParam = (walletParam: EdgeCurrencyWallet) => {
      if (walletParam.currencyInfo.pluginId !== wallet.currencyInfo.pluginId)
        throw new Error(`Wallet parameter's plugin ID must match borrow engine's wallet plugin ID`)
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
    // Loan to value
    //

    const userData = await aaveNetwork.lendingPool.getUserAccountData(walletAddress)
    const { totalCollateralETH, totalDebtETH } = userData
    const loanToValue = parseFloat(totalDebtETH.toString()) / parseFloat(totalCollateralETH.toString())

    //
    // Engine Instance
    //

    return {
      currencyWallet: wallet,
      collaterals,
      debts,

      loanToValue,

      async getAprQuote(tokenId?: string): Promise<number> {
        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        if (tokenAddress == null) {
          throw new Error(`AAVE requires a contract address, but tokenId '${tokenId ?? ''}' has none`)
        }

        const { variableApr } = await aaveNetwork.getReserveTokenRates(tokenAddress)

        return variableApr
      },

      async deposit(request: DepositRequest): Promise<ApprovableAction> {
        const { nativeAmount, tokenId, fromWallet = wallet } = request
        validateWalletParam(fromWallet)

        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        const spenderAddress = (await wallet.getReceiveAddress()).publicAddress

        const asset = tokenAddress
        const amount = BigNumber.from(nativeAmount)
        const onBehalfOf = fromWallet === wallet ? spenderAddress : (await fromWallet.getReceiveAddress()).publicAddress
        const amountToCover = amount.eq(ethers.constants.MaxUint256) ? BigNumber.from(debts.find(debt => debt.tokenId === tokenId)?.nativeAmount ?? 0) : amount

        const tokenContract = await aaveNetwork.makeTokenContract(tokenAddress)

        // Check balance of token
        const balance = await tokenContract.balanceOf(spenderAddress)
        if (amountToCover.gt(balance)) {
          throw new Error(`Insufficient funds to deposit ${token.displayName} collateral`)
        }

        const gasPrice = await aaveNetwork.provider.getGasPrice()

        const txCallInfos: CallInfo[] = []

        const allowance = await tokenContract.allowance(onBehalfOf, aaveNetwork.lendingPool.address)
        if (!allowance.sub(nativeAmount).gte(0)) {
          const approveTx = asGracefulTxInfo(
            await tokenContract.populateTransaction.approve(aaveNetwork.lendingPool.address, ethers.constants.MaxUint256, {
              gasLimit: '500000',
              gasPrice
            })
          )
          txCallInfos.push({
            tx: approveTx,
            wallet,
            spendToken: token,
            metadata: {
              name: 'AAVE',
              category: 'expense',
              notes: `AAVE contract approval`
            }
          })
        }

        const depositTx = asGracefulTxInfo(
          await aaveNetwork.lendingPool.populateTransaction.deposit(asset, amount, onBehalfOf, REFERRAL_CODE, { gasLimit: '800000', gasPrice })
        )
        txCallInfos.push({
          tx: depositTx,
          wallet,
          spendToken: token,
          metadata: {
            name: 'AAVE',
            category: 'transfer',
            notes: `Deposit ${token.currencyCode} collateral`
          }
        })

        const actions = await makeTxCalls(txCallInfos)

        return composeApprovableActions(...actions)
      },
      async withdraw(request: WithdrawRequest): Promise<ApprovableAction> {
        const { nativeAmount, tokenId, toWallet = wallet } = request
        validateWalletParam(toWallet)

        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        const asset = tokenAddress
        const amount = BigNumber.from(nativeAmount)
        const to = (await toWallet.getReceiveAddress()).publicAddress

        const gasPrice = await aaveNetwork.provider.getGasPrice()

        const withdrawTx = asGracefulTxInfo(await aaveNetwork.lendingPool.populateTransaction.withdraw(asset, amount, to, { gasLimit: '800000', gasPrice }))

        return await makeApprovableCall({
          tx: withdrawTx,
          wallet,
          metadata: {
            name: 'AAVE',
            category: 'transfer',
            notes: `Withdraw ${token.currencyCode} collateral`
          }
        })
      },
      async borrow(request: BorrowRequest): Promise<ApprovableAction> {
        const { nativeAmount, tokenId, fromWallet = wallet } = request

        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        const asset = tokenAddress
        const amount = BigNumber.from(nativeAmount)
        const onBehalfOf = (await fromWallet.getReceiveAddress()).publicAddress

        const gasPrice = await aaveNetwork.provider.getGasPrice()

        const borrowTx = asGracefulTxInfo(
          await aaveNetwork.lendingPool.populateTransaction.borrow(asset, amount, INTEREST_RATE_MODE, REFERRAL_CODE, onBehalfOf, {
            gasLimit: '800000',
            gasPrice
          })
        )

        return await makeApprovableCall({
          tx: borrowTx,
          wallet,
          metadata: {
            name: 'AAVE',
            category: 'transfer',
            notes: `Borrow ${token.displayName} loan`
          }
        })
      },
      async repay(request: RepayRequest): Promise<ApprovableAction> {
        const { nativeAmount, tokenId, fromWallet = wallet } = request

        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        const spenderAddress = (await wallet.getReceiveAddress()).publicAddress

        const asset = tokenAddress
        const amount = BigNumber.from(nativeAmount)
        const onBehalfOf = fromWallet === wallet ? spenderAddress : (await fromWallet.getReceiveAddress()).publicAddress
        const amountToCover = amount.eq(ethers.constants.MaxUint256) ? BigNumber.from(debts.find(debt => debt.tokenId === tokenId)?.nativeAmount ?? 0) : amount

        const tokenContract = await aaveNetwork.makeTokenContract(tokenAddress)

        // Check balance of token
        const balance = await tokenContract.balanceOf(spenderAddress)
        if (amountToCover.gt(balance)) {
          throw new Error(`Insufficient funds to repay ${token.displayName} loan`)
        }

        const gasPrice = await aaveNetwork.provider.getGasPrice()
        const txCallInfos: CallInfo[] = []

        const allowance = await tokenContract.allowance(onBehalfOf, aaveNetwork.lendingPool.address)
        if (!allowance.sub(amountToCover).gte(0)) {
          const approveTx = asGracefulTxInfo(
            await tokenContract.populateTransaction.approve(aaveNetwork.lendingPool.address, ethers.constants.MaxUint256, {
              gasLimit: '500000',
              gasPrice
            })
          )
          txCallInfos.push({
            tx: approveTx,
            wallet,
            spendToken: token,
            metadata: {
              name: 'AAVE',
              category: 'expense',
              notes: `AAVE contract approval`
            }
          })
        }

        const repayTx = asGracefulTxInfo(
          await aaveNetwork.lendingPool.populateTransaction.repay(asset, amount, INTEREST_RATE_MODE, onBehalfOf, {
            gasLimit: '800000',
            gasPrice
          })
        )

        txCallInfos.push({
          tx: repayTx,
          wallet,
          spendToken: token,
          metadata: {
            name: 'AAVE',
            category: 'transfer',
            notes: `Repay ${token.displayName} loan`
          }
        })

        const actions = await makeTxCalls(txCallInfos)

        return composeApprovableActions(...actions)
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

// -----------------------------------------------------------------------------
// Private Cleaners
// -----------------------------------------------------------------------------

const asGracefulTxInfo = asGraceful(asTxInfo, 'Invalid transaction response')
