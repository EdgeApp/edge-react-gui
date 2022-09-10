import { add } from 'biggystring'
import * as React from 'react'

import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram'
import { ActionProgram } from '../../../controllers/action-queue/types'
import { makeLoanAccount } from '../../../controllers/loan-manager/LoanAccount'
import { createLoanAccount, runLoanActionProgram } from '../../../controllers/loan-manager/redux/actions'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import s from '../../../locales/strings'
import { ApprovableAction } from '../../../plugins/borrow-plugins/types'
import { useMemo, useState } from '../../../types/reactHooks'
import { useDispatch } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { makeAaveBorrowAction, makeAaveDepositAction } from '../../../util/ActionProgramUtils'
import { translateError } from '../../../util/translateError'
import { NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { CurrencyRow } from '../../data/row/CurrencyRow'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { showError } from '../../services/AirshipInstance'
import { FiatText } from '../../text/FiatText'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { Tile } from '../../tiles/Tile'
import { FormScene } from '../FormScene'

type Props = {
  navigation: NavigationProp<'loanCreateConfirmation'>,
  route: RouteProp<'loanCreateConfirmation'>
}

export const LoanCreateConfirmationScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowPlugin, borrowEngine, destWallet, destTokenId, isDestBank, nativeDestAmount, nativeSrcAmount, srcTokenId, srcWallet } = route.params
  const { currencyWallet: borrowEngineWallet } = borrowEngine

  const [loanAccount, loanAccountError] = useAsyncValue(() => makeLoanAccount(borrowPlugin, borrowEngine.currencyWallet), [borrowPlugin, borrowEngine])

  // Setup Borrow Engine transaction requests/actions
  const [depositApprovalAction, setDepositApprovalAction] = useState<ApprovableAction | null>(null)
  const [borrowApprovalAction, setBorrowApprovalAction] = useState<ApprovableAction | null>(null)

  const dispatch = useDispatch()
  const [actionProgram, setActionProgram] = useState<ActionProgram | undefined>(undefined)
  useAsyncEffect(async () => {
    // TODO: These default tokens will be removed when fee calculations are done using dryruns instead of ApprovableActions
    const allTokens = borrowEngineWallet.currencyConfig.allTokens
    const defaultSrcTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === 'WBTC')
    const defaultDestTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === 'USDC')

    const depositRequest = {
      tokenId: srcTokenId ?? defaultSrcTokenId,
      nativeAmount: nativeSrcAmount,
      fromWallet: borrowEngineWallet,
      skipChecks: true
    }

    const borrowRequest = {
      tokenId: destTokenId ?? defaultDestTokenId,
      nativeAmount: nativeDestAmount,
      fromWallet: borrowEngineWallet,
      skipChecks: true
    }

    const borrowPluginId = borrowPlugin.borrowInfo.borrowPluginId

    const actionOps = {
      type: 'seq',
      actions: (
        await Promise.all([
          makeAaveDepositAction({
            borrowEngineWallet: borrowEngineWallet,
            borrowPluginId,
            depositTokenId: srcTokenId,
            nativeAmount: nativeSrcAmount,
            srcTokenId,
            srcWallet
          }),
          makeAaveBorrowAction({
            borrowPluginId,
            // @ts-expect-error
            tokenId: destTokenId,
            nativeAmount: nativeDestAmount,
            borrowEngineWallet: borrowEngineWallet,
            isDestBank
          })
        ])
      ).reduce((accum, subActions) => accum.concat(subActions), [])
    }

    const actionProgram = await makeActionProgram(actionOps)
    setActionProgram(actionProgram)

    setDepositApprovalAction(await borrowEngine.deposit(depositRequest))
    setBorrowApprovalAction(await borrowEngine.borrow(borrowRequest))
  }, [destTokenId, nativeDestAmount, borrowEngine])

  const renderFeeTile = useMemo(() => {
    return (
      <NetworkFeeTile
        wallet={borrowEngineWallet}
        nativeAmount={
          depositApprovalAction == null || borrowApprovalAction == null
            ? '0'
            : add(depositApprovalAction.networkFee.nativeAmount, borrowApprovalAction.networkFee.nativeAmount)
        }
      />
    )
  }, [borrowApprovalAction, depositApprovalAction, borrowEngineWallet])

  const onSliderComplete = async (resetSlider: () => void) => {
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
    <FormScene headerText={s.strings.loan_create_confirmation_title} sliderDisabled={false} onSliderComplete={onSliderComplete}>
      <Tile type="static" title={s.strings.loan_amount_borrow}>
        <EdgeText>
          {/* @ts-expect-error */}
          <FiatText appendFiatCurrencyCode autoPrecision hideFiatSymbol nativeCryptoAmount={nativeDestAmount} tokenId={destTokenId} wallet={destWallet} />
        </EdgeText>
      </Tile>
      <Tile type="static" title={s.strings.loan_collateral_amount}>
        <CryptoFiatAmountRow nativeAmount={nativeSrcAmount} tokenId={srcTokenId} wallet={srcWallet} marginRem={[0.25, 0, 0, 0]} />
      </Tile>

      <Tile type="static" title={s.strings.loan_collateral_source}>
        <CurrencyRow tokenId={srcTokenId} wallet={srcWallet} marginRem={0} />
      </Tile>

      <Tile type="static" title={s.strings.loan_destination}>
        <CurrencyRow tokenId={destTokenId} wallet={destWallet} marginRem={0} />
      </Tile>

      {renderFeeTile}
    </FormScene>
  )
}
