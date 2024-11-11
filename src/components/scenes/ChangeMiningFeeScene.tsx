import { EdgeCurrencyWallet, EdgeSpendInfo, EdgeTokenId, JsonObject } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, View } from 'react-native'
import Evilicons from 'react-native-vector-icons/EvilIcons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { FEE_STRINGS } from '../../constants/WalletAndCurrencyConstants'
import { useIconColor } from '../../hooks/useIconColor'
import { lstrings } from '../../locales/strings'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { FeeOption } from '../../types/types'
import { darkenHexColor } from '../../util/utils'
import { AccentColors } from '../common/DotsBackground'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { SettingsRadioRow } from '../settings/SettingsRadioRow'
import { Alert } from '../themed/Alert'
import { FilledTextInput } from '../themed/FilledTextInput'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'

export interface ChangeMiningFeeParams {
  maxSpendSet: boolean
  spendInfo: EdgeSpendInfo
  tokenId: EdgeTokenId
  walletId: string
  onSubmit: (networkFeeOption: FeeOption, customNetworkFee: JsonObject) => void
}

interface OwnProps extends EdgeAppSceneProps<'changeMiningFee2'> {
  wallet: EdgeCurrencyWallet
}

interface HookProps {
  iconColor?: string
}

type Props = OwnProps & ThemeProps

interface State {
  networkFeeOption: FeeOption
  customNetworkFee: JsonObject
}

const feeOptions = {
  high: {
    text: lstrings.mining_fee_high_label_choice,
    icon: 'speedometer'
  },
  standard: {
    text: lstrings.mining_fee_standard_label_choice,
    icon: 'speedometer-medium'
  },
  low: {
    text: lstrings.mining_fee_low_label_choice,
    icon: 'speedometer-slow'
  }
}

export class ChangeMiningFeeComponent extends React.PureComponent<Props & HookProps, State> {
  constructor(props: Props) {
    super(props)
    const { networkFeeOption = 'standard', customNetworkFee = {} } = this.props.route.params.spendInfo
    const customFormat = this.getCustomFormat()

    if (customFormat != null && Object.keys(customNetworkFee).length !== customFormat.length) {
      // Reset the custom fees if they don't match the format:
      const defaultCustomFee = {}
      // @ts-expect-error
      for (const key of customFormat) defaultCustomFee[key] = ''
      this.state = { networkFeeOption, customNetworkFee: defaultCustomFee }
    } else {
      // Otherwise, use the custom fees from before:
      this.state = { networkFeeOption, customNetworkFee }
    }
  }

  getCustomFormat(): Array<keyof typeof FEE_STRINGS> | undefined {
    const { wallet } = this.props
    if (wallet.currencyInfo.defaultSettings != null) {
      const { customFeeSettings } = wallet.currencyInfo.defaultSettings
      return customFeeSettings
    }
  }

  onSubmit = () => {
    const { networkFeeOption, customNetworkFee } = this.state
    const { navigation, route } = this.props
    route.params.onSubmit(networkFeeOption, customNetworkFee)
    navigation.goBack()
  }

  render() {
    const { iconColor, theme } = this.props
    const styles = getStyles(theme)

    const customFormat = this.getCustomFormat()
    const { networkFeeOption } = this.state

    const accentColors: AccentColors = {
      // Transparent fallback for while iconColor is loading
      iconAccentColor: iconColor ?? '#00000000'
    }

    const backgroundColors = [...theme.assetBackgroundGradientColors]
    if (iconColor != null) {
      const scaledColor = darkenHexColor(iconColor, theme.assetBackgroundColorScale)
      backgroundColors[0] = scaledColor
    }

    return (
      <SceneWrapper
        accentColors={accentColors}
        avoidKeyboard
        backgroundGradientColors={backgroundColors}
        backgroundGradientEnd={theme.assetBackgroundGradientEnd}
        backgroundGradientStart={theme.assetBackgroundGradientStart}
        overrideDots={theme.backgroundDots.assetOverrideDots}
      >
        <SceneHeader title={lstrings.title_change_mining_fee} underline withTopMargin />
        <ScrollView contentContainerStyle={styles.container} scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
          {Object.keys(feeOptions).map(feeSetting => {
            return (
              <SettingsRadioRow
                // @ts-expect-error
                key={feeOptions[feeSetting].text}
                // @ts-expect-error
                label={feeOptions[feeSetting].text}
                value={networkFeeOption === feeSetting}
                // @ts-expect-error
                onPress={() => this.setState({ networkFeeOption: feeSetting })}
              >
                <MaterialCommunityIcons
                  // @ts-expect-error
                  name={feeOptions[feeSetting].icon}
                  style={styles.settingsIcon}
                />
              </SettingsRadioRow>
            )
          })}
          {customFormat != null ? (
            <SettingsRadioRow
              key={lstrings.mining_fee_custom_label_choice}
              label={lstrings.mining_fee_custom_label_choice}
              value={networkFeeOption === 'custom'}
              onPress={() => this.setState({ networkFeeOption: 'custom' })}
            >
              <Evilicons name="gear" style={styles.settingsIcon} />
            </SettingsRadioRow>
          ) : null}
          {customFormat != null ? this.renderCustomFeeTextInput(customFormat) : null}
          {this.renderFeeWarning()}
          <MainButton label={lstrings.string_done_cap} marginRem={[4, 0, 2]} type="secondary" onPress={this.onSubmit} />
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderCustomFeeTextInput(customFormat: Array<keyof typeof FEE_STRINGS>) {
    const { networkFeeOption, customNetworkFee } = this.state
    if (networkFeeOption !== 'custom') return null

    return (
      <>
        {customFormat.map(key => (
          <FilledTextInput
            aroundRem={1}
            key={key}
            autoFocus={false}
            autoCorrect={false}
            onChangeText={text =>
              this.setState({
                customNetworkFee: { ...customNetworkFee, [key]: text }
              })
            }
            value={customNetworkFee[key]}
            placeholder={FEE_STRINGS[key] || key}
            returnKeyType="done"
            keyboardType="numeric"
          />
        ))}
      </>
    )
  }

  renderFeeWarning() {
    const { networkFeeOption } = this.state
    const { theme } = this.props
    const styles = getStyles(theme)
    if (networkFeeOption !== 'custom' && networkFeeOption !== 'low') return null
    const title = networkFeeOption === 'custom' ? lstrings.warning_custom_fee_selected : lstrings.warning_low_fee_selected

    return (
      <View style={styles.view}>
        <Alert title={title} message={lstrings.warning_low_or_custom_fee} type="warning" marginRem={[1.5, 1]} />
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => {
  const iconSize = theme.rem(1.25)
  return {
    container: {
      paddingTop: theme.rem(0.5)
    },
    view: {
      flex: 1
    },
    currencyLogo: {
      height: iconSize,
      width: iconSize,
      resizeMode: 'contain'
    },
    settingsIcon: {
      color: theme.iconTappable,
      fontSize: theme.rem(1.25),
      paddingHorizontal: theme.rem(0.5)
    }
  }
})

const ChangeMiningFeeSceneThemed = withTheme(ChangeMiningFeeComponent)

export const ChangeMiningFeeScene = withWallet((props: OwnProps) => {
  const { route, wallet } = props
  const { tokenId } = route.params
  const { pluginId } = wallet.currencyInfo

  const iconColor = useIconColor({ pluginId, tokenId })
  return <ChangeMiningFeeSceneThemed {...props} iconColor={iconColor} />
})
