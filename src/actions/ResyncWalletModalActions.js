// @flow

import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { getWalletName } from '../util/CurrencyWalletHelpers.js'

export const showResyncWalletModal = (walletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { currencyWallets } = state.core.account
  const wallet = currencyWallets[walletId]

  const resolveValue = await Airship.show(bridge => (
    <ButtonsModal
      testId="ResyncWalletModal"
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
