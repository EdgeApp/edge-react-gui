// @flow

import { type EdgeCurrencyWallet, type EdgeSpendTarget } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import { connect } from 'react-redux'
import { type AirshipBridge } from 'react-native-airship'

import { FEE_STRINGS } from '../../constants/WalletAndCurrencyConstants.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import s from '../../locales/strings.js'
import { getGuiMakeSpendInfo } from '../../modules/UI/scenes/SendConfirmation/selectors.js'
import { type FeeOption } from '../../reducers/scenes/SendConfirmationReducer.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { showError } from '../services/AirshipInstance.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { PrimaryButton } from '../themed/ThemedButtons.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { EdgeText } from '../themed/EdgeText.js'
import { EdgeTextFieldOutlined } from '../themed/EdgeTextField'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import { FormError } from '../themed/FormError.js'

type OwnProps = {
  bridge: AirshipBridge<any>,
  wallet: EdgeCurrencyWallet,
  currencyCode?: string
}

type StateProps = {
  networkFeeOption?: FeeOption,
  customNetworkFee?: Object,
  spendTargets?: EdgeSpendTarget[]
}

type Props = OwnProps & StateProps & ThemeProps

type State = {
  networkFeeOption: FeeOption,
  customNetworkFee: Object,
  focusedInputMap: Object
}

class ChangeMiningFeeModalComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { networkFeeOption = 'standard', customNetworkFee = {} } = props
    const customFormat = this.getCustomFormat()

    if (customFormat != null && Object.keys(customNetworkFee).length !== customFormat.length) {
      // Reset the custom fees if they don't match the format:
      const defaultCustomFee = {}
      for (const key of customFormat) defaultCustomFee[key] = ''
      this.state = { networkFeeOption, customNetworkFee: defaultCustomFee, focusedInputMap: {} }
    } else {
      // Otherwise, use the custom fees from before:
      this.state = { networkFeeOption, customNetworkFee, focusedInputMap: {} }
    }
  }

  getCustomFormat(): string[] | void {
    const { wallet } = this.props

    if (wallet.currencyInfo.defaultSettings != null) {
      const { customFeeSettings } = wallet.currencyInfo.defaultSettings
      return customFeeSettings
    }
  }

  renderRadioRow(value: FeeOption, label: string) {
    const { networkFeeOption, focusedInputMap } = this.state
    const { theme } = this.props
    const styles = getStyles(theme)

    return (
      <TouchableWithoutFeedback onPress={() => this.setState({ networkFeeOption: value })}>
        <View style={styles.radioRow}>
          {networkFeeOption === value ?
            <SimpleLineIcons style={styles.radio} name="check" size={theme.rem(1.1)} color={theme.iconTappable} /> :
            <View style={[styles.radio, styles.unselected]} />
          }
          <EdgeText>{label}</EdgeText>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  renderCustomFee(customFormat: string[]): React.Node {
    const { networkFeeOption, customNetworkFee, focusedInputMap } = this.state
    const styles = getStyles(this.props.theme)

    if (networkFeeOption !== 'custom') return null

    return (
      <View style={styles.customArea}>
        {customFormat.map((key, index) => (
          <EdgeTextFieldOutlined
            key={key}
            keyboardType="numeric"
            label={FEE_STRINGS[key] || key}
            onChangeText={text =>
              this.setState({
                customNetworkFee: { ...customNetworkFee, [key]: text }
              })
            }
            value={customNetworkFee[key]}
            {...({ autoFocus: index === 1 })}
            onFocus={() =>
              this.setState({
                focusedInputMap: { [key]: true }
              })
            }
            onBlur={() =>
              this.setState({
                focusedInputMap: {}
              })
            }
            autoCorrect={false}
            autoCapitalize="none"
            onClear={() => {
              this.setState({
                customNetworkFee: { ...customNetworkFee, [key]: '' }
              })
            }}
            isClearable={!!focusedInputMap[key]}
            marginRem={[0, 1]}
            blurOnSubmit
            hideSearchIcon
        />
        ))}
      </View>
    )
  }

  onSubmit = async () => {
    const { networkFeeOption, customNetworkFee } = this.state
    const { currencyCode, wallet, spendTargets = [], bridge } = this.props
    const testSpendInfo = { spendTargets, networkFeeOption, customNetworkFee, currencyCode }
    try {
      await wallet.makeSpend(testSpendInfo)
      bridge.resolve({ networkFeeOption, customNetworkFee })
    } catch (error) {
      let message = error.message

      if (error.name === 'ErrorBelowMinimumFee') message = `${s.strings.invalid_custom_fee} ${message.message}`

      showError(message)
    }
  }

  render() {
    const { bridge, theme } = this.props
    const { networkFeeOption } = this.state
    const styles = getStyles(theme)
    const customFormat = this.getCustomFormat()

    return (
      <ThemedModal
        bridge={bridge}
        onCancel={() => bridge.resolve(undefined)}
        paddingRem={1}
      >
        <ModalTitle>{s.strings.title_change_mining_fee}</ModalTitle>
        <ScrollView style={styles.content}>
          {this.renderRadioRow('high', s.strings.mining_fee_high_label_choice)}
          {this.renderRadioRow('standard', s.strings.mining_fee_standard_label_choice)}
          {this.renderRadioRow('low', s.strings.mining_fee_low_label_choice)}
          {customFormat && <>
            {this.renderRadioRow('custom', s.strings.mining_fee_custom_label_choice)}
            {this.renderCustomFee(customFormat)}
          </>}
          <FormError isWarning isVisible={ ['custom', 'low'].includes(networkFeeOption)} numberOfLines={2}>{s.strings.warning_low_or_custom_fee}</FormError>
        </ScrollView>
        <PrimaryButton label={s.strings.save} onPress={this.onSubmit} marginRem={0.5} />
        <ModalCloseArrow onPress={() => bridge.resolve(undefined)} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flexGrow: 1,
    margin: theme.rem(0.5)
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(1)
  },
  radio: {
    marginRight: theme.rem(1),
  },
  unselected: {
    borderWidth: 1,
    borderRadius: theme.rem(0.55),
    borderColor: theme.icon,
    width: theme.rem(1.1),
    height: theme.rem(1.1)
  },
  customArea: {
    marginVertical: theme.rem(1.5)
  }
}))

export const ChangeMiningFeeModal = connect(
  (state: RootState): StateProps => ({
    networkFeeOption: getGuiMakeSpendInfo(state).networkFeeOption,
    customNetworkFee: getGuiMakeSpendInfo(state).customNetworkFee,
    spendTargets: getGuiMakeSpendInfo(state).spendTargets
  })
)(withTheme(ChangeMiningFeeModalComponent))
