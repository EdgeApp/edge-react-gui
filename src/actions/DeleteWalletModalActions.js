// @flow

import { createYesNoModal } from 'edge-components'
import React from 'react'

import { launchModal } from '../components/common/ModalProvider.js'
import { showError } from '../components/services/AirshipInstance.js'
import { DELETE } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import { getAccount, getWalletName } from '../modules/Core/selectors.js'
import Text from '../modules/UI/components/FormattedText/index'
import OptionIcon from '../modules/UI/components/OptionIcon/OptionIcon.ui'
import { B } from '../styles/common/textStyles.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'

export const showDeleteWalletModal = (walletId: string, additionalMsg: string = '') => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletName = getWalletName(state, walletId)
  const account = getAccount(state)

  // Use `launchModal` to put the modal component on screen:
  const modal = createYesNoModal({
    title: s.strings.fragment_wallets_delete_wallet,
    message: (
      <Text style={{ textAlign: 'center' }}>
        {s.strings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
        <B>{`${walletName}?`}</B>
        {additionalMsg}
      </Text>
    ),
    icon: <OptionIcon iconName={DELETE} />,
    noButtonText: s.strings.string_cancel_cap,
    yesButtonText: s.strings.string_delete
  })

  const resolveValue = await launchModal(modal)

  if (resolveValue) {
    account.changeWalletStates({ [walletId]: { deleted: true } }).catch(showError)
  }
}
