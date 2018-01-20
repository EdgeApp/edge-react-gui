// @flow

import React, {Component} from 'react'
import {View, Text, TextInput, TouchableHighlight} from 'react-native'

import Gradient from '../../components/Gradient/Gradient.ui'
import RadioButton from './components/RadioButton.ui'
import CustomFees from './components/CustomFees/CustomFeesConnector.js'

import {PrimaryButton} from '../../components/Buttons/Buttons.ui'

import * as FEE from '../../../../constants/FeeConstants'
import s from '../../../../locales/strings.js'

import styles from './style'

const HIGH_FEE_TEXT = s.strings.mining_fee_high_label_choice
const STANDARD_FEE_TEXT = s.strings.mining_fee_standard_label_choice
const LOW_FEE_TEXT = s.strings.mining_fee_low_label_choice

type Props = {
  feeSetting: string,
  onSubmit: (feeSetting: string) => void,
}
type State = {
  feeSetting: string,
}
export class ChangeMiningFee extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      feeSetting: props.feeSetting,
      fee: ''
    }
  }

  componentWillUnmount () {
    if (this.state.feeSetting !== this.props.feeSetting) {
      this.props.onSubmit(this.state.feeSetting)
    }
  }

  handlePress = (feeSetting: string) => {
    return this.setState({ feeSetting })
  }

  render () {
    const { feeSetting } = this.state

    return (
      <View style={styles.container}>
        <Gradient style={styles.gradient} />

        <View style={styles.headerContainer}>
          <Text style={styles.header} >
            {s.strings.change_mining_fee_body}
          </Text>
        </View>

        <View style={styles.body}>
          <View key={FEE.HIGH_FEE} style={styles.row}>
            <RadioButton
              value={FEE.HIGH_FEE}
              label={HIGH_FEE_TEXT}
              onPress={this.handlePress}
              isSelected={FEE.HIGH_FEE === feeSetting}
            />
          </View>

          <View key={FEE.STANDARD_FEE} style={styles.row}>
            <RadioButton
              value={FEE.STANDARD_FEE}
              label={STANDARD_FEE_TEXT}
              onPress={this.handlePress}
              isSelected={FEE.STANDARD_FEE === feeSetting}
            />
          </View>

          <View key={FEE.LOW_FEE} style={styles.row}>
            <RadioButton
              value={FEE.LOW_FEE}
              label={LOW_FEE_TEXT}
              onPress={this.handlePress}
              isSelected={FEE.LOW_FEE === feeSetting}
            />
          </View>
          <CustomFees />
        </View>
      </View>
    )
  }
}

export default ChangeMiningFee
