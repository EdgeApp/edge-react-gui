// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js/types'
import React, { type Node, Component } from 'react'
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
  constructor (props: Props) {
    super(props)
    const { networkFeeOption = 'standard', customNetworkFee = {} } = props
    const customFormat = this.getCustomFormat()

    if (customFormat != null && Object.keys(customNetworkFee).length !== customFormat.length) {
      // Reset the custom fees if they don't match the format:
      const defaultCustomFee = {}
      for (const key of customFormat) defaultCustomFee[key] = ''
      this.state = { networkFeeOption, customNetworkFee: defaultCustomFee }
    } else {
      // Otherwise, use the custom fees from before:
      this.state = { networkFeeOption, customNetworkFee }
    }
  }

  getCustomFormat (): Array<string> | void {
    const { wallet } = this.props
    if (wallet.currencyInfo.defaultSettings != null) {
      const { customFeeSettings } = wallet.currencyInfo.defaultSettings
      return customFeeSettings
    }
  }

  componentWillUnmount () {
    const { networkFeeOption, customNetworkFee } = this.state
    this.props.onSubmit(networkFeeOption, customNetworkFee)
  }

  render () {
    const customFormat = this.getCustomFormat()

    return (
      <SceneWrapper background="body" hasTabs={false} avoidKeyboard>
        <ScrollView style={styles.content}>
          {this.renderRadioRow('high', s.strings.mining_fee_high_label_choice)}
          {this.renderRadioRow('standard', s.strings.mining_fee_standard_label_choice)}
          {this.renderRadioRow('low', s.strings.mining_fee_low_label_choice)}
          {customFormat != null ? this.renderRadioRow('custom', s.strings.mining_fee_custom_label_choice) : null}
          {customFormat != null ? this.renderCustomFee(customFormat) : null}
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

  renderCustomFee (customFormat: Array<string>): Node {
    const { networkFeeOption, customNetworkFee } = this.state
    if (networkFeeOption !== 'custom') return null

    return (
      <View style={styles.customArea}>
        {customFormat.map(key => (
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
