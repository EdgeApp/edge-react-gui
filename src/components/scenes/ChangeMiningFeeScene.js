// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js/types'
import React, { Component, type Node } from 'react'
import { ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import { connect } from 'react-redux'

import { sendConfirmationUpdateTx } from '../../actions/SendConfirmationActions.js'
import { FEE_STRINGS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getGuiMakeSpendInfo } from '../../modules/UI/scenes/SendConfirmation/selectors.js'
import { type FeeOption } from '../../reducers/scenes/SendConfirmationReducer.js'
import { dayText, nightText } from '../../styles/common/textStyles.js'
import { styles } from '../../styles/scenes/ChangeMiningFeeStyle.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type OwnProps = {
  wallet: EdgeCurrencyWallet
}

type StateProps = {
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object
}

type DispatchProps = {
  onSubmit(networkFeeOption: string, customNetworkFee: Object): mixed
}

type Props = OwnProps & StateProps & DispatchProps

type State = {
  networkFeeOption: FeeOption,
  customNetworkFee: Object
}

export class ChangeMiningFee extends Component<Props, State> {
  hasCustomFees: boolean

  constructor (props: Props) {
    super(props)
    const { networkFeeOption = 'standard', customNetworkFee, wallet } = props

    // Figure out how custom fees are supposed to look (if any):
    const defaultCustomFee = {}
    if (wallet.currencyInfo.defaultSettings != null) {
      const { customFeeSettings } = wallet.currencyInfo.defaultSettings
      if (customFeeSettings != null) {
        this.hasCustomFees = true
        for (const row of customFeeSettings) {
          defaultCustomFee[row] = '0'
        }
      }
    }

    if (customNetworkFee == null || Object.keys(customNetworkFee).length !== Object.keys(defaultCustomFee).length) {
      // Use the default custom fees if we get bogus ones:
      this.state = { networkFeeOption, customNetworkFee: defaultCustomFee }
    } else {
      // Otherwise, use the custom fees from before:
      this.state = { networkFeeOption, customNetworkFee }
    }
  }

  componentWillUnmount () {
    const { networkFeeOption, customNetworkFee } = this.state
    this.props.onSubmit(networkFeeOption, customNetworkFee)
  }

  render () {
    return (
      <SceneWrapper background="body" hasTabs={false} avoidKeyboard>
        <ScrollView style={styles.content}>
          {this.renderRadioRow('high', s.strings.mining_fee_high_label_choice)}
          {this.renderRadioRow('standard', s.strings.mining_fee_standard_label_choice)}
          {this.renderRadioRow('low', s.strings.mining_fee_low_label_choice)}
          {this.hasCustomFees != null ? this.renderRadioRow('custom', s.strings.mining_fee_custom_label_choice) : null}
          {this.renderCustomFee()}
          {this.renderFeeWarning()}
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderRadioRow (value: FeeOption, label: string) {
    const { networkFeeOption } = this.state

    return (
      <TouchableWithoutFeedback onPress={() => this.setState({ networkFeeOption: value })}>
        <View style={styles.radioRow}>
          <View style={[styles.radio, networkFeeOption === value ? styles.selected : null]} />
          <Text style={dayText('row-left')}>{label}</Text>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  renderCustomFee (): Node {
    const { networkFeeOption, customNetworkFee } = this.state
    if (networkFeeOption !== 'custom') return null

    return (
      <View style={styles.customArea}>
        {Object.keys(customNetworkFee).map(key => (
          <FormField
            key={key}
            keyboardType="numeric"
            onChangeText={text =>
              this.setState({
                customNetworkFee: { ...customNetworkFee, [key]: text }
              })
            }
            value={customNetworkFee[key]}
            label={FEE_STRINGS[key] || key}
          />
        ))}
      </View>
    )
  }

  renderFeeWarning () {
    const { networkFeeOption } = this.state
    if (networkFeeOption !== 'custom' && networkFeeOption !== 'low') return null

    return (
      <View style={styles.warningBox}>
        <EntypoIcon name="warning" color={THEME.COLORS.WHITE} size={THEME.rem(1.4)} />
        <Text style={nightText('small')}>{s.strings.warning_low_or_custom_fee}</Text>
      </View>
    )
  }
}

export const ChangeMiningFeeScene = connect(
  (state: ReduxState): StateProps => ({
    networkFeeOption: getGuiMakeSpendInfo(state).networkFeeOption,
    customNetworkFee: getGuiMakeSpendInfo(state).customNetworkFee
  }),
  (dispatch: Dispatch): DispatchProps => ({
    onSubmit (networkFeeOption: string, customNetworkFee: Object) {
      dispatch(sendConfirmationUpdateTx({ networkFeeOption, customNetworkFee }))
    }
  })
)(ChangeMiningFee)
