// @flow

import React, { Component } from 'react'

import RenameWalletButtons from '../../connectors/RenameWalletButtonsConnector'
import WalletNameInput from '../../connectors/WalletNameInputConnector'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import StylizedModal from '../../modules/UI/components/Modal/Modal.ui'
import OptionIcon from '../../modules/UI/components/OptionIcon/OptionIcon.ui'

type Props = any
type State = any

export default class RenameModal extends Component<Props, State> {
  render () {
    return (
      <StylizedModal
        featuredIcon={<OptionIcon iconName={Constants.RENAME} />}
        headerText={s.strings.fragment_wallets_rename_wallet}
        modalMiddle={
          <WalletNameInput
            label={s.strings.fragment_wallets_rename_wallet}
            walletName={this.props.walletName}
            currentWalletNameInput={this.props.renameWalletInput}
          />
        }
        modalBottom={<RenameWalletButtons />}
        visibilityBoolean={this.props.visibilityBoolean}
        onExitButtonFxn={this.props.onExitButtonFxn}
      />
    )
  }
}
