// @flow

import { createYesNoModal, showModal } from 'edge-components'
import React from 'react'

import { DELETE } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import { deleteWalletRequest } from '../modules/Core/Account/api.js'
import { getAccount, getWalletName } from '../modules/Core/selectors.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import Text from '../modules/UI/components/FormattedText/index'
import OptionIcon from '../modules/UI/components/OptionIcon/OptionIcon.ui'

export const showDeleteWalletModal = (walletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletName = getWalletName(state, walletId)
  const account = getAccount(state)

  // Use `showModal` to put the modal component on screen:
  const modal = createYesNoModal({
    title: s.strings.fragment_wallets_delete_wallet,
    message: (
      <Text style={{ textAlign: 'center' }}>
        {s.strings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{`${walletName}?`}</Text>
      </Text>
    ),
    icon: <OptionIcon iconName={DELETE} />,
    noButtonText: s.strings.string_cancel_cap,
    yesButtonText: s.strings.string_delete
  })

  const resolveValue = await showModal(modal)

  if (resolveValue) {
    try {
      deleteWalletRequest(account, walletId)
    } catch (e) {
      throw new Error(e)
    }
  }
}

export type OpenDeleteWalletModalAction = {
  type: 'OPEN_DELETE_WALLET_MODAL',
  data: { walletId: string }
}

export type CloseDeleteWalletModalAction = {
  type: 'CLOSE_DELETE_WALLET_MODAL'
}

export type DeleteWalletModalAction = OpenDeleteWalletModalAction | CloseDeleteWalletModalAction
