import { add, div, gt, max, mul, sub } from 'biggystring'
import * as React from 'react'

import { dryrunActionProgram } from '../../../controllers/action-queue/runtime/dryrunActionProgram'
import { ActionOp, SwapActionOp } from '../../../controllers/action-queue/types'
import { makeInitialProgramState } from '../../../controllers/action-queue/util/makeInitialProgramState'
import { makeLoanAccount } from '../../../controllers/loan-manager/LoanAccount'
import { runLoanActionProgram, saveLoanAccount } from '../../../controllers/loan-manager/redux/actions'
import { selectLoanAccount } from '../../../controllers/loan-manager/redux/selectors'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useExecutionContext } from '../../../hooks/useExecutionContext'
import { useTokenDisplayData } from '../../../hooks/useTokenDisplayData'
import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { lstrings } from '../../../locales/strings'
import { convertCurrency } from '../../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { LoanAsset, makeAaveCreateActionProgram } from '../../../util/ActionProgramUtils'
import { getExecutionNetworkFees } from '../../../util/networkFeeUtils'
import { translateError } from '../../../util/translateError'
import { DECIMAL_PRECISION, truncateDecimals } from '../../../util/utils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { CurrencyRow } from '../../data/row/CurrencyRow'
import { PaymentMethodRow } from '../../data/row/PaymentMethodRow'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { showError } from '../../services/AirshipInstance'
import { FiatText } from '../../text/FiatText'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { ErrorTile } from '../../tiles/ErrorTile'
import { NetworkFeeTile } from '../../tiles/NetworkFeeTile'
import { Tile } from '../../tiles/Tile'
import { FormScene } from '../FormScene'

const FEE_VOLATILITY_MULTIPLIER: { [network: string]: string } = {
  ethereum: '2',
  polygon: '1.5'
}

interface Props extends EdgeSceneProps<'loanCreateConfirmation'> {}

export const LoanCreateConfirmationScene = (props: Props) => {
  const dispatch = useDispatch()

  const { navigation, route } = props
  const { borrowPlugin, borrowEngine, destWallet, destTokenId, nativeDestAmount, nativeSrcAmount, paymentMethod, srcTokenId, srcWallet } = route.params
  const { currencyWallet: borrowEngineWallet } = borrowEngine
  const { currencyCode: borrowEngineCurrencyCode } = borrowEngineWallet.currencyInfo

  const clientId = useSelector(state => state.core.context.clientId)
  const executionContext = useExecutionContext()
  const borrowWalletNativeBalance = useWalletBalance(borrowEngineWallet)
  const isCrossChainSrc = srcWallet.id !== borrowEngineWallet.id

  const existingLoanAccount = useSelector(state => selectLoanAccount(state, borrowEngineWallet.id))
  const [loanAccount, loanAccountError] = useAsyncValue(
    async () => existingLoanAccount ?? (await makeLoanAccount(borrowPlugin, borrowEngine.currencyWallet)),
    [borrowPlugin, borrowEngine]
  )

  // HACK: Special handling to satisfy minimum swap amounts for MATIC fees.
  // TODO: Extend to dynamically grab minimums from providers for fee and collateral quotes
  const borrowPluginCurrencyPluginId = borrowPlugin.borrowInfo.currencyPluginId
  const minFeeSwapAmount = useSelector(state => {
    return borrowPluginCurrencyPluginId === 'polygon' && isCrossChainSrc
      ? truncateDecimals(mul('5.05', convertCurrency(state, 'iso:USD', 'MATIC', destWallet.currencyInfo.denominations[0].multiplier)), 0)
      : '0'
  })

  const [[actionProgram, networkFeeMap = {}] = [], actionProgramError] = useAsyncValue(async () => {
    const borrowPluginId = borrowPlugin.borrowInfo.borrowPluginId
    const source: LoanAsset = {
      wallet: srcWallet,
      nativeAmount: nativeSrcAmount,
      ...(srcTokenId != null ? { tokenId: srcTokenId } : {})
    }

    const destination: LoanAsset = {
      wallet: destWallet,
      tokenId: destTokenId,
      nativeAmount: nativeDestAmount,
      ...(paymentMethod != null ? { paymentMethodId: paymentMethod.id } : {}),
      ...(destTokenId != null ? { tokenId: destTokenId } : {})
    }
    const actionProgram = await makeAaveCreateActionProgram({
      borrowEngineWallet,
      borrowPluginId,
      source,
      destination
    })

    const executionOutputs = await dryrunActionProgram(executionContext, actionProgram, makeInitialProgramState(clientId, actionProgram.programId), false)

    const networkFeeMap = getExecutionNetworkFees(executionOutputs)

    const mainNetworkFee = networkFeeMap[borrowEngineCurrencyCode]
    const mainNetworkFeeAmount = mainNetworkFee != null ? mul(mainNetworkFee.nativeAmount, FEE_VOLATILITY_MULTIPLIER[borrowPluginCurrencyPluginId]) : '0'

    // Add an extra swap for BorrowEngine mainnet native currency to cover transaction fees.
    const seq = actionProgram.actionOp.type === 'seq' ? actionProgram.actionOp : null
    if (
      isCrossChainSrc && // Source of funds is not the same wallet as the "main-chain wallet"
      mainNetworkFeeAmount != null && // Fees must exist in BorrowEngine's native currency
      gt(mainNetworkFeeAmount, borrowWalletNativeBalance) && // BorrowEngine wallet does not have enough balance to cover required fees
      seq != null // type assertion
    ) {
      // Collect all initial swap actions (if any)
      const swapActions: SwapActionOp[] = []
      for (const action of seq.actions) {
        if (action.type !== 'swap') {
          break
        }
        swapActions.push(action)
      }
      // Get the rest of the actions which are not swap actions
      const otherActions: ActionOp[] = seq.actions.slice(swapActions.length)

      // Target mainnet native balance should be double the fees estimate to be
      // extra generous when accounting for fee volatility.
      const feeDeficitNativeAmount = sub(mainNetworkFeeAmount, borrowWalletNativeBalance)
      const feeNativeAmount = max(minFeeSwapAmount, feeDeficitNativeAmount)

      // Create a new fee swap action for mainnet fees
      const feesSwap: SwapActionOp = {
        type: 'swap',
        fromWalletId: srcWallet.id,
        fromTokenId: srcTokenId,
        toWalletId: borrowEngineWallet.id,
        nativeAmount: feeNativeAmount,
        expectedPayoutNativeAmount: feeDeficitNativeAmount,
        amountFor: 'to'
      }
      // Include new fee swap action in swapActions
      swapActions.push(feesSwap)

      // Redefine actions in sequence
      seq.actions = [
        {
          type: 'par',
          actions: swapActions,
          displayKey: 'swap-deposit-fees'
        },
        ...otherActions
      ]
    }

    return [actionProgram, networkFeeMap] as const
  }, [destTokenId, nativeDestAmount, borrowEngine, borrowWalletNativeBalance, minFeeSwapAmount])

  // TODO: Pass networkFeeMap to a component which can display aggregated fee total for NetworkFeeMap interfaces
  const networkFee = networkFeeMap[borrowEngineCurrencyCode]
  let networkFeeAmount = networkFee != null ? mul(networkFee.nativeAmount, FEE_VOLATILITY_MULTIPLIER[borrowPluginCurrencyPluginId]) : '0'

  // If we need to swap to cover fees, factor in the minimum swap amount for the fee display
  networkFeeAmount = isCrossChainSrc && gt(networkFeeAmount, borrowWalletNativeBalance) ? max(minFeeSwapAmount, networkFeeAmount) : networkFeeAmount

  const handleSliderComplete = async (resetSlider: () => void) => {
    if (actionProgram != null && loanAccount != null) {
      try {
        // Make sure to start the borrow engine
        if (!loanAccount.borrowEngine.isRunning) await loanAccount.borrowEngine.startEngine()

        await dispatch(saveLoanAccount(loanAccount))
        await dispatch(runLoanActionProgram(loanAccount, actionProgram, 'loan-create'))

        navigation.navigate('loanDashboard', {})
        navigation.navigate('loanDetails', { loanAccountId: loanAccount.id })

        // Further route to LoanStatusScene only if Action Program contains multiple ops
        const seq = actionProgram.actionOp.type === 'seq' ? actionProgram.actionOp : null
        if (seq != null && seq.actions.length > 1) {
          navigation.navigate('loanStatus', { actionQueueId: actionProgram.programId, loanAccountId: loanAccount.id })
        }
      } catch (e: any) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  }

  // HACK: Interim solution before implementing a robust multi-asset fee aggregator for Action Programs
  const {
    currencyCode: srcCurrencyCode,
    denomination: srcDenom,
    isoFiatCurrencyCode: srcIsoFiatCurrencyCode
  } = useTokenDisplayData({
    tokenId: srcTokenId,
    wallet: srcWallet
  })
  const {
    currencyCode: feeCurrencyCode,
    denomination: feeDenom,
    isoFiatCurrencyCode: feeIsoFiatCurrencyCode
  } = useTokenDisplayData({
    tokenId: borrowEngineCurrencyCode,
    wallet: borrowEngineWallet
  })
  const srcWalletBalance = useWalletBalance(srcWallet, srcTokenId)
  const srcBalanceFiatAmount = useSelector(state => {
    const cryptoAmount = div(srcWalletBalance, srcDenom.multiplier, DECIMAL_PRECISION)
    return convertCurrency(state, srcCurrencyCode, srcIsoFiatCurrencyCode, cryptoAmount)
  })
  const swapFiatAmount = useSelector(state => {
    const cryptoAmount = div(nativeSrcAmount, srcDenom.multiplier, DECIMAL_PRECISION)
    return convertCurrency(state, srcCurrencyCode, srcIsoFiatCurrencyCode, cryptoAmount)
  })
  const feeFiatAmount = useSelector(state => {
    const cryptoAmount = div(networkFeeAmount, feeDenom.multiplier, DECIMAL_PRECISION)
    return convertCurrency(state, feeCurrencyCode, feeIsoFiatCurrencyCode, cryptoAmount)
  })
  const isFeesExceedCollateral = isCrossChainSrc
    ? gt(add(swapFiatAmount, feeFiatAmount), srcBalanceFiatAmount)
    : gt(networkFeeAmount, borrowWalletNativeBalance)

  if (loanAccountError != null) return <Alert title={lstrings.error_unexpected_title} type="error" message={translateError(loanAccountError)} />

  return loanAccount == null ? (
    <SceneWrapper background="theme">
      <FillLoader />
    </SceneWrapper>
  ) : (
    <FormScene
      headerText={lstrings.loan_create_confirmation_title}
      sliderDisabled={actionProgram == null || isFeesExceedCollateral}
      onSliderComplete={handleSliderComplete}
    >
      <Tile type="static" title={lstrings.loan_amount_borrow}>
        <EdgeText>
          <FiatText appendFiatCurrencyCode autoPrecision hideFiatSymbol nativeCryptoAmount={nativeDestAmount} tokenId={destTokenId} wallet={destWallet} />
        </EdgeText>
      </Tile>
      <Tile type="static" title={lstrings.loan_collateral_amount}>
        <CryptoFiatAmountRow nativeAmount={nativeSrcAmount} tokenId={srcTokenId} wallet={srcWallet} marginRem={[0.25, 0, 0, 0]} />
      </Tile>

      <Tile type="static" title={lstrings.loan_collateral_source}>
        <CurrencyRow tokenId={srcTokenId} wallet={srcWallet} marginRem={0} />
      </Tile>

      <Tile type="static" title={lstrings.loan_debt_destination}>
        {paymentMethod != null ? (
          <PaymentMethodRow paymentMethod={paymentMethod} pluginId="wyre" marginRem={0} />
        ) : (
          <CurrencyRow tokenId={destTokenId} wallet={destWallet} marginRem={0} />
        )}
      </Tile>
      {actionProgramError != null ? <ErrorTile message={actionProgramError.message} /> : null}
      <NetworkFeeTile wallet={borrowEngineWallet} nativeAmount={networkFeeAmount} />
      {isFeesExceedCollateral ? <ErrorTile message={lstrings.loan_amount_fees_exceeds_collateral} /> : null}
    </FormScene>
  )
}
