import React, {Component} from 'react'
import {View, Text, TextInput} from 'react-native'

import RadioButton from './components/RadioButton.ui'
import * as FEE from '../../../../constants/FeeConstants'

import style from './style'

const feeOptions = [
  { value: FEE.LOW_FEE, label: 'Low' },
  { value: FEE.STANDARD_FEE, label: 'Standart' },
  { value: FEE.HIGH_FEE, label: 'High' },
  { value: FEE.CUSTOM_FEE, label: 'Custom (Advanced)' },
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

  hendlePress = (feeSetting) => this.setState({ feeSetting, fee: '' });
  hendleChange = (fee) => this.setState({ fee });

  render () {
    const { feeSetting, fee } = this.state

    return (
      <View style={style.wrapper}>
        <Text style={style.header} >
          Warning: Low Fees may cause long delays in transaction confirmation
        </Text>
        <View>
          {feeOptions.map(({ value, label }) => (
            <RadioButton
              key={value}
              value={value}
              label={label}
              onPress={this.hendlePress}
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
              onChangeText={this.hendleChange}
              returnKeyType='done'
            />
          </View>
        }
      </View>
    )
  }
}
