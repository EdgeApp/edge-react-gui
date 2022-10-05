import { add } from 'biggystring'
import * as React from 'react'

import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram'
import { dryrunActionProgram } from '../../../controllers/action-queue/runtime'
import { makeLoanAccount } from '../../../controllers/loan-manager/LoanAccount'
import { createLoanAccount, runLoanActionProgram } from '../../../controllers/loan-manager/redux/actions'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import s from '../../../locales/strings'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { LoanAsset, makeAaveCreateAction } from '../../../util/ActionProgramUtils'
import { translateError } from '../../../util/translateError'
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

type Props = {
  navigation: NavigationProp<'loanCreateConfirmation'>
  route: RouteProp<'loanCreateConfirmation'>
}

export const LoanCreateConfirmationScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowPlugin, borrowEngine, destWallet, destTokenId, nativeDestAmount, nativeSrcAmount, paymentMethod, srcTokenId, srcWallet } = route.params
  const { currencyWallet: borrowEngineWallet } = borrowEngine

  const clientId = useSelector(state => state.core.context.clientId)
  const account = useSelector(state => state.core.account)

  const [loanAccount, loanAccountError] = useAsyncValue(async () => makeLoanAccount(borrowPlugin, borrowEngine.currencyWallet), [borrowPlugin, borrowEngine])

  const dispatch = useDispatch()

  const [[actionProgram, networkFeeAmountAggregate = '0'] = [], actionProgramError] = useAsyncValue(async () => {
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

    const actionOp = await makeAaveCreateAction({
      borrowEngineWallet,
      borrowPluginId,
      source,
      destination
    })

    const actionProgram = await makeActionProgram(actionOp)

    const actionProgramState = {
      clientId,
      programId: actionProgram.programId,
      effective: false,
      executing: false,
      lastExecutionTime: 0,
      nextExecutionTime: 0
    }

    const executionContext = { account, clientId }
    const executionOutputs = await dryrunActionProgram(executionContext, actionProgram, actionProgramState, false)

    // Map: currencyCode -> nativeAmount
    const networkFeeAmountMap: { [currencyCode: string]: string | undefined } = {}
    for (const output of executionOutputs ?? []) {
      for (const tx of output.broadcastTxs) {
        const { currencyCode, nativeAmount } = tx.networkFee
        const currentFeeAmount = networkFeeAmountMap[currencyCode] ?? '0'
        networkFeeAmountMap[currencyCode] = add(currentFeeAmount, nativeAmount)
      }
    }

    // TODO: Show fees for swaps and other transactions that aren't on the main loan account wallet
    const networkFeeAmountAggregate = networkFeeAmountMap[borrowEngineWallet.currencyInfo.currencyCode]

    return [actionProgram, networkFeeAmountAggregate] as const
  }, [destTokenId, nativeDestAmount, borrowEngine])

  const handleSliderComplete = async (resetSlider: () => void) => {
    if (actionProgram != null && loanAccount != null) {
      try {
        await dispatch(createLoanAccount(loanAccount))
        await dispatch(runLoanActionProgram(loanAccount, actionProgram, 'loan-create'))
        navigation.navigate('loanCreateStatus', { actionQueueId: actionProgram.programId })
      } catch (e: any) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  }

  if (loanAccountError != null) return <Alert title={s.strings.error_unexpected_title} type="error" message={translateError(loanAccountError)} />

  return loanAccount == null ? (
    <SceneWrapper background="theme">
      <FillLoader />
    </SceneWrapper>
  ) : (
    <FormScene headerText={s.strings.loan_create_confirmation_title} sliderDisabled={actionProgram == null} onSliderComplete={handleSliderComplete}>
      <Tile type="static" title={s.strings.loan_amount_borrow}>
        <EdgeText>
          <FiatText appendFiatCurrencyCode autoPrecision hideFiatSymbol nativeCryptoAmount={nativeDestAmount} tokenId={destTokenId} wallet={destWallet} />
        </EdgeText>
      </Tile>
      <Tile type="static" title={s.strings.loan_collateral_amount}>
        <CryptoFiatAmountRow nativeAmount={nativeSrcAmount} tokenId={srcTokenId} wallet={srcWallet} marginRem={[0.25, 0, 0, 0]} />
      </Tile>

      <Tile type="static" title={s.strings.loan_collateral_source}>
        <CurrencyRow tokenId={srcTokenId} wallet={srcWallet} marginRem={0} />
      </Tile>

      <Tile type="static" title={s.strings.loan_debt_destination}>
        {paymentMethod != null ? (
          <PaymentMethodRow paymentMethod={paymentMethod} pluginId="wyre" marginRem={0} />
        ) : (
          <CurrencyRow tokenId={destTokenId} wallet={destWallet} marginRem={0} />
        )}
      </Tile>
      {actionProgramError != null ? <ErrorTile message={actionProgramError.message} /> : null}
      <NetworkFeeTile wallet={borrowEngineWallet} nativeAmount={networkFeeAmountAggregate} />
    </FormScene>
  )
}
