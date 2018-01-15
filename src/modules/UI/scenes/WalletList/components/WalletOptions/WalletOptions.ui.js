// @flow

import React, {Component} from 'react'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import s from '../../../../../../locales/strings.js'

import DeleteWalletButtons from '../DeleteWalletButtonsConnector'
import WalletNameInput from '../WalletNameInputConnector'
import RenameWalletButtons from '../RenameWalletButtonsConnector'
import ResyncWalletButtons from '../ResyncWalletButtonsConnector'
import SplitWalletButtons from '../SplitWalletButtonsConnector'
import GetSeed from '../GetSeed/GetSeedConnector'

import {
  CLOSE_MODAL_FUNCTION,
  VISIBLE_MODAL_NAME
} from './action'

const optionSpecificParams = (value: string, props: any) => {
  switch (value) {
    case Constants.WALLET_OPTIONS.DELETE.value:
      return {
        headerText: s.strings.fragment_wallets_delete_wallet,
        modalMiddle: <OptionSubtext
          confirmationText={s.strings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
          label={s.strings.fragment_wallets_delete_wallet}
        />,
        modalBottom: <DeleteWalletButtons walletId={props.walletId} />
      }
    case Constants.WALLET_OPTIONS.RESYNC.value:
      return {
        headerText: s.strings.fragment_wallets_resync_wallet,
        modalMiddle: <OptionSubtext
          confirmationText={s.strings.fragment_wallets_resync_wallet_first_confirm_message_mobile}
          label={s.strings.fragment_wallets_resync_wallet}
        />,
        modalBottom: <ResyncWalletButtons walletId={props.walletId} />
      }
    case Constants.WALLET_OPTIONS.SPLIT.value:
      return {
        headerText: s.strings.fragment_wallets_split_wallet,
        modalMiddle: <OptionSubtext
          confirmationText={s.strings.fragment_wallets_split_wallet_first_confirm_message_mobile}
          label={s.strings.fragment_wallets_split_wallet}
        />,
        modalBottom: <SplitWalletButtons walletId={props.walletId} />
      }
    case Constants.WALLET_OPTIONS.RENAME.value:
      return {
        headerText: s.strings.fragment_wallets_rename_wallet,
        modalMiddle: <WalletNameInput
          label={s.strings.fragment_wallets_rename_wallet}
          walletName={props.walletName}
          currentWalletNameInput={props.renameWalletInput}
        />,
        modalBottom: <RenameWalletButtons walletName={props.walletName} walletId={props.walletId} />
      }
    case Constants.WALLET_OPTIONS.GET_SEED.value:
      return {
        headerText: s.strings.fragment_wallets_get_seed_wallet,
        modalMiddle: <OptionSubtext
          confirmationText={s.strings.fragment_wallets_get_seed_wallet_first_confirm_message_mobile}
          label={s.strings.fragment_wallets_get_seed_wallet}
        />,
        modalBottom: <GetSeed walletId={props.walletId} />
      }
    default:
      return null
  }
}

type Props = any
type State = any

export default class WalletOptions extends Component<Props, State> {
  render () {
    const walletOptions = []

    for (const walletOption in Constants.WALLET_OPTIONS) {
      const option = Constants.WALLET_OPTIONS[walletOption]
      const value = option.value

      if (option.modalVisible) {
        const params = optionSpecificParams(value, this.props)
        if (params) {
          const optionResult = <StylizedModal
            key={walletOption}
            featuredIcon={<OptionIcon iconName={Constants[walletOption]}/>}
            headerText={params.headerText}
            modalMiddle={params.modalMiddle}
            modalBottom={params.modalBottom}
            visibilityBoolean={this.props[VISIBLE_MODAL_NAME(value)]}
            onExitButtonFxn={this.props[CLOSE_MODAL_FUNCTION(value)]}
          />
          walletOptions.push(optionResult)
        }
      }
    }
    return walletOptions
  }
}
