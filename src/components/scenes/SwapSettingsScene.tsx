import { EdgePluginMap, EdgeSwapConfig, EdgeSwapPluginType } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'

import { ignoreAccountSwap, removePromotion } from '../../actions/AccountReferralActions'
import { setPreferredSwapPluginId, setPreferredSwapPluginType } from '../../actions/SettingsActions'
import s from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { AccountReferral } from '../../types/ReferralTypes'
import { PluginTweak } from '../../types/TweakTypes'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { bestOfPlugins } from '../../util/ReferralHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { RadioListModal } from '../modals/RadioListModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow'
import { SettingsTappableRow } from '../themed/SettingsTappableRow'

interface DispatchProps {
  changePreferredSwapPlugin: (pluginId: string | undefined) => void
  changePreferredSwapPluginType: (swapPluginType: EdgeSwapPluginType | undefined) => void
  ignoreAccountSwap: () => void
  removePromotion: (installerId: string) => Promise<void>
}

interface StateProps {
  accountPlugins: PluginTweak[]
  accountReferral: AccountReferral
  exchanges: EdgePluginMap<EdgeSwapConfig>
  settingsPreferredSwap: string | undefined
  settingsPreferredSwapType: EdgeSwapPluginType | undefined
}

type Props = StateProps & DispatchProps & ThemeProps

interface State {
  enabled: { [pluginId: string]: boolean }
}

export class SwapSettings extends React.Component<Props, State> {
  sortedCexIds: string[]
  sortedDexIds: string[]

  constructor(props: Props) {
    super(props)
    const { exchanges } = props

    this.state = { enabled: {} }
    for (const pluginId of Object.keys(exchanges)) {
      const exchange = exchanges[pluginId]
      this.state.enabled[pluginId] = exchange.enabled
    }

    const exchangeIds = Object.keys(exchanges).filter(id => id !== 'transfer')
    const cexIds = exchangeIds.filter(id => exchanges[id].swapInfo.isDex !== true)
    const dexIds = exchangeIds.filter(id => exchanges[id].swapInfo.isDex === true)
    this.sortedCexIds = cexIds.sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))
    this.sortedDexIds = dexIds.sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))
  }

  async componentWillUnmount() {
    const { exchanges } = this.props
    for (const pluginId of Object.keys(exchanges)) {
      if (exchanges[pluginId].enabled !== this.state.enabled[pluginId]) {
        // This method updates the same file so we have to save updates one at a time
        await exchanges[pluginId].changeEnabled(this.state.enabled[pluginId])
      }
    }
  }

  handlePreferredModal = () => {
    const {
      accountPlugins,
      changePreferredSwapPlugin,
      changePreferredSwapPluginType,
      exchanges,
      ignoreAccountSwap,
      accountReferral,
      settingsPreferredSwap,
      settingsPreferredSwapType,
      theme
    } = this.props
    const styles = getStyles(this.props.theme)

    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, settingsPreferredSwap)

    // Selected Exchange
    const selectedPluginId = activePlugins.preferredSwapPluginId ?? ''

    let selected: string
    if (settingsPreferredSwapType === 'DEX') {
      selected = s.strings.swap_preferred_dex
    } else if (settingsPreferredSwapType === 'CEX') {
      selected = s.strings.swap_preferred_cex
    } else {
      selected = exchanges[selectedPluginId] != null ? exchanges[selectedPluginId].swapInfo.displayName : s.strings.swap_preferred_cheapest
    }

    // Process Items
    const cexItems = Object.keys(exchanges)
      .filter(pluginId => exchanges[pluginId].swapInfo.isDex !== true)
      .sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))

    const dexItems = Object.keys(exchanges)
      .filter(pluginId => exchanges[pluginId].swapInfo.isDex === true)
      .sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))

    const exchangeItems = [...dexItems, ...cexItems]
      // const exchangeItems = [...cexItems, ...dexItems]
      .filter(pluginId => exchanges[pluginId].enabled && pluginId !== 'transfer')
      .map(pluginId => ({
        name: exchanges[pluginId].swapInfo.displayName,
        icon: getSwapPluginIconUri(pluginId, theme)
      }))

    const preferCheapest = {
      name: s.strings.swap_preferred_cheapest,
      icon: <AntDesignIcon name="barschart" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
    }

    const preferDex = {
      name: s.strings.swap_preferred_dex,
      icon: <Feather name="globe" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
    }

    const preferCex = {
      name: s.strings.swap_preferred_cex,
      icon: <MaterialCommunityIcons name="bank-outline" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
    }

    // Render
    Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title={s.strings.swap_preferred_header}
        items={[preferCheapest, preferDex, preferCex, ...exchangeItems]}
        selected={selected}
      />
    )).then(result => {
      if (result == null) return
      if (activePlugins.swapSource.type === 'account') ignoreAccountSwap()
      if (result === preferDex.name) {
        changePreferredSwapPluginType('DEX')
      } else if (result === preferCex.name) {
        changePreferredSwapPluginType('CEX')
      } else {
        changePreferredSwapPlugin(Object.keys(exchanges).find(pluginId => exchanges[pluginId].swapInfo.displayName === result))
      }
    })
  }

  render() {
    const styles = getStyles(this.props.theme)
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <ScrollView contentContainerStyle={{ paddingBottom: this.props.theme.rem(4) }}>
          <View style={styles.instructionArea}>
            <Text style={styles.instructionText}>{s.strings.settings_exchange_instruction}</Text>
          </View>
          <SettingsHeaderRow label={s.strings.swap_options_header_decentralized} />
          {this.sortedDexIds.map(pluginId => this.renderPlugin(pluginId))}
          <SettingsHeaderRow label={s.strings.swap_options_header_centralized} />
          {this.sortedCexIds.map(pluginId => this.renderPlugin(pluginId))}
          <SettingsHeaderRow label={s.strings.swap_preferred_header} />
          {this.renderPreferredArea()}
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderPlugin(pluginId: string) {
    const { exchanges } = this.props
    const { displayName } = exchanges[pluginId].swapInfo
    const pluginEnabled = this.state.enabled[pluginId]

    return (
      <SettingsSwitchRow
        key={pluginId}
        label={displayName}
        value={pluginEnabled}
        onPress={async () => {
          this.setState({ enabled: { ...this.state.enabled, [pluginId]: !pluginEnabled } })
        }}
      >
        {this.renderPluginIcon(pluginId)}
      </SettingsSwitchRow>
    )
  }

  renderPluginIcon(pluginId: string) {
    const { theme } = this.props
    const logoSource = getSwapPluginIconUri(pluginId, theme)
    const styles = getStyles(theme)
    return <FastImage resizeMode="contain" style={styles.swapIcon} source={{ uri: logoSource }} />
  }

  renderPreferredArea() {
    const { accountPlugins, exchanges, accountReferral, settingsPreferredSwap, settingsPreferredSwapType, theme } = this.props
    const styles = getStyles(theme)
    const iconSize = theme.rem(1.25)

    // Pick plugin:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, settingsPreferredSwap)
    const pluginId = activePlugins.preferredSwapPluginId
    const { swapSource } = activePlugins

    // Pick the plugin description:
    let { label, icon } =
      pluginId != null && exchanges[pluginId] != null
        ? {
            label: exchanges[pluginId].swapInfo.displayName,
            icon: this.renderPluginIcon(pluginId)
          }
        : {
            label: s.strings.swap_preferred_cheapest,
            icon: <AntDesignIcon name="barschart" color={theme.icon} size={iconSize} style={styles.swapIcon} />
          }

    if (settingsPreferredSwapType != null) {
      if (settingsPreferredSwapType === 'DEX') {
        label = s.strings.swap_preferred_dex
        icon = <Feather name="globe" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
      } else if (settingsPreferredSwapType === 'CEX') {
        label = s.strings.swap_preferred_cex
        icon = <MaterialCommunityIcons name="bank-outline" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
      }
    }

    // If a promo controls the swap plugin, provide a disable option:
    if (swapSource.type === 'promotion') {
      return (
        <>
          <View style={styles.instructionArea}>
            <Text style={styles.instructionText}>{s.strings.swap_preferred_promo_instructions}</Text>
          </View>
          <SettingsTappableRow action="delete" label={label} onPress={async () => this.props.removePromotion(swapSource.installerId)}>
            {icon}
          </SettingsTappableRow>
        </>
      )
    }

    return (
      <>
        <View style={styles.instructionArea}>
          <Text style={styles.instructionText}>{s.strings.swap_preferred_instructions}</Text>
        </View>
        <SettingsTappableRow label={label} onPress={this.handlePreferredModal}>
          {icon}
        </SettingsTappableRow>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  instructionArea: {
    backgroundColor: theme.settingsRowSubHeader,
    padding: theme.rem(1)
  },
  instructionText: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.primaryText
  },
  swapIcon: {
    height: theme.rem(1.25),
    width: theme.rem(1.25),
    marginHorizontal: theme.rem(0.5)
  },
  swapExchangeIcon: {
    height: theme.rem(1.25),
    width: theme.rem(1.25)
  }
}))

export const SwapSettingsScene = connect<StateProps, DispatchProps, ThemeProps>(
  state => ({
    accountPlugins: state.account.referralCache.accountPlugins,
    accountReferral: state.account.accountReferral,
    exchanges: state.core.account.swapConfig,
    settingsPreferredSwap: state.ui.settings.preferredSwapPluginId,
    settingsPreferredSwapType: state.ui.settings.preferredSwapPluginType
  }),
  dispatch => ({
    changePreferredSwapPlugin(pluginId) {
      dispatch(setPreferredSwapPluginId(pluginId))
    },
    changePreferredSwapPluginType(swapPluginType) {
      dispatch(setPreferredSwapPluginType(swapPluginType))
    },
    ignoreAccountSwap() {
      dispatch(ignoreAccountSwap())
    },
    async removePromotion(installerId: string) {
      await dispatch(removePromotion(installerId))
    }
  })
)(withTheme(SwapSettings))
