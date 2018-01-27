// @flow

import React, {Component} from 'react'
import {View, Text} from 'react-native'

import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView'

import RadioButton from './components/RadioButton.ui'
import * as FEE from '../../../../constants/FeeConstants'
import s from '../../../../locales/strings.js'

import style from './style'

const feeOptions = [
  { value: FEE.LOW_FEE, label: 'mining_fee_low_label_choice' },
  { value: FEE.STANDARD_FEE, label: 'mining_fee_standard_label_choice' },
  { value: FEE.HIGH_FEE, label: 'mining_fee_high_label_choice' }
]

type Props = {
  feeSetting: string,
  onSubmit: (feeSetting: string) => Promise<void>
}

type State = {
  feeSetting: string
}

export default class ChangeMiningFee extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      feeSetting: props.feeSetting
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
      <SafeAreaView>
        <View style={style.container}>
          <Gradient style={style.gradient} />
          <View style={style.headerContainer}>
            <Text style={style.header} >
              {s.strings.change_mining_fee_body}
            </Text>
          </View>
          <View style={style.body}>
            {feeOptions.map(({ value, label }) => (
              <View key={value} style={style.row}>
                <RadioButton
                  value={value}
                  label={s.strings[label]}
                  onPress={this.handlePress}
                  isSelected={value === feeSetting}
                />
              </View>
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
      </SafeAreaView>
    )
  }
}
