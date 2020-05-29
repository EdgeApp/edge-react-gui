// @flow

import { createYesNoModal } from 'edge-components'
import React from 'react'

import { launchModal } from '../components/common/ModalProvider.js'
import { showError } from '../components/services/AirshipInstance.js'
import { SPLIT } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import Text from '../modules/UI/components/FormattedText/FormattedText.ui.js'
import OptionIcon from '../modules/UI/components/OptionIcon/OptionIcon.ui'
import { B } from '../styles/common/textStyles.js'
import type { Dispatch, GetState } from '../types/reduxTypes.js'
import { getWalletName } from '../util/CurrencyWalletHelpers.js'
import { refreshWallet } from './WalletActions.js'

const getSplitType = (currencyCode: string) => (currencyCode === 'BCH' ? 'wallet:bitcoinsv' : 'wallet:bitcoincash')

export const showSplitWalletModal = (walletId: string) => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  const { currencyWallets = {} } = account
  const edgeWallet = currencyWallets[walletId]

  let bodyText = s.strings.fragment_wallets_split_wallet_first_confirm_message_mobile
  if (edgeWallet.currencyInfo.currencyCode === 'BCH') {
    bodyText = s.strings.fragment_wallets_split_wallet_bch_to_bsv
  }
  // Use `launchModal` to put the modal component on screen:
  const modal = createYesNoModal({
    title: s.strings.fragment_wallets_split_wallet,
    message: (
      <Text style={{ textAlign: 'center' }}>
        {bodyText}
        <B>{`${getWalletName(edgeWallet)}?`}</B>
      </Text>
    ),
    icon: <OptionIcon iconName={SPLIT} />,
    noButtonText: s.strings.string_cancel_cap,
    yesButtonText: s.strings.string_split
  })

  const resolveValue = await launchModal(modal)

  if (resolveValue) {
    try {
      const wallet = currencyWallets[walletId]
      const splitType = getSplitType(wallet.currencyInfo.currencyCode)
      await account.splitWalletInfo(walletId, splitType)
      dispatch(refreshWallet(walletId))
    } catch (error) {
      showError(error)
    }
  }
}
