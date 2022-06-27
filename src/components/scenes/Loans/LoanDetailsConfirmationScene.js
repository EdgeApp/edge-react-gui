// @flow

import { add } from 'biggystring'
import * as React from 'react'

import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import s from '../../../locales/strings'
import { type ApprovableAction } from '../../../plugins/borrow-plugins/types'
import { useMemo, useState } from '../../../types/reactHooks'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents'
import { CurrencyRow } from '../../data/row/CurrencyRow'
import { showError } from '../../services/AirshipInstance'
import { FiatText } from '../../text/FiatText'
import { EdgeText } from '../../themed/EdgeText'
import { Tile } from '../../tiles/Tile'
import { FormScene } from '../FormScene'

type Props = {
  navigation: NavigationProp<'loanDetailsConfirmation'>,
  route: RouteProp<'loanDetailsConfirmation'>
}

export const LoanDetailsConfirmationScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, destWallet, destTokenId, nativeDestAmount, nativeSrcAmount, srcTokenId } = route.params
  const { currencyWallet: srcWallet } = borrowEngine

  // Setup Borrow Engine transaction requests/actions
  const [depositApprovalAction, setDepositApprovalAction] = useState<ApprovableAction | null>(null)
  const [borrowApprovalAction, setBorrowApprovalAction] = useState<ApprovableAction | null>(null)

  useAsyncEffect(async () => {
    const borrowRequest = {
      tokenId: destTokenId,
      nativeAmount: nativeDestAmount,
      fromWallet: srcWallet
    }

    const depositRequest = {
      tokenId: srcTokenId,
      nativeAmount: nativeSrcAmount,
      fromWallet: srcWallet
    }

    setDepositApprovalAction(await borrowEngine.deposit(depositRequest))
    setBorrowApprovalAction(await borrowEngine.borrow(borrowRequest))
  }, [destTokenId, nativeDestAmount, borrowEngine])

  const renderFeeTile = useMemo(() => {
    if (depositApprovalAction == null || borrowApprovalAction == null) return
    return <NetworkFeeTile wallet={srcWallet} nativeAmount={add(depositApprovalAction.networkFee.nativeAmount, borrowApprovalAction.networkFee.nativeAmount)} />
  }, [borrowApprovalAction, depositApprovalAction, srcWallet])

  const onSliderComplete = async (resetSlider: () => void) => {
    if (depositApprovalAction != null && borrowApprovalAction != null) {
      try {
        await depositApprovalAction.approve()
        await borrowApprovalAction.approve()

        // TODO: In the current implementation, the user is redirected to the start of the loan workflow with no visual feedback that a new loan is pending.
        // Design consideration for post-ActionQueue: Show the AQ status/step in the card
        navigation.navigate('loanDashboard')
      } catch (e) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  }

  return (
    <FormScene headerText={s.strings.loan_details_conf_title} sliderDisabled={false} onSliderComplete={onSliderComplete}>
      <Tile type="static" title={s.strings.loan_details_conf_amount_borrow}>
        <EdgeText>
          <FiatText appendFiatCurrencyCode autoPrecision hideFiatSymbol nativeCryptoAmount={nativeDestAmount} tokenId={destTokenId} wallet={destWallet} />
        </EdgeText>
      </Tile>

      <Tile type="static" title={s.strings.loan_details_collateral_source}>
        <CurrencyRow tokenId={srcTokenId} wallet={srcWallet} />
      </Tile>

      <Tile type="static" title={s.strings.loan_details_destination}>
        <CurrencyRow tokenId={destTokenId} wallet={destWallet} />
      </Tile>

      {renderFeeTile}
    </FormScene>
  )
}
