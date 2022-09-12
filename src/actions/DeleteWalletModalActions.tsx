import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError } from '../components/services/AirshipInstance'
import { ModalMessage } from '../components/themed/ModalParts'
import s from '../locales/strings'
import { B } from '../styles/common/textStyles'
import { Dispatch, GetState } from '../types/reduxTypes'
import { getWalletName } from '../util/CurrencyWalletHelpers'

export const showDeleteWalletModal = (walletId: string, additionalMsg?: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { currencyWallets } = account

  const resolveValue = await Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      title={s.strings.fragment_wallets_delete_wallet}
      buttons={{
        confirm: { label: s.strings.string_archive },
        cancel: { label: s.strings.string_cancel_cap }
      }}
    >
      <>
        <ModalMessage>
          {s.strings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
          <B>{getWalletName(currencyWallets[walletId])}?</B>
        </ModalMessage>
        {additionalMsg == null ? null : <ModalMessage>{additionalMsg}</ModalMessage>}
      </>
    </ButtonsModal>
  ))

  if (resolveValue === 'confirm') {
    const { name, type, id } = currencyWallets[walletId]
    account
      .changeWalletStates({ [walletId]: { deleted: true } })
      .catch(showError)
      .then(r => {
        global.logActivity(`Archived Wallet ${account.username} -- ${name ?? 'noname'} ${type} ${id}`)
      })
  }
}
