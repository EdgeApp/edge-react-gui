// @flow

import React, { Component } from 'react'

import * as Constants from '../../../../../../constants/indexConstants.js'
import s from '../../../../../../locales/strings.js'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import ResyncWalletButtons from './ResyncWalletButtonsConnector'

type Props = {
  visibilityBoolean: boolean,
  onExitButtonFxn: () => void
}

export default class ResyncModal extends Component<Props> {
  render () {
    return (
      <StylizedModal
        featuredIcon={<OptionIcon iconName={Constants.RESYNC} />}
        headerText={s.strings.fragment_wallets_resync_wallet}
        modalMiddle={
          <OptionSubtext
            confirmationText={s.strings.fragment_wallets_resync_wallet_first_confirm_message_mobile}
            label={s.strings.fragment_wallets_resync_wallet}
          />
        }
        modalBottom={<ResyncWalletButtons />}
        visibilityBoolean={this.props.visibilityBoolean}
        onExitButtonFxn={this.props.onExitButtonFxn}
      />
    )
  }
}
