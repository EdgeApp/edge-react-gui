import { gt } from 'biggystring'
import { asMaybe, Cleaner } from 'cleaners'
import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import { BigNumber, BigNumberish, ethers, Overrides } from 'ethers'
import { ContractMethod, ParaSwap, SwapSide } from 'paraswap'

import { snooze, zeroString } from '../../../../util/utils'
import { withWatchableProps } from '../../../../util/withWatchableProps'
import { asTxInfo, CallInfo, makeApprovableCall, makeTxCalls, TxInfo } from '../../common/ApprovableCall'
import { asGraceful } from '../../common/cleaners/asGraceful'
import { composeApprovableActions } from '../../common/util/composeApprovableActions'
import { ApprovableAction, BorrowCollateral, BorrowDebt, BorrowEngine, BorrowRequest, DepositRequest, RepayRequest, WithdrawRequest } from '../../types'
import { AaveNetwork } from './AaveNetwork'
export { ContractMethod, SwapSide } from 'paraswap-core'

const PARASWAP_SLIPPAGE_PERCENT = 1
export const MAX_AMOUNT = ethers.constants.MaxUint256

export type BorrowEngineBlueprint = {
  aaveNetwork: AaveNetwork
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

    const addressToTokenId = (address: string): string | undefined => {
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
        throw new Error(
          `Wallet parameter's plugin ID ${walletParam.currencyInfo.pluginId} must match borrow engine's wallet plugin ID ${wallet.currencyInfo.pluginId}`
        )
    }
    const getApproveAllowanceTx = async (
      allowanceAmount: string,
      ownerAddress: string,
      spenderAddress: string,
      tokenContract: ethers.Contract,
      overrides?: Overrides
    ): Promise<TxInfo | null> => {
      const allowance = await tokenContract.allowance(ownerAddress, spenderAddress)
      if (!allowance.sub(allowanceAmount).gte(0)) {
        return asGracefulTxInfo(
          await tokenContract.populateTransaction.approve(spenderAddress, ethers.constants.MaxUint256, {
            gasLimit: '500000',
            ...overrides
          })
        )
      }
      return null
    }

    //
    // Network Synchronization
    //

    const loadNetworkData = async (): Promise<void> => {
      try {
        // Collaterals and Debts:
        const reserveTokenBalances = await aaveNetwork.getReserveTokenBalances(walletAddress)
        const collaterals: BorrowCollateral[] = reserveTokenBalances.map(({ address, aBalance }) => {
          return {
            tokenId: addressToTokenId(address),
            nativeAmount: aBalance.toString()
          }
        })
        const debts: BorrowDebt[] = reserveTokenBalances.map(({ address, vBalance, variableApr }) => {
          return {
            tokenId: addressToTokenId(address),
            nativeAmount: vBalance.toString(),
            apr: variableApr
          }
        })

        // Loan to value:
        const userData = await aaveNetwork.lendingPool.getUserAccountData(walletAddress)
        const { totalCollateralETH, totalDebtETH } = userData
        const loanToValue = parseFloat(totalDebtETH.toString()) / parseFloat(totalCollateralETH.toString())

        instance.collaterals = collaterals
        instance.debts = debts
        instance.loanToValue = loanToValue
        instance.syncRatio = 1
      } catch (error: any) {
        console.warn(`Failed to load BorrowEngine for wallet '${wallet.id}': ${String(error)}`)
        console.error(error)
        await snooze(2000)
        return await loadNetworkData()
      } finally {
        // Re-sync after delay
        await snooze(15000)
        await loadNetworkData()
      }
    }

    //
    // Engine Instance
    //

    const instance: BorrowEngine = withWatchableProps({
      currencyWallet: wallet,
      collaterals: [] as BorrowCollateral[],
      debts: [] as BorrowDebt[],
      loanToValue: 0,
      syncRatio: 0,

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
        if (zeroString(nativeAmount)) throw new Error('BorrowEngine: withdraw request contains no nativeAmount.')

        validateWalletParam(fromWallet)

        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        const spenderAddress = (await wallet.getReceiveAddress()).publicAddress

        const asset = tokenAddress
        const amount = BigNumber.from(nativeAmount)
        const onBehalfOf = fromWallet === wallet ? spenderAddress : (await fromWallet.getReceiveAddress()).publicAddress
        const tokenContract = await aaveNetwork.makeTokenContract(tokenAddress)

        const gasPrice = await aaveNetwork.provider.getGasPrice()
        const txCallInfos: CallInfo[] = []

        const approveTx = await getApproveAllowanceTx(nativeAmount, onBehalfOf, aaveNetwork.lendingPool.address, tokenContract, { gasPrice })
        if (approveTx != null) {
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
        if (zeroString(nativeAmount)) throw new Error('BorrowEngine: withdraw request contains no nativeAmount.')

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
        if (zeroString(nativeAmount)) throw new Error('BorrowEngine: borrow request contains no nativeAmount.')

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
        const { nativeAmount, fromTokenId, tokenId, fromWallet = wallet } = request
        if (zeroString(nativeAmount)) throw new Error('BorrowEngine: repay request contains no nativeAmount.')

        const fromAddress = (await fromWallet.getReceiveAddress()).publicAddress

        const debtToken = getToken(tokenId)
        const debtTokenAddress = getTokenAddress(getToken(tokenId))
        // HACK: Action queue doesn't wait until borrowEngine has synced before using it
        if (instance.debts.find(debt => debt.tokenId === tokenId) == null) {
          const reserveTokenBalances = await aaveNetwork.getReserveTokenBalances(walletAddress)
          instance.debts = reserveTokenBalances.map(({ address, vBalance, variableApr }) => {
            return {
              tokenId: addressToTokenId(address),
              nativeAmount: vBalance.toString(),
              apr: variableApr
            }
          })
        }
        const debt = instance.debts.find(debt => debt.tokenId === tokenId)
        if (debt == null) throw new Error(`No debts to repay for ${tokenId}`)

        const amount = BigNumber.from(nativeAmount)
        const amountToCover =
          amount.eq(MAX_AMOUNT) || gt(debt.nativeAmount, nativeAmount)
            ? BigNumber.from(instance.debts.find(debt => debt.tokenId === tokenId)?.nativeAmount ?? 0)
            : amount

        const gasPrice: BigNumberish = await aaveNetwork.provider.getGasPrice()
        const txCallInfos: CallInfo[] = []

        // Repay with collateral
        if (fromTokenId != null) {
          if (fromTokenId == null) throw new Error('Native wrapped collateral not supported for closeWithCollateral')
          if (tokenId == null) throw new Error('Native wrapped debt not supported for closeWithCollateral')

          const collateralToken = getToken(fromTokenId)
          const collateralTokenAddress = getTokenAddress(collateralToken)

          // Build ParaSwap swap info
          // Cap the amount to swap at the debt amount
          const amountToSwap = amountToCover.mul(100 + PARASWAP_SLIPPAGE_PERCENT).div(100)
          const chainId = fromWallet.currencyInfo.defaultSettings.otherSettings.chainParams.chainId
          const paraswap = new ParaSwap(chainId, 'https://apiv5.paraswap.io')
          const priceRoute = await paraswap.getRate(collateralTokenAddress, debtTokenAddress, amountToSwap.toString(), fromAddress, SwapSide.BUY, {
            partner: 'aave',
            excludeContractMethods: [ContractMethod.simpleBuy]
          })

          if ('message' in priceRoute) throw new Error('BorrowEngine: Error getting priceRoute: ' + priceRoute.message)
          const priceWithSlippage = ethers.BigNumber.from(priceRoute.srcAmount).mul(101).div(100).toString()
          const swapTxParams = await paraswap.buildTx(
            collateralTokenAddress,
            debtTokenAddress,
            priceWithSlippage,
            priceRoute.destAmount,
            priceRoute,
            fromAddress,
            'aave',
            undefined,
            undefined,
            undefined,
            { ignoreChecks: true }
          )
          if ('message' in swapTxParams) throw new Error('BorrowEngine: Error getting swapTxParams: ' + swapTxParams.message)

          // Approve the AAVE aToken
          const aCollateralContract = (await aaveNetwork.getReserveTokenContracts(collateralTokenAddress)).aToken
          const { paraSwapRepayAdapter } = aaveNetwork
          const approveTx = await getApproveAllowanceTx(amountToSwap.toString(), fromAddress, paraSwapRepayAdapter.address, aCollateralContract)
          if (approveTx != null) {
            txCallInfos.push({
              tx: approveTx,
              wallet,
              metadata: {
                name: 'AAVE',
                category: 'expense',
                notes: `AAVE contract approval`
              }
            })
          }

          const repayTx = asGracefulTxInfo(
            await paraSwapRepayAdapter.populateTransaction.swapAndRepay(
              fromTokenId,
              tokenId,
              priceWithSlippage,
              priceRoute.destAmount,
              2, // 1 = stable, 2 = variable
              164, // buyAllBalanceOffset 164 = Augustus V5 buy. Function call to handle the slight interest accrued after the tx is broadcasted
              ethers.utils.defaultAbiCoder.encode(['bytes', 'address'], [swapTxParams.data, swapTxParams.to]),
              {
                amount: '0',
                deadline: '0',
                v: 0,
                r: '0x0000000000000000000000000000000000000000000000000000000000000000',
                s: '0x0000000000000000000000000000000000000000000000000000000000000000'
              },
              { gasLimit: '1800000', gasPrice }
            )
          )

          txCallInfos.push({
            tx: repayTx,
            wallet,
            metadata: {
              name: 'AAVE',
              category: 'transfer',
              notes: `AAVE repay ${debtToken.displayName} with ${collateralToken.displayName} collateral`
            }
          })

          const actions = await makeTxCalls(txCallInfos)
          return composeApprovableActions(...actions)
        } else {
          // Repay with wallet funds
          const tokenContract = await aaveNetwork.makeTokenContract(debtTokenAddress)

          const approveTx = await getApproveAllowanceTx(amountToCover.toString(), fromAddress, aaveNetwork.lendingPool.address, tokenContract, { gasPrice })
          if (approveTx != null) {
            txCallInfos.push({
              tx: approveTx,
              wallet,
              spendToken: debtToken,
              metadata: {
                name: 'AAVE',
                category: 'expense',
                notes: `AAVE contract approval`
              }
            })
          }

          const repayTx = asGracefulTxInfo(
            await aaveNetwork.lendingPool.populateTransaction.repay(debtTokenAddress, amount, INTEREST_RATE_MODE, fromAddress, {
              gasLimit: '800000',
              gasPrice
            })
          )

          txCallInfos.push({
            tx: repayTx,
            wallet,
            spendToken: debtToken,
            metadata: {
              name: 'AAVE',
              category: 'transfer',
              notes: `Repay ${debtToken.displayName} loan`
            }
          })
        }
        const actions = await makeTxCalls(txCallInfos)
        return composeApprovableActions(...actions)
      }
    })

    // Initialization:
    loadNetworkData()

    // Return instance:
    return instance
  }
}

// -----------------------------------------------------------------------------
// Private Cleaners
// -----------------------------------------------------------------------------

const asGracefulTxInfo = asGraceful(asTxInfo, 'Invalid transaction response')
