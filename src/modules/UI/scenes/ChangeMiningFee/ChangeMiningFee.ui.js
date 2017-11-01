import React, {Component} from 'react'
import {View, Text, TextInput} from 'react-native'

import RadioButton from './components/RadioButton.ui'
import * as FEE from '../../../../constants/FeeConstants'
import strings from '../../../../locales/default'

import style from './style'

const feeOptions = [
  { value: FEE.LOW_FEE, label: 'mining_fee_low_label_choice' },
  { value: FEE.STANDARD_FEE, label: 'mining_fee_standard_label_choice' },
  { value: FEE.HIGH_FEE, label: 'mining_fee_high_label_choice' },
  { value: FEE.CUSTOM_FEE, label: 'mining_fee_custom_label_choice' },
]

export default class ChangeMiningFee extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fee: props.fee,
      feeSetting: props.feeSetting,
    }
  }

  componentWillUnmount () {
    if (this.state.fee !== this.props.fee || this.state.feeSetting !== this.props.feeSetting) {
      this.props.onSubmit(this.state.feeSetting, this.state.fee)
    }
  }

  handlePress = (feeSetting) => this.setState({ feeSetting, fee: '' });
  handleChange = (fee) => this.setState({ fee });

  render () {
    const { feeSetting, fee } = this.state

    return (
      <View style={style.wrapper}>
        <Text style={style.header} >
          {strings.enUS['change_mining_fee_body']}
        </Text>
        <View>
          {feeOptions.map(({ value, label }) => (
            <RadioButton
              key={value}
              value={value}
              label={strings.enUS[label]}
              onPress={this.handlePress}
              isSelected={value === feeSetting}
            />
          ))}
        </View>
        {feeSetting === FEE.CUSTOM_FEE
          && <View>
            <TextInput
              style={style.input}
              value={fee}
              keyboardType='numeric'
              placeholder='Satoshi per byte'
              onChangeText={this.handleChange}
              returnKeyType='done'
            />
          </View>
        }
      </View>
    )
  }
}
