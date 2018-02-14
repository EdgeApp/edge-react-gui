// @flow

import React, { Component } from 'react'

import * as Constants from '../../../../../../constants/indexConstants.js'
import s from '../../../../../../locales/strings.js'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import DeleteWalletButtons from './DeleteWalletButtonsConnector'

type Props = {
  visibilityBoolean: boolean,
  onExitButtonFxn: () => void
}

type State = any

export default class DeleteModal extends Component<Props, State> {
  render () {
    return (
      <StylizedModal
        featuredIcon={<OptionIcon iconName={Constants.DELETE} />}
        headerText={s.strings.fragment_wallets_delete_wallet}
        modalMiddle={
          <OptionSubtext
            confirmationText={s.strings.fragmet_wallets_delete_wallet_first_confirm_message_mobile}
            label={s.strings.fragment_wallets_delete_wallet}
          />
        }
        modalBottom={<DeleteWalletButtons />}
        visibilityBoolean={this.props.visibilityBoolean}
        onExitButtonFxn={this.props.onExitButtonFxn}
      />
    )
  }
}
