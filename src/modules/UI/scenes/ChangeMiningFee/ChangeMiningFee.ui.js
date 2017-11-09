// @flow

import React, {Component} from 'react'
import {View, Text} from 'react-native'

import RadioButton from './components/RadioButton.ui'
import * as FEE from '../../../../constants/FeeConstants'
import strings from '../../../../locales/default'

import style from './style'

const feeOptions = [
  { value: FEE.LOW_FEE, label: 'mining_fee_low_label_choice' },
  { value: FEE.STANDARD_FEE, label: 'mining_fee_standard_label_choice' },
  { value: FEE.HIGH_FEE, label: 'mining_fee_high_label_choice' },
  // { value: FEE.CUSTOM_FEE, label: 'mining_fee_custom_label_choice' },
]

type Props = {
  // fee: string,
  feeSetting: string,
  onSubmit: (feeSetting: string) => void,
}

type State = {
  // fee: string,
  feeSetting: string,
}

export default class ChangeMiningFee extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      // fee: props.fee,
      feeSetting: props.feeSetting,
    }
  }

  componentWillUnmount () {
    if (this.state.feeSetting !== this.props.feeSetting) {
      this.props.onSubmit(this.state.feeSetting)
    }
  }

  handlePress = (feeSetting: string) => this.setState({ feeSetting });
  // handleChange = (fee: string) => this.setState({ fee: fee.replace(/\D/g, '') });

  render () {
    const { feeSetting } = this.state

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
        {/* feeSetting === FEE.CUSTOM_FEE
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
        */}
      </View>
    )
  }
}
