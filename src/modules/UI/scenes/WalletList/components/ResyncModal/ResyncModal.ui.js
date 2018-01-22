// @flow

import React, {Component} from 'react'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import s from '../../../../../../locales/strings.js'
import ResyncWalletButtons from './ResyncWalletButtonsConnector'

type Props = {
  visibilityBoolean: boolean,
  onExitButtonFxn: Function
}

type State = any

export default class ResyncModal extends Component<Props, State> {
  render () {
    return <StylizedModal
      featuredIcon={<OptionIcon iconName={Constants.RESYNC}/>}
      headerText={s.strings.fragment_wallets_resync_wallet}
      modalMiddle={<OptionSubtext
        confirmationText={s.strings.fragment_wallets_resync_wallet_first_confirm_message_mobile}
        label={s.strings.fragment_wallets_resync_wallet}
      />}
      modalBottom={<ResyncWalletButtons />}
      visibilityBoolean={this.props.visibilityBoolean}
      onExitButtonFxn={this.props.onExitButtonFxn}
    />
  }
}
