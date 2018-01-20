// @flow

import React, {Component} from 'react'
import { View, TextInput } from 'react-native'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import { FormField } from '../../../../../../components/FormField.js'
import * as Constants from '../../../../../../constants/indexConstants.js'
import styles from './style'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import OptionButtons from '../../../../components/OptionButtons/OptionButtons.ui.js'
import s from '../../../../../../locales/strings.js'
import { Platform } from 'react-native'

type Props = {
  visibilityBoolean: boolean,
  onExitButtonFxn: Function,
  onNegative: Function,
  onPositive: Function,
  onDone: Function
}

type State = any

export default class CustomFeesModal extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {}
    this.cleanState()
    for (const feeSetting of this.props.customFeeSettings) {
      this.state[feeSetting] = ''
    }
  }

  cleanState = () => {
    for (const feeSetting of this.props.customFeeSettings) {
      this.state[feeSetting] = ''
    }
  }
  
  onNegative = () => {
    this.props.onNegative()
    this.cleanState()
    this.props.onDone()
  }

  onPositive = () => {
    this.props.onPositive(this.state)
    this.cleanState()
    this.props.onDone()
  }

  _onFeeSettingInputChange = (feeSetting) => (input: string) => {
    this.setState({ [feeSetting]: input })
  }

  onExitButtonFxn = () => {
    this.cleanState()
    this.props.onExitButtonFxn()
  }

  renderModalMiddle = () => {
    const rows = []
    for (const feeSetting of this.props.customFeeSettings) {
      rows.push(
        <View style={[styles.feeInputWrap]} key={feeSetting}>
          <FormField
            keyboardType='numeric'
            style={[styles.feeInput]}
            placeholder={'0'}
            onChangeText={this._onFeeSettingInputChange(feeSetting)}
            value={this.state[feeSetting]}
            label={feeSetting}
            autoFocus
          />
        </View>
      )
    }
    return rows
  }

  render () {
    const modalMiddle = this.renderModalMiddle()
    const height = 50 + ( modalMiddle.length - 1 ) * 58
    return <StylizedModal
      featuredIcon={<OptionIcon iconName={Constants.CUSTOM_FEES_ICON}/>}
      headerText={s.strings.fragment_wallets_set_custom_fees}
      modalMiddle={modalMiddle}
      modalMiddleStyle={{ height }}
      modalBottom={<OptionButtons
        positiveText={s.strings.string_custom_fee}
        onPositive={this.onPositive}
        onNegative={this.onNegative}
      />}
      visibilityBoolean={this.props.visibilityBoolean}
      onExitButtonFxn={this.onExitButtonFxn}
    />
  }
}
