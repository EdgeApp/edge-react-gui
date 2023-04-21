import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { getWalletName } from '../util/CurrencyWalletHelpers'

export function showSplitWalletModal(walletId: string, pluginId: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyConfig, currencyWallets } = account
    const edgeWallet = currencyWallets[walletId]

    let bodyText = lstrings.fragment_wallets_split_wallet_first_confirm_message_mobile
    if (edgeWallet.currencyInfo.currencyCode === 'BCH') {
      bodyText = lstrings.fragment_wallets_split_wallet_bch_to_bsv
    }

    const resolveValue = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.fragment_wallets_split_wallet}
        message={`${bodyText} ${getWalletName(edgeWallet)}?`}
        buttons={{
          confirm: { label: lstrings.string_split },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      />
    ))

    if (resolveValue === 'confirm') {
      const walletType = currencyConfig[pluginId]?.currencyInfo.walletType
      if (walletType == null) return

      try {
        await account.splitWalletInfo(walletId, walletType)
      } catch (error: any) {
        showError(error)
      }
    }
  }
}
