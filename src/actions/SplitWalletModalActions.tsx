import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { Dispatch, GetState } from '../types/reduxTypes'
import { getWalletName } from '../util/CurrencyWalletHelpers'

export const showSplitWalletModal = (walletId: string, currencyCode: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { currencyWallets } = account
  const edgeWallet = currencyWallets[walletId]

  let bodyText = s.strings.fragment_wallets_split_wallet_first_confirm_message_mobile
  if (edgeWallet.currencyInfo.currencyCode === 'BCH') {
    bodyText = s.strings.fragment_wallets_split_wallet_bch_to_bsv
  }

  const resolveValue = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
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
      dispatch({
        type: 'UI/WALLETS/UPSERT_WALLETS',
        data: { wallets: [edgeWallet] }
      })
    } catch (error: any) {
      showError(error)
    }
  }
}
