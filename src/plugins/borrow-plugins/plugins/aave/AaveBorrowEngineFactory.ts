import { add, div, gt, gte, lt, min, mul } from 'biggystring'
import { asMaybe, Cleaner } from 'cleaners'
import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import { BigNumber, BigNumberish, ethers, Overrides } from 'ethers'
import { ContractMethod, ParaSwap, SwapSide } from 'paraswap'

import { showError } from '../../../../components/services/AirshipInstance'
import { MAX_AMOUNT } from '../../../../constants/valueConstants'
import { DECIMAL_PRECISION, snooze, zeroString } from '../../../../util/utils'
import { withWatchableProps } from '../../../../util/withWatchableProps'
import { asTxInfo, CallInfo, makeApprovableCall, makeSideEffectApprovableAction, makeTxCalls, TxInfo } from '../../common/ApprovableCall'
import { asGraceful } from '../../common/cleaners/asGraceful'
import { composeApprovableActions } from '../../common/util/composeApprovableActions'
import {
  ApprovableAction,
  BorrowCollateral,
  BorrowDebt,
  BorrowEngine,
  BorrowRequest,
  CalculateLtvRequest,
  DepositRequest,
  RepayRequest,
  WithdrawRequest
} from '../../types'
import { AaveNetwork } from './AaveNetwork'
export { ContractMethod, SwapSide } from 'paraswap-core'

const BALANCE_RESYNC_INTERVAL = 10 * 60 * 1000
const LTV_RESYNC_INTERVAL = 60 * 1000
const PARASWAP_SLIPPAGE_PERCENT = 1

export interface BorrowEngineBlueprint {
  aaveNetwork: AaveNetwork
  // Cleans an EdgeToken to a contract address
  asTokenContractAddress: Cleaner<string>
}

export const makeAaveBorrowEngineFactory = (blueprint: BorrowEngineBlueprint) => {
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
    const adjustCollateral = (tokenId: string | undefined, amount: string) => {
      if (instance.collaterals.length === 0) throw new Error(`Invalid execution time; too early invocation`)
      const index = instance.collaterals.findIndex(collateral => collateral.tokenId === tokenId)
      if (index === -1) throw new Error(`Could not find tokenId ${tokenId}`)
      // Update entry
      const collateral = instance.collaterals[index]
      collateral.nativeAmount = add(collateral.nativeAmount, amount)
      // Update entries field to trigger change event
      instance.collaterals = [...instance.collaterals]
    }
    const adjustDebt = (tokenId: string | undefined, amount: string) => {
      if (instance.debts.length === 0) throw new Error(`Invalid execution time; too early invocation`)
      const index = instance.debts.findIndex(debt => debt.tokenId === tokenId)
      if (index === -1) throw new Error(`Could not find tokenId ${tokenId}`)
      // Update entry
      const debt = instance.debts[index]
      debt.nativeAmount = add(debt.nativeAmount, amount)
      // Update entries field to trigger change event
      instance.debts = [...instance.debts]
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
    const updateLtv = async () => {
      const userData = await aaveNetwork.lendingPool.getUserAccountData(walletAddress)
      const { totalCollateralETH, totalDebtETH } = userData
      const loanToValue = parseFloat(totalDebtETH.toString()) / parseFloat(totalCollateralETH.toString())
      instance.loanToValue = isNaN(loanToValue) ? 0 : loanToValue
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
      if (overrides?.gasPrice == null) {
        const gasPrice = await aaveNetwork.provider.getGasPrice()
        overrides = { ...overrides, gasPrice }
        console.warn(`getApproveAllowanceTx was called without a gasPrice overrides parameter. The caller should pass the gasPrice instead.`)
      }
      return asGracefulTxInfo(
        await tokenContract.populateTransaction.approve(spenderAddress, BigNumber.from(allowanceAmount), {
          gasLimit: '500000',
          ...overrides
        })
      )
    }
    const getLoanAssetETHValue = async (loanAsset: BorrowCollateral | BorrowDebt): Promise<string> => {
      if (loanAsset.tokenId == null) throw new Error('getLoanAssetETHValue: No tokenId on supplied collateral or debt')
      const loanAssetMult = getToken(loanAsset.tokenId).denominations[0].multiplier
      const loanAssetEthPrice = await aaveNetwork.getAssetPrice(loanAsset.tokenId.toLowerCase())
      const loanAssetEthValue = div(mul(loanAsset.nativeAmount, loanAssetEthPrice.toString()), loanAssetMult)
      return loanAssetEthValue
    }

    //
    // Network Synchronization
    //

    const RESYNC_TIMES = {
      LTV: 0,
      BALANCE: 0
    }
    const startNetworkSyncLoop = async (): Promise<void> => {
      if (!instance.isRunning) return

      const now = Date.now()

      try {
        if (now >= RESYNC_TIMES.LTV) {
          // Loan to value:
          await updateLtv()
          RESYNC_TIMES.LTV = now + LTV_RESYNC_INTERVAL
        }

        if (now >= RESYNC_TIMES.BALANCE) {
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
          instance.collaterals = collaterals
          instance.debts = debts
          instance.syncRatio = 1

          RESYNC_TIMES.BALANCE = now + BALANCE_RESYNC_INTERVAL
        }
      } catch (error: any) {
        // TODO: Handle error cases such as rate limits
        console.warn(`Failed to load BorrowEngine for wallet '${wallet.id}': ${String(error)}`)
        console.error(error)
      } finally {
        // Loop delay
        await snooze(1000)
        // Restart loop
        await startNetworkSyncLoop()
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
      isRunning: false,
      syncRatio: 0,

      // Lifecycle
      async startEngine() {
        if (instance.isRunning) return
        instance.isRunning = true
        startNetworkSyncLoop().catch(err => showError(err)) // Shouldn't ever happen
      },
      async stopEngine() {
        instance.isRunning = false
      },

      // Modifications
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
              category: 'Expense:Service',
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
          nativeAmount,
          metadata: {
            name: 'AAVE',
            category: 'Transfer:Deposit',
            notes: `Deposit ${token.currencyCode} collateral`
          }
        })

        const actions = await makeTxCalls(txCallInfos)

        const mutateStateAction = makeSideEffectApprovableAction(async () => {
          adjustCollateral(tokenId, nativeAmount)
        })

        return composeApprovableActions(...actions, mutateStateAction)
      },
      async withdraw(request: WithdrawRequest): Promise<ApprovableAction> {
        const { nativeAmount, tokenId, toWallet = wallet } = request

        const collateral = instance.collaterals.find(collateral => collateral.tokenId === tokenId)
        if (collateral == null) throw new Error(`No collateral to withdraw for ${tokenId}`)

        if (lt(nativeAmount, '0')) throw new Error(`BorrowEngine: invalid withdraw request nativeAmount ${request.nativeAmount}.`)

        validateWalletParam(toWallet)

        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        const asset = tokenAddress
        // Anything above the current collateral amount will be automatically
        // converted to the MAX_AMOUNT in order to withdraw all collateral.
        const contractTokenAmount = BigNumber.from(gt(nativeAmount, collateral.nativeAmount) ? MAX_AMOUNT : request.nativeAmount)
        const to = (await toWallet.getReceiveAddress()).publicAddress

        const gasPrice = await aaveNetwork.provider.getGasPrice()

        const withdrawTx = asGracefulTxInfo(
          await aaveNetwork.lendingPool.populateTransaction.withdraw(asset, contractTokenAmount, to, { gasLimit: '800000', gasPrice })
        )

        // Cap the withdraw amount to the total collateral
        const amountWithdrawn = min(nativeAmount, collateral.nativeAmount)
        const withdrawAction = await makeApprovableCall({
          tx: withdrawTx,
          wallet,
          spendToken: token,
          nativeAmount: mul(amountWithdrawn, '-1'),
          metadata: {
            name: 'AAVE',
            category: 'Transfer:Withdraw',
            notes: `Withdraw ${token.currencyCode} collateral`
          }
        })

        const mutateStateAction = makeSideEffectApprovableAction(async () => {
          adjustCollateral(tokenId, mul('-1', amountWithdrawn))
        })

        return composeApprovableActions(withdrawAction, mutateStateAction)
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

        const borrowAction = await makeApprovableCall({
          tx: borrowTx,
          wallet,
          spendToken: token,
          nativeAmount: mul(nativeAmount, '-1'),
          metadata: {
            name: 'AAVE',
            category: 'Transfer:Borrow',
            notes: `Borrow ${token.displayName} loan`
          }
        })

        const mutateStateAction = makeSideEffectApprovableAction(async () => {
          adjustDebt(tokenId, nativeAmount)
        })

        return composeApprovableActions(borrowAction, mutateStateAction)
      },
      async repay(request: RepayRequest): Promise<ApprovableAction> {
        const { fromTokenId, tokenId, fromWallet = wallet } = request

        const debt = instance.debts.find(debt => debt.tokenId === tokenId)
        if (debt == null) throw new Error(`No debt to repay for ${tokenId}`)

        // Let the debt total be the upper boundary for nativeAmount
        const nativeAmount = min(request.nativeAmount, debt.nativeAmount)

        // nativeAmount can't be zero
        if (nativeAmount === '0') throw new Error('BorrowEngine: repay request contains no nativeAmount.')

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

        const amountToCover = BigNumber.from(nativeAmount)
        const gasPrice: BigNumberish = await aaveNetwork.provider.getGasPrice()
        const txCallInfos: CallInfo[] = []

        const actions: ApprovableAction[] = []

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
          const approveTx = await getApproveAllowanceTx(amountToSwap.toString(), fromAddress, paraSwapRepayAdapter.address, aCollateralContract, { gasPrice })
          if (approveTx != null) {
            txCallInfos.push({
              tx: approveTx,
              wallet,
              metadata: {
                name: 'AAVE',
                category: 'Expense:Service',
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
              gte(request.nativeAmount, debt.nativeAmount) ? 164 : 0, // buyAllBalanceOffset 164 = Augustus V5 buy. Function call to handle the slight interest accrued after the tx is broadcasted when closing the full principal
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
              category: 'Expense:Repay',
              notes: `AAVE repay ${debtToken.displayName} with ${collateralToken.displayName} collateral`
            }
          })

          actions.push(...(await makeTxCalls(txCallInfos)))

          const mutateStateAction = makeSideEffectApprovableAction(async () => {
            adjustCollateral(fromTokenId, mul('-1', priceRoute.srcAmount))
            adjustDebt(tokenId, mul('-1', nativeAmount))
          })
          actions.push(mutateStateAction)
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
                category: 'Expense:Service',
                notes: `AAVE contract approval`
              }
            })
          }

          const repayTx = asGracefulTxInfo(
            await aaveNetwork.lendingPool.populateTransaction.repay(debtTokenAddress, amountToCover, INTEREST_RATE_MODE, fromAddress, {
              gasLimit: '800000',
              gasPrice
            })
          )

          txCallInfos.push({
            tx: repayTx,
            wallet,
            spendToken: debtToken,
            nativeAmount,
            metadata: {
              name: 'AAVE',
              category: 'Expense:Repay',
              notes: `Repay ${debtToken.displayName} loan`
            }
          })

          actions.push(...(await makeTxCalls(txCallInfos)))

          const mutateStateAction = makeSideEffectApprovableAction(async () => {
            adjustDebt(tokenId, mul('-1', nativeAmount))
          })
          actions.push(mutateStateAction)
        }

        return composeApprovableActions(...actions)
      },

      // Utilities
      async getAprQuote(tokenId?: string): Promise<number> {
        const token = getToken(tokenId)
        const tokenAddress = getTokenAddress(token)

        if (tokenAddress == null) {
          throw new Error(`getAprQuote: AAVE requires a contract address, but tokenId '${tokenId ?? ''}' has none`)
        }

        const { variableApr } = await aaveNetwork.getReserveTokenAprRates(tokenAddress)

        return variableApr
      },
      async calculateProjectedLtv(request: CalculateLtvRequest): Promise<string> {
        const { collaterals: newCollaterals, debts: newDebts } = request

        const debts = newDebts.filter(a => !zeroString(a.nativeAmount))
        const collaterals = newCollaterals.filter(a => !zeroString(a.nativeAmount))

        // Collaterals will always be present, but debts might be empty
        if (collaterals.length > 0) {
          // Calculate the ETH value of the modified debts/collaterals using
          // AAVE's price oracle
          const calculateTotalLoanAssetETH = async (prev: Promise<string>, loanAsset: BorrowCollateral | BorrowDebt) =>
            add(await prev, await getLoanAssetETHValue(loanAsset))

          const totalCollateralETH = await collaterals.reduce(calculateTotalLoanAssetETH, Promise.resolve<string>('0'))
          const totalDebtETH = await debts.reduce(calculateTotalLoanAssetETH, Promise.resolve<string>('0'))

          // Recalculate LTV
          return zeroString(totalCollateralETH) ? '0' : div(totalDebtETH, totalCollateralETH, DECIMAL_PRECISION)
        } else {
          console.log('calculateProjectedLtv: No collaterals found')
          return '0'
        }
      }
    })

    // Return instance:
    return instance
  }
}

// -----------------------------------------------------------------------------
// Private Cleaners
// -----------------------------------------------------------------------------

const asGracefulTxInfo = asGraceful(asTxInfo, 'Invalid transaction response')
