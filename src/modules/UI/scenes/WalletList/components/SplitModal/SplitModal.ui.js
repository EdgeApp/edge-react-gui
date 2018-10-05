// @flow

import React, { Component } from 'react'

import * as Constants from '../../../../../../constants/indexConstants.js'
import s from '../../../../../../locales/strings.js'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import SplitWalletButtons from './SplitWalletButtonsConnector'

type SplitModalOwnProps = {
  onExitButtonFxn: () => void
}

type SplitModalStateProps = {
  visibilityBoolean: boolean
}

type SplitModalProps = SplitModalOwnProps & SplitModalStateProps

export default class SplitModal extends Component<SplitModalProps> {
  render () {
    return (
      <StylizedModal
        featuredIcon={<OptionIcon iconName={Constants.SPLIT} />}
        headerText={s.strings.fragment_wallets_split_wallet}
        modalMiddle={
          <OptionSubtext
            confirmationText={s.strings.fragment_wallets_split_wallet_first_confirm_message_mobile}
            label={s.strings.fragment_wallets_split_wallet}
          />
        }
        modalBottom={<SplitWalletButtons />}
        visibilityBoolean={this.props.visibilityBoolean}
        onExitButtonFxn={this.props.onExitButtonFxn}
      />
    )
  }
}
