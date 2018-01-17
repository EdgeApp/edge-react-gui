// @flow

import React, {Component} from 'react'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import s from '../../../../../../locales/strings.js'

import RenameWalletButtons from './RenameWalletButtonsConnector'
import WalletNameInput from './WalletNameInputConnector'

import {
  CLOSE_MODAL_FUNCTION,
  VISIBLE_MODAL_NAME
} from '../WalletOptions/action'

type Props = any
type State = any

export default class RenameModal extends Component<Props, State> {
  render () {
    return <StylizedModal
      featuredIcon={<OptionIcon iconName={Constants.RENAME}/>}
      headerText={s.strings.fragment_wallets_rename_wallet}
      modalMiddle={<WalletNameInput
        label={s.strings.fragment_wallets_rename_wallet}
        walletName={this.props.walletName}
        currentWalletNameInput={this.props.renameWalletInput}
      />}
      modalBottom={<RenameWalletButtons />}
      visibilityBoolean={this.props.visibilityBoolean}
      onExitButtonFxn={this.props.onExitButtonFxn}
    />
  }
}
