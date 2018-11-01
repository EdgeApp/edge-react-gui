// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'
import slowlog from 'react-native-slowlog'

import CustomFees from '../../connectors/CustomFeesConnector.js'
import * as FEE from '../../constants/FeeConstants'
import s from '../../locales/strings.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/ChangeMiningFeeStyle'
import RadioButton from '../common/ChangeMiningFeeRadioButton'

const HIGH_FEE_TEXT = s.strings.mining_fee_high_label_choice
const STANDARD_FEE_TEXT = s.strings.mining_fee_standard_label_choice
const LOW_FEE_TEXT = s.strings.mining_fee_low_label_choice

export type ChangeMiningFeeOwnProps = {
  // fee: string,
  feeSetting: string,
  onSubmit: (feeSetting: string) => Promise<void>,
  sourceWallet: EdgeCurrencyWallet
}

export type ChangeMiningFeeStateProps = {
  feeSetting: string
}

export type ChangeMiningFeeDispatchProps = {}

type State = {
  feeSetting: string
}

export type ChangeMiningFeeProps = ChangeMiningFeeOwnProps & ChangeMiningFeeDispatchProps & ChangeMiningFeeStateProps

export default class ChangeMiningFee extends Component<ChangeMiningFeeProps, State> {
  constructor (props: ChangeMiningFeeProps) {
    super(props)
    this.state = {
      feeSetting: props.feeSetting
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  componentWillUnmount () {
    this.props.onSubmit(this.state.feeSetting)
  }

  handlePress = (feeSetting: string, cb: any) => {
    return this.setState({ feeSetting }, cb)
  }

  render () {
    const { feeSetting } = this.state

    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Gradient style={styles.gradient} />

          <View style={styles.content}>
            <View style={styles.row}>
              <RadioButton value={FEE.HIGH_FEE} label={HIGH_FEE_TEXT} onPress={this.handlePress} isSelected={FEE.HIGH_FEE === feeSetting} />
            </View>

            <View style={styles.row}>
              <RadioButton value={FEE.STANDARD_FEE} label={STANDARD_FEE_TEXT} onPress={this.handlePress} isSelected={FEE.STANDARD_FEE === feeSetting} />
            </View>

            <View style={styles.row}>
              <RadioButton value={FEE.LOW_FEE} label={LOW_FEE_TEXT} onPress={this.handlePress} isSelected={FEE.LOW_FEE === feeSetting} />
            </View>
            <CustomFees handlePress={this.handlePress} sourceWallet={this.props.sourceWallet} />
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
