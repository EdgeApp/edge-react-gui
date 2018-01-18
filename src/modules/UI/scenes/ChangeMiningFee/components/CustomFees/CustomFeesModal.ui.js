// @flow

import React, {Component} from 'react'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import OptionButtons from '../../../../components/OptionButtons/OptionButtons.ui.js'
import s from '../../../../../../locales/strings.js'

type Props = {
  visibilityBoolean: boolean,
  onExitButtonFxn: Function,
  onNegative: Function,
  onPositive: Function,
  onDone: Function,
  walletId: string
}

type State = any

export default class CustomFeesModal extends Component<Props, State> {
  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
  }
  onPositive = () => {
    this.props.onPositive(this.props.walletId)
    this.props.onDone()
  }

  render () {
    return <StylizedModal
      featuredIcon={<OptionIcon iconName={Constants.CUSTOM_FEES_ICON}/>}
      headerText={s.strings.fragment_wallets_set_custom_fees}
      modalMiddle={<OptionSubtext
        confirmationText={s.strings.fragment_wallets_set_custom_fees}
        label={s.strings.fragment_wallets_set_custom_fees}
      />}
      modalBottom={<OptionButtons
        positiveText={s.strings.string_custom_fee}
        onPositive={this.onPositive}
        onNegative={this.onNegative}
      />}
      visibilityBoolean={this.props.visibilityBoolean}
      onExitButtonFxn={this.props.onExitButtonFxn}
    />
  }
}
