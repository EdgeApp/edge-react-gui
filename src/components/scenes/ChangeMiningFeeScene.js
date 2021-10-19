// @flow

import { type JsonObject } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import Evilicons from 'react-native-vector-icons/EvilIcons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { FEE_STRINGS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { type FeeOption } from '../../types/types.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import Alert from '../themed/Alert'
import { MainButton } from '../themed/MainButton.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SceneHeader } from '../themed/SceneHeader'
import { SettingsRadioRow } from '../themed/SettingsRadioRow.js'

type OwnProps = {
  navigation: NavigationProp<'changeMiningFee'>,
  route: RouteProp<'changeMiningFee'>
}

type Props = OwnProps & ThemeProps

type State = {
  networkFeeOption: FeeOption,
  customNetworkFee: JsonObject
}

const feeOptions = {
  high: {
    text: s.strings.mining_fee_high_label_choice,
    icon: 'speedometer'
  },
  standard: {
    text: s.strings.mining_fee_standard_label_choice,
    icon: 'speedometer-medium'
  },
  low: {
    text: s.strings.mining_fee_low_label_choice,
    icon: 'speedometer-slow'
  }
}

export class ChangeMiningFeeComponent extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    const { networkFeeOption = 'standard', customNetworkFee = {} } = this.props.route.params.guiMakeSpendInfo
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
    const { navigation, route } = this.props
    const { guiMakeSpendInfo, wallet, maxSpendSet } = route.params
    const { currencyCode, spendTargets = [] } = guiMakeSpendInfo
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
        this.props.route.params.onSubmit(networkFeeOption, customNetworkFee)
        navigation.goBack()
      })
      .catch(e => {
        let message = e.message
        if (e.name === 'ErrorBelowMinimumFee') message = `${s.strings.invalid_custom_fee} ${e.message}`
        showError(message)
      })
  }

  render() {
    const { theme } = this.props

    const customFormat = this.getCustomFormat()
    const iconSize = theme.rem(1.25)
    const { networkFeeOption } = this.state

    return (
      <SceneWrapper background="theme" hasTabs={false} avoidKeyboard>
        <SceneHeader withTopMargin underline title={s.strings.title_change_mining_fee} />
        <ScrollView>
          {Object.keys(feeOptions).map(feeSetting => {
            return (
              <SettingsRadioRow
                icon={<MaterialCommunityIcons name={feeOptions[feeSetting].icon} size={iconSize} color={theme.iconTappable} />}
                key={feeOptions[feeSetting].text}
                text={feeOptions[feeSetting].text}
                value={networkFeeOption === feeSetting}
                onPress={() => this.setState({ networkFeeOption: feeSetting })}
              />
            )
          })}
          {customFormat != null ? (
            <SettingsRadioRow
              icon={<Evilicons name="gear" size={iconSize} color={theme.iconTappable} />}
              key={s.strings.mining_fee_custom_label_choice}
              text={s.strings.mining_fee_custom_label_choice}
              value={networkFeeOption === 'custom'}
              onPress={() => this.setState({ networkFeeOption: 'custom' })}
            />
          ) : null}
          {customFormat != null ? this.renderCustomFeeTextInput(customFormat) : null}
          {this.renderFeeWarning()}
          <MainButton alignSelf="center" label={s.strings.string_done_cap} marginRem={2} type="secondary" onPress={this.onSubmit} />
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderCustomFeeTextInput(customFormat: string[]): React.Node {
    const { theme } = this.props
    const styles = getStyles(theme)
    const { networkFeeOption, customNetworkFee } = this.state
    if (networkFeeOption !== 'custom') return null

    return (
      <View style={styles.view}>
        {customFormat.map(key => (
          <OutlinedTextInput
            autoFocus={false}
            key={key}
            autoCorrect={false}
            onChangeText={text =>
              this.setState({
                customNetworkFee: { ...customNetworkFee, [key]: text }
              })
            }
            value={customNetworkFee[key]}
            label={FEE_STRINGS[key] || key}
            returnKeyType="search"
            marginRem={[1.75, 1.75]}
            keyboardType="numeric"
          />
        ))}
      </View>
    )
  }

  renderFeeWarning() {
    const { networkFeeOption } = this.state
    const { theme } = this.props
    const styles = getStyles(theme)
    if (networkFeeOption !== 'custom' && networkFeeOption !== 'low') return null

    return (
      <View style={styles.view}>
        <Alert title={s.strings.warning_low_fee_selected} message={s.strings.warning_low_or_custom_fee} type="warning" marginRem={[1.5, 1]} />
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => {
  const iconSize = theme.rem(1.25)
  return {
    view: {
      flex: 1
    },
    currencyLogo: {
      height: iconSize,
      width: iconSize,
      resizeMode: 'contain'
    }
  }
})

export const ChangeMiningFeeScene = withTheme(ChangeMiningFeeComponent)
