import * as React from 'react'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import { ModalMessage } from '../components/themed/ModalParts'
import { lstrings } from '../locales/strings'
import { B } from '../styles/common/textStyles'
import { ThunkAction } from '../types/reduxTypes'
import { getWalletName } from '../util/CurrencyWalletHelpers'

export function showDeleteWalletModal(walletId: string, additionalMsg?: string): ThunkAction<Promise<'confirm' | 'cancel' | undefined>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account

    const resolveValue = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.fragment_wallets_delete_wallet}
        buttons={{
          confirm: { label: lstrings.string_archive },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      >
        <>
          <ModalMessage>
            {lstrings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
            <B>{getWalletName(currencyWallets[walletId])}?</B>
          </ModalMessage>
          {additionalMsg == null ? null : <ModalMessage>{additionalMsg}</ModalMessage>}
        </>
      </ButtonsModal>
    ))

    return resolveValue
  }
}
