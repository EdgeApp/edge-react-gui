// @flow

import { PrimaryButton } from 'edge-components'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import * as FEE from '../../constants/FeeConstants'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import { styles } from '../../styles/scenes/ChangeMiningFeeStyle.js'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
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
  customNetworkFee: Object,
  hideCustomFeeOption?: boolean
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

  handlePress = (feeSetting: string) => {
    return this.setState({ feeSetting })
  }

  showCustomFeesModal = async () => {
    const { customNetworkFee, customFeeSettings, sourceWallet } = this.props
    const modal = createCustomFeesModal({
      sourceWallet,
      customNetworkFee,
      customFeeSettings
    })

    const data = await launchModal(modal)
    if (data) {
      this.setState({ feeSetting: data.networkFeeOption }, () => {
        this.props.onSubmitCustomFee(data)
      })
    }
  }

  renderRadioRow (value: string, label: string) {
    const { feeSetting } = this.state
    return (
      <View style={styles.row}>
        <TouchableWithoutFeedback onPress={() => this.handlePress(value)}>
          <View style={styles.column}>
            <View style={[styles.radio, feeSetting === value ? styles.selected : null]} />
            <View>
              <T style={styles.label}>{label}</T>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }

  renderCustomFeeButton = () => {
    if (this.props.hideCustomFeeOption) return null
    return (
      <View style={{ marginTop: 18 }}>
        <PrimaryButton style={styles.customFeeButton} onPress={this.showCustomFeesModal}>
          <PrimaryButton.Text>{s.strings.fragment_wallets_set_custom_fees}</PrimaryButton.Text>
        </PrimaryButton>
      </View>
    )
  }

  render () {
    return (
      <SceneWrapper background="body" hasTabs={false}>
        <View style={styles.content}>
          {this.renderRadioRow(FEE.HIGH_FEE, HIGH_FEE_TEXT)}
          {this.renderRadioRow(FEE.STANDARD_FEE, STANDARD_FEE_TEXT)}
          {this.renderRadioRow(FEE.LOW_FEE, LOW_FEE_TEXT)}
          {this.renderCustomFeeButton()}
        </View>
      </SceneWrapper>
    )
  }
}
