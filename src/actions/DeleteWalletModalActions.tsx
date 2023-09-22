import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import { ModalMessage } from '../components/themed/ModalParts'
import { lstrings } from '../locales/strings'
import { B } from '../styles/common/textStyles'
import { ThunkAction } from '../types/reduxTypes'
import { getWalletName } from '../util/CurrencyWalletHelpers'

export function showDeleteWalletModal(walletId: string, tokenCode?: string, additionalMsg?: string): ThunkAction<Promise<'confirm' | 'cancel' | undefined>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account

    const resolveValue = await Airship.show<'confirm' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={tokenCode == null ? lstrings.fragment_wallets_delete_wallet : lstrings.fragment_wallets_delete_token}
        buttons={{
          confirm: { label: lstrings.string_archive },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      >
        <>
          <ModalMessage>
            {tokenCode == null ? (
              <>
                {lstrings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
                <B>{getWalletName(currencyWallets[walletId])}?</B>
              </>
            ) : (
              <>{sprintf(lstrings.fragment_wallets_delete_token_prompt_2s, tokenCode, getWalletName(currencyWallets[walletId]))}</>
            )}
          </ModalMessage>
          {additionalMsg == null ? null : <ModalMessage>{additionalMsg}</ModalMessage>}
        </>
      </ButtonsModal>
    ))

    return resolveValue
  }
}
