// @flow

import { PrimaryButton, showModal } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'
import slowlog from 'react-native-slowlog'

import * as FEE from '../../constants/FeeConstants'
import s from '../../locales/strings.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/ChangeMiningFeeStyle'
import RadioButton from '../common/ChangeMiningFeeRadioButton'
import { type CustomFees, createCustomFeesModal } from '../modals/CustomFeesModal.js'

const HIGH_FEE_TEXT = s.strings.mining_fee_high_label_choice
const STANDARD_FEE_TEXT = s.strings.mining_fee_standard_label_choice
const LOW_FEE_TEXT = s.strings.mining_fee_low_label_choice

export type ChangeMiningFeeOwnProps = {
  // fee: string,
  feeSetting: string,
  onSubmit: (feeSetting: string) => Promise<void>,
  sourceWallet: EdgeCurrencyWallet,
  onSubmitCustomFee: (customNetworkFee: CustomFees) => void
}

export type ChangeMiningFeeStateProps = {
  feeSetting: string,
  customFeeSettings: Array<string>,
  customNetworkFee: Object
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

  showCustomFeesModal = async () => {
    const { customNetworkFee, customFeeSettings, sourceWallet } = this.props
    const modal = createCustomFeesModal({
      sourceWallet,
      customNetworkFee,
      customFeeSettings
    })

    const data = await showModal(modal)
    if (data) {
      this.setState({ feeSetting: data.networkFeeOption }, () => {
        this.props.onSubmitCustomFee(data)
      })
    }
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
            <View style={{ marginTop: 18 }}>
              <PrimaryButton style={styles.customFeeButton} onPress={this.showCustomFeesModal}>
                <PrimaryButton.Text>{s.strings.fragment_wallets_set_custom_fees}</PrimaryButton.Text>
              </PrimaryButton>
            </View>
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
