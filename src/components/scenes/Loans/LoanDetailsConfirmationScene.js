// @flow

import { add } from 'biggystring'
import * as React from 'react'

import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { type ApprovableAction } from '../../../plugins/borrow-plugins/types'
import { useMemo, useState } from '../../../types/reactHooks'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents'
import { CurrencyRow } from '../../data/row/CurrencyRow'
import { showError } from '../../services/AirshipInstance'
import { EdgeText } from '../../themed/EdgeText'
import { Tile } from '../../tiles/Tile'
import { FormScene } from '../FormScene'

type Props = {
  navigation: NavigationProp<'loanDetailsConfirmation'>,
  route: RouteProp<'loanDetailsConfirmation'>
}

export const LoanDetailsConfirmationScene = (props: Props) => {
  const { navigation, route } = props

  // TODO: Calculate borrowAmountFiat from nativeBorrowAmount, specify crypto/fiat in var names
  const { borrowAmountFiat, borrowEngine, destWallet, destTokenId, nativeBorrowAmount, nativeCollateralAmount, srcTokenId } = route.params
  const { currencyWallet: srcWallet } = borrowEngine

  console.log(
    '\x1b[30m\x1b[42m' +
      `{ borrowAmountFiat, borrowEngine, destWallet, destTokenId, nativeBorrowAmount, nativeCollateralAmount, srcTokenId }: ${JSON.stringify(
        { borrowAmountFiat, destTokenId, nativeBorrowAmount, nativeCollateralAmount, srcTokenId },
        null,
        2
      )}` +
      '\x1b[0m'
  )
  // Borrow engine stuff
  const [depositApprovalAction, setDepositApprovalAction] = useState<ApprovableAction | null>(null)
  const [borrowApprovalAction, setBorrowApprovalAction] = useState<ApprovableAction | null>(null)

  useAsyncEffect(async () => {
    const borrowRequest = {
      tokenId: destTokenId,
      nativeAmount: nativeBorrowAmount,
      fromWallet: srcWallet
    }

    const depositRequest = {
      tokenId: srcTokenId,
      nativeAmount: nativeCollateralAmount,
      fromWallet: srcWallet
    }

    // // TODO: multiple deposit/borrow steps
    // const approvalAction = await depositAndBorrow

    setDepositApprovalAction(await borrowEngine.deposit(depositRequest))
    setBorrowApprovalAction(await borrowEngine.borrow(borrowRequest))
  }, [destTokenId, nativeBorrowAmount, borrowEngine])

  const renderFeeTile = useMemo(() => {
    if (depositApprovalAction == null || borrowApprovalAction == null) return
    return <NetworkFeeTile wallet={srcWallet} nativeAmount={add(depositApprovalAction.networkFee.nativeAmount, borrowApprovalAction.networkFee.nativeAmount)} />
  }, [borrowApprovalAction, depositApprovalAction, srcWallet])

  const onSliderComplete = async (resetSlider: () => void) => {
    if (depositApprovalAction != null && borrowApprovalAction != null) {
      try {
        await depositApprovalAction.approve()
        await borrowApprovalAction.approve()
        navigation.pop()
      } catch (e) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  }

  return (
    <FormScene headerText="" sliderDisabled={false} onSliderComplete={onSliderComplete}>
      <Tile type="static" title="Amount to Borrow">
        <EdgeText>{borrowAmountFiat}</EdgeText>
      </Tile>

      <Tile type="static" title="Source Wallet">
        <CurrencyRow tokenId={srcTokenId} wallet={srcWallet} />
      </Tile>

      <Tile type="static" title="Fund Destination">
        <CurrencyRow tokenId={destTokenId} wallet={destWallet} />
      </Tile>

      {renderFeeTile}
    </FormScene>
  )
}
