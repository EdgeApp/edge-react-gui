// @flow

import { add } from 'biggystring'
import * as React from 'react'

import { useRunningActionQueueId } from '../../../controllers/action-queue/ActionQueueStore'
import { scheduleActionProgram } from '../../../controllers/action-queue/redux/actions'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import s from '../../../locales/strings'
import { type ApprovableAction } from '../../../plugins/borrow-plugins/types'
import { useMemo, useState } from '../../../types/reactHooks'
import { useDispatch } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { makeAaveBorrowAction, makeAaveDepositAction, makeActionProgram } from '../../../util/ActionProgramUtils'
import { NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents'
import { CurrencyRow } from '../../data/row/CurrencyRow'
import { showError } from '../../services/AirshipInstance'
import { FiatText } from '../../text/FiatText'
import { EdgeText } from '../../themed/EdgeText'
import { Tile } from '../../tiles/Tile'
import { FormScene } from '../FormScene'

type Props = {
  navigation: NavigationProp<'loanCreateConfirmation'>,
  route: RouteProp<'loanCreateConfirmation'>
}

export const LoanCreateConfirmationScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowPlugin, borrowEngine, destWallet, destTokenId, nativeDestAmount, nativeSrcAmount, srcTokenId, srcWallet } = route.params
  const { currencyWallet: borrowEngineWallet } = borrowEngine

  // Skip directly to LoanStatusScene if an action for the same actionOpType is already being processed
  const existingProgramId = useRunningActionQueueId('loan-create', borrowEngineWallet.id)
  if (existingProgramId != null) navigation.navigate('loanStatus', { actionQueueId: existingProgramId })

  // Setup Borrow Engine transaction requests/actions
  const [depositApprovalAction, setDepositApprovalAction] = useState<ApprovableAction | null>(null)
  const [borrowApprovalAction, setBorrowApprovalAction] = useState<ApprovableAction | null>(null)

  const dispatch = useDispatch()
  const [actionProgram, setActionProgram] = useState()
  useAsyncEffect(async () => {
    // TODO: These default tokens will be removed when fee calculations are done using dryruns instead of ApprovableActions
    const allTokens = borrowEngineWallet.currencyConfig.allTokens
    const defaultSrcTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === 'WBTC')
    const defaultDestTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === 'USDC')

    const depositRequest = {
      tokenId: srcTokenId ?? defaultSrcTokenId,
      nativeAmount: nativeSrcAmount,
      fromWallet: borrowEngineWallet
    }

    const borrowRequest = {
      tokenId: destTokenId ?? defaultDestTokenId,
      nativeAmount: nativeDestAmount,
      fromWallet: borrowEngineWallet
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
            tokenId: destTokenId,
            nativeAmount: nativeDestAmount,
            borrowEngineWallet: borrowEngineWallet
          })
        ])
      ).reduce((accum, subActions) => accum.concat(subActions), [])
    }

    const actionProgram = await makeActionProgram(actionOps, 'loan-create')
    setActionProgram(actionProgram)

    setDepositApprovalAction(await borrowEngine.deposit(depositRequest))
    setBorrowApprovalAction(await borrowEngine.borrow(borrowRequest))
  }, [destTokenId, nativeDestAmount, borrowEngine])

  const renderFeeTile = useMemo(() => {
    if (depositApprovalAction == null || borrowApprovalAction == null) return
    return <NetworkFeeTile wallet={srcWallet} nativeAmount={add(depositApprovalAction.networkFee.nativeAmount, borrowApprovalAction.networkFee.nativeAmount)} />
  }, [borrowApprovalAction, depositApprovalAction, srcWallet])

  const onSliderComplete = async (resetSlider: () => void) => {
    if (actionProgram != null) {
      try {
        await dispatch(scheduleActionProgram(actionProgram))
        navigation.navigate('loanStatus', { actionQueueId: actionProgram.programId })
      } catch (e) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  }

  return (
    <FormScene headerText={s.strings.loan_create_confirmation_title} sliderDisabled={false} onSliderComplete={onSliderComplete}>
      <Tile type="static" title={s.strings.loan_amount_borrow}>
        <EdgeText>
          <FiatText appendFiatCurrencyCode autoPrecision hideFiatSymbol nativeCryptoAmount={nativeDestAmount} tokenId={destTokenId} wallet={destWallet} />
        </EdgeText>
      </Tile>

      <Tile type="static" title={s.strings.loan_collateral_source}>
        <CurrencyRow tokenId={srcTokenId} wallet={srcWallet} />
      </Tile>

      <Tile type="static" title={s.strings.loan_destination}>
        <CurrencyRow tokenId={destTokenId} wallet={destWallet} />
      </Tile>

      {renderFeeTile}
    </FormScene>
  )
}
