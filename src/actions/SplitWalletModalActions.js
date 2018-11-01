// @flow

import { createYesNoModal, showModal } from 'edge-components'
import React from 'react'

import { SPLIT } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import { getAccount, getWalletName } from '../modules/Core/selectors.js'
import type { Dispatch, GetState } from '../modules/ReduxTypes.js'
import Text from '../modules/UI/components/FormattedText/index'
import OptionIcon from '../modules/UI/components/OptionIcon/OptionIcon.ui'
import { refreshWallet } from './WalletActions.js'

const getSplitType = () => 'wallet:bitcoincash'

export const showSplitWalletModal = (walletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const walletName = getWalletName(state, walletId)
  const account = getAccount(state)

  // Use `showModal` to put the modal component on screen:
  const modal = createYesNoModal({
    title: s.strings.fragment_wallets_split_wallet,
    message: (
      <Text style={{ textAlign: 'center' }}>
        {s.strings.fragment_wallets_split_wallet_first_confirm_message_mobile}
        <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{`${walletName}?`}</Text>
      </Text>
    ),
    icon: <OptionIcon iconName={SPLIT} />,
    noButtonText: s.strings.string_cancel_cap,
    yesButtonText: s.strings.string_split
  })

  const resolveValue = await showModal(modal)

  if (resolveValue) {
    try {
      await account.splitWalletInfo(walletId, getSplitType())
      dispatch(refreshWallet(walletId))
    } catch (e) {
      throw new Error(e)
    }
  }
}

export type OpenSplitWalletModalAction = {
  type: 'OPEN_SPLIT_WALLET_MODAL',
  data: { walletId: string }
}

export type CloseSplitWalletModalAction = {
  type: 'CLOSE_SPLIT_WALLET_MODAL'
}

export type SplitWalletModalAction = OpenSplitWalletModalAction | CloseSplitWalletModalAction
