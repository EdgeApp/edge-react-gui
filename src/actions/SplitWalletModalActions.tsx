import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { getWalletName } from '../util/CurrencyWalletHelpers'

export function showSplitWalletModal(walletId: string, currencyCode: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyConfig, currencyWallets } = account
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

    if (resolveValue === 'confirm') {
      const pluginId = Object.keys(currencyConfig).find(pluginId => currencyConfig[pluginId].currencyInfo.currencyCode === currencyCode)
      if (pluginId == null) return
      const { walletType } = currencyConfig[pluginId].currencyInfo

      try {
        await account.splitWalletInfo(walletId, walletType)
      } catch (error: any) {
        showError(error)
      }
    }
  }
}
