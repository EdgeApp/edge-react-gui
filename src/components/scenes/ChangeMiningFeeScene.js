// @flow

import { type EdgeSpendTarget } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { sendConfirmationUpdateTx } from '../../actions/SendConfirmationActions.js'
import { FEE_STRINGS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { getGuiMakeSpendInfo } from '../../modules/UI/scenes/SendConfirmation/selectors.js'
import { dayText, nightText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { type FeeOption } from '../../types/types.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'

type OwnProps = {
  navigation: NavigationProp<'changeMiningFee'>,
  route: RouteProp<'changeMiningFee'>
}

type StateProps = {
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  spendTargets?: EdgeSpendTarget[],
  maxSpendSet: boolean
}

type DispatchProps = {
  onSubmit: (networkFeeOption: string, customNetworkFee: Object, walletId: string, currencyCode?: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

type State = {
  networkFeeOption: FeeOption,
  customNetworkFee: Object
}

export class ChangeMiningFee extends React.Component<Props, State> {
  constructor(props: Props) {
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

  getCustomFormat(): string[] | void {
    const { route } = this.props
    const { wallet } = route.params
    if (wallet.currencyInfo.defaultSettings != null) {
      const { customFeeSettings } = wallet.currencyInfo.defaultSettings
      return customFeeSettings
    }
  }

  onSubmit = () => {
    const { networkFeeOption, customNetworkFee } = this.state
    const { spendTargets = [], maxSpendSet, navigation, route } = this.props
    const { currencyCode, wallet } = route.params
    const testSpendInfo = {
      spendTargets: spendTargets.map(spendTarget => ({
        ...spendTarget,
        nativeAmount: maxSpendSet || spendTarget.nativeAmount === '' ? '0' : spendTarget.nativeAmount
      })),
      networkFeeOption,
      customNetworkFee,
      currencyCode
    }
    wallet
      .makeSpend(testSpendInfo)
      .then(() => {
        this.props.onSubmit(networkFeeOption, customNetworkFee, wallet.id, currencyCode)
        navigation.goBack()
      })
      .catch(e => {
        let message = e.message
        if (e.name === 'ErrorBelowMinimumFee') message = `${s.strings.invalid_custom_fee} ${e.message}`
        showError(message)
      })
  }

  render() {
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
          <PrimaryButton onPress={this.onSubmit} style={styles.saveButton}>
            <PrimaryButton.Text>{s.strings.save}</PrimaryButton.Text>
          </PrimaryButton>
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderRadioRow(value: FeeOption, label: string) {
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

  renderCustomFee(customFormat: string[]): React.Node {
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

  renderFeeWarning() {
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

const rawStyles = {
  content: {
    flexGrow: 1,
    backgroundColor: THEME.COLORS.WHITE,
    padding: THEME.rem(1.4)
  },

  // Radio input:
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.rem(1)
  },
  radio: {
    borderRadius: THEME.rem(0.5),
    marginRight: THEME.rem(0.5),
    width: THEME.rem(1),
    height: THEME.rem(1),
    borderWidth: THEME.rem(1 / 16),
    borderColor: THEME.COLORS.GRAY_2
  },
  selected: {
    borderColor: THEME.COLORS.ACCENT_BLUE,
    backgroundColor: THEME.COLORS.ACCENT_BLUE
  },

  // Custom fee area:
  customArea: {
    marginBottom: THEME.rem(1)
  },

  // Warning box:
  warningBox: {
    padding: THEME.rem(0.5),

    backgroundColor: THEME.COLORS.ACCENT_ORANGE,
    borderRadius: THEME.rem(0.5),

    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },

  saveButton: {
    marginTop: THEME.rem(1.25)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const ChangeMiningFeeScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    networkFeeOption: getGuiMakeSpendInfo(state).networkFeeOption,
    customNetworkFee: getGuiMakeSpendInfo(state).customNetworkFee,
    spendTargets: getGuiMakeSpendInfo(state).spendTargets,
    maxSpendSet: state.ui.scenes.sendConfirmation.maxSpendSet
  }),
  dispatch => ({
    onSubmit(networkFeeOption: string, customNetworkFee: Object, walletId: string, currencyCode?: string) {
      dispatch(sendConfirmationUpdateTx({ networkFeeOption, customNetworkFee }, true, walletId, currencyCode, true))
    }
  })
)(ChangeMiningFee)
