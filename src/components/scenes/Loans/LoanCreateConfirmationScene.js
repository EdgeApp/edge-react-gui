// @flow

import { add } from 'biggystring'
import * as React from 'react'

import { scheduleActionProgram } from '../../../controllers/action-queue/redux/actions'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import s from '../../../locales/strings'
import { makeActionProgram } from '../../../plugins/action-queue'
import { type ApprovableAction } from '../../../plugins/borrow-plugins/types'
import { useMemo, useState } from '../../../types/reactHooks'
import { useDispatch } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
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
  const { borrowPlugin, borrowEngine, destWallet, destTokenId, nativeDestAmount, nativeSrcAmount, srcTokenId } = route.params
  const { currencyWallet: srcWallet } = borrowEngine

  // Setup Borrow Engine transaction requests/actions
  const [depositApprovalAction, setDepositApprovalAction] = useState<ApprovableAction | null>(null)
  const [borrowApprovalAction, setBorrowApprovalAction] = useState<ApprovableAction | null>(null)

  const dispatch = useDispatch()
  const [actionProgram, setActionProgram] = useState()
  useAsyncEffect(async () => {
    const depositRequest = {
      tokenId: srcTokenId,
      nativeAmount: nativeSrcAmount,
      fromWallet: srcWallet
    }

    const borrowRequest = {
      tokenId: destTokenId,
      nativeAmount: nativeDestAmount,
      fromWallet: srcWallet
    }

    const borrowPluginId = borrowPlugin.borrowInfo.pluginId
    const actionOps = {
      type: 'seq',
      actions: [
        // $FlowFixMe
        {
          type: 'loan-deposit',
          borrowPluginId,
          nativeAmount: nativeSrcAmount,
          walletId: srcWallet.id,
          tokenId: srcTokenId
        },
        // $FlowFixMe
        {
          type: 'loan-borrow',
          borrowPluginId,
          nativeAmount: nativeDestAmount,
          walletId: srcWallet.id,
          tokenId: destTokenId
        }
      ]
    }

    const actionProgram = await makeActionProgram(actionOps)
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
        actionProgram.programId = 'loan-create' + '_' + Date.now()
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
