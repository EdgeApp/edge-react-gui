// @flow

import type { EdgeCurrencyWallet, EdgeSpendTarget } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import EntypoIcon from 'react-native-vector-icons/Entypo'
import { connect } from 'react-redux'

import { sendConfirmationUpdateTx } from '../../actions/SendConfirmationActions.js'
import { setDefaultFeeSetting } from '../../actions/SettingsActions.js'
import { FEE_STRINGS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { getGuiMakeSpendInfo } from '../../modules/UI/scenes/SendConfirmation/selectors.js'
import type { CurrencySetting, DefaultFeeOption, FeeOption } from '../../reducers/scenes/SettingsReducer.js'
import { dayText, nightText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'
import { SwitchButton } from '../themed/ThemedButtons.js'

type OwnProps = {
  wallet: EdgeCurrencyWallet,
  currencyCode?: string
}

type DefaultFeeSettings = {
  currentDefault: DefaultFeeOption,
  isDefault: boolean,
  currentDefaultCustomFee: Object
}

type FeeSettings = {
  defaultFeeSettings: DefaultFeeSettings,
  networkFeeOption: FeeOption,
  customNetworkFee: Object
}

type StateProps = {
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  currencySettings?: CurrencySetting,
  spendTargets?: EdgeSpendTarget[]
}

type DispatchProps = {
  onSubmit(feeSettings: FeeSettings, walletId: string, currencyCode?: string): mixed
}

type Props = OwnProps & StateProps & DispatchProps

type State = {
  networkFeeOption: FeeOption,
  isDefault: boolean,
  currentDefault: DefaultFeeOption,
  customNetworkFee: Object,
  currentDefaultCustomFee: Object
}

export class ChangeMiningFee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const defaultNetworkFee = 'standard'
    let isDefault = false

    const { customNetworkFee = {} } = props // Initially standard
    let { networkFeeOption = defaultNetworkFee } = props // Initially standard

    const currentDefault = props.currencySettings?.defaultFee ?? 'none'
    const currentDefaultCustomFee = props.currencySettings?.customFee ?? {}
    if (currentDefault !== 'none') {
      networkFeeOption = currentDefault
      isDefault = true
    }

    const customFormat = this.getCustomFormat()

    if (customFormat != null && Object.keys(customNetworkFee).length !== customFormat.length) {
      // Reset the custom fees if they don't match the format:
      const defaultCustomFee = {}
      for (const key of customFormat) defaultCustomFee[key] = ''
      this.state = { networkFeeOption, isDefault, currentDefault, customNetworkFee: defaultCustomFee, currentDefaultCustomFee }
    } else {
      // Otherwise, use the custom fees from before:
      this.state = { networkFeeOption, isDefault, currentDefault, customNetworkFee, currentDefaultCustomFee }
    }
  }

  getCustomFormat(): string[] | void {
    const { wallet } = this.props
    if (wallet.currencyInfo.defaultSettings != null) {
      const { customFeeSettings } = wallet.currencyInfo.defaultSettings
      return customFeeSettings
    }
  }

  onSubmit = () => {
    const { networkFeeOption, isDefault, currentDefault, customNetworkFee, currentDefaultCustomFee } = this.state
    const { currencyCode, wallet, spendTargets = [] } = this.props
    const testSpendInfo = { spendTargets, networkFeeOption, customNetworkFee, currencyCode }
    wallet
      .makeSpend(testSpendInfo)
      .then(() => {
        const feeSettings: FeeSettings = {
          defaultFeeSettings: {
            currentDefault: currentDefault,
            isDefault: isDefault,
            currentDefaultCustomFee: currentDefaultCustomFee
          },
          networkFeeOption: networkFeeOption,
          customNetworkFee: customNetworkFee
        }
        this.props.onSubmit(feeSettings, wallet.id, currencyCode)
        Actions.pop()
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

          <SwitchButton label={s.strings.settings_toggle_default_fee} value={this.state.isDefault} onChange={() => this.toggleDefaultFee()} />

          <PrimaryButton onPress={this.onSubmit} style={styles.saveButton}>
            <PrimaryButton.Text>{s.strings.save}</PrimaryButton.Text>
          </PrimaryButton>
        </ScrollView>
      </SceneWrapper>
    )
  }

  toggleDefaultFee = () => {
    this.setState(prevState => ({
      isDefault: !prevState.isDefault
    }))

    if (this.state.isDefault)
      // If saving default,
      this.setState(prevState => ({
        currentDefault: prevState.networkFeeOption // Set state's current default
      }))
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

  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  paddingRightIcon: {
    paddingLeft: '5%'
  },

  saveButton: {
    marginTop: THEME.rem(1.25)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

const updateDefaultFee = (feeSettings, currencyCode, dispatch) => {
  const currentDefault = feeSettings.defaultFeeSettings.currentDefault

  // Compare value of custom fee field to see if we need to update the custom default fee value
  let customFeeOutdated = false
  if (feeSettings.networkFeeOption === 'custom') {
    if (feeSettings.defaultFeeSettings.currentDefaultCustomFee.satPerByte !== feeSettings.customNetworkFee.satPerByte) customFeeOutdated = true
  }

  const outDated = currentDefault !== feeSettings.networkFeeOption || currentDefault === 'standard' || customFeeOutdated
  const currentlyOff = currentDefault === 'none'

  if (currencyCode) {
    if (outDated && feeSettings.defaultFeeSettings.isDefault) {
      // Set default fee
      dispatch(setDefaultFeeSetting(currencyCode, feeSettings.networkFeeOption, feeSettings.customNetworkFee))
    }
    if (!currentlyOff && !feeSettings.defaultFeeSettings.isDefault) {
      // Turn off default fee
      dispatch(setDefaultFeeSetting(currencyCode, 'none', feeSettings.customNetworkFee))
    }
  }
}

export const ChangeMiningFeeScene = connect(
  (state: RootState): StateProps => {
    return {
      networkFeeOption: getGuiMakeSpendInfo(state).networkFeeOption,
      customNetworkFee: getGuiMakeSpendInfo(state).customNetworkFee,
      currencySettings: state.ui.settings[state.ui.wallets.selectedCurrencyCode],
      spendTargets: getGuiMakeSpendInfo(state).spendTargets
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    onSubmit(feeSettings: FeeSettings, walletId: string, currencyCode?: string) {
      const networkFeeOption: FeeOption = feeSettings.networkFeeOption
      const customFee: Object = feeSettings.customNetworkFee

      updateDefaultFee(feeSettings, currencyCode, dispatch)

      dispatch(sendConfirmationUpdateTx({ networkFeeOption, customFee }))
    }
  })
)(ChangeMiningFee)
