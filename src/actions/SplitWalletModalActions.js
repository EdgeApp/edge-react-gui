// @flow

import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship, showError } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { getWalletName } from '../util/CurrencyWalletHelpers.js'
import { refreshWallet } from './WalletActions.js'

export const showSplitWalletModal = (walletId: string, currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { currencyWallets } = account
  const edgeWallet = currencyWallets[walletId]

  let bodyText = s.strings.fragment_wallets_split_wallet_first_confirm_message_mobile
  if (edgeWallet.currencyInfo.currencyCode === 'BCH') {
    bodyText = s.strings.fragment_wallets_split_wallet_bch_to_bsv
  }

  const resolveValue = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.fragment_wallets_split_wallet}
      message={`${bodyText} ${getWalletName(edgeWallet)}?`}
      buttons={{
        confirm: { label: s.strings.string_split },
        cancel: { label: s.strings.string_cancel_cap }
      }}
    />
  ))

  const { allCurrencyInfos } = state.ui.settings.plugins
  const newCurrencyInfo = allCurrencyInfos.find(info => info.currencyCode === currencyCode)
  if (newCurrencyInfo == null) return
  const newWalletType = newCurrencyInfo.walletType

  if (resolveValue === 'confirm') {
    try {
      await account.splitWalletInfo(walletId, newWalletType)
      dispatch(refreshWallet(walletId))
    } catch (error) {
      showError(error)
    }
  }
}
