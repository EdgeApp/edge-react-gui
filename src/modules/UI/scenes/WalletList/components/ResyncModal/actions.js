// @flow

import { createYesNoModal } from 'edge-components'
import React from 'react'

import { RESYNC } from '../../../../../../constants/indexConstants.js'
import s from '../../../../../../locales/strings.js'
import { getWallet, getWalletName } from '../../../../../Core/selectors.js'
import { resyncWallet } from '../../../../../Core/Wallets/api.js'
import { showModal } from '../../../../../ModalManager.js'
import type { Dispatch, GetState } from '../../../../../ReduxTypes.js'
import Text from '../../../../components/FormattedText'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'

export const showResyncWalletModal = (walletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const wallet = getWallet(state, walletId)
  const walletName = getWalletName(state, walletId)

  // Use `showModal` to put the modal component on screen:
  const modal = createYesNoModal({
    title: s.strings.fragment_wallets_resync_wallet,
    message: (
      <Text style={{ textAlign: 'center' }}>
        {s.strings.fragment_wallets_resync_wallet_first_confirm_message_mobile}
        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{`${walletName}?`}</Text>
      </Text>
    ),
    icon: <OptionIcon iconName={RESYNC} />,
    noButtonText: s.strings.string_cancel_cap,
    yesButtonText: s.strings.string_resync
  })

  const resolveValue = await showModal(modal)

  if (resolveValue) {
    try {
      resyncWallet(wallet)
    } catch (e) {
      throw new Error(e)
    }
  }
}

export type CloseResyncWalletModalAction = {
  type: 'CLOSE_RESYNC_WALLET_MODAL'
}

export type ResyncWalletModalAction = OpenResyncWalletModalAction | CloseResyncWalletModalAction
