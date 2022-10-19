import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { getWalletName } from '../util/CurrencyWalletHelpers'

export function showResyncWalletModal(walletId: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { currencyWallets } = state.core.account
    const wallet = currencyWallets[walletId]

    const resolveValue = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fragment_wallets_resync_wallet}
        message={`${s.strings.fragment_wallets_resync_wallet_first_confirm_message_mobile} ${getWalletName(currencyWallets[walletId])}?`}
        buttons={{
          confirm: { label: s.strings.string_resync },
          cancel: { label: s.strings.string_cancel_cap }
        }}
      />
    ))

    if (resolveValue === 'confirm') {
      await wallet.resyncBlockchain()
      dispatch({
        type: 'RESET_WALLET_LOADING_PROGRESS',
        data: {
          walletId
        }
      })
    }
  }
}
