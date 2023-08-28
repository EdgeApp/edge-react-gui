import { EdgePluginMap, EdgeSwapConfig, EdgeSwapPluginType } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { CallbackRemover } from 'yaob'

import { ignoreAccountSwap, removePromotion } from '../../actions/AccountReferralActions'
import { setPreferredSwapPluginId, setPreferredSwapPluginType } from '../../actions/SettingsActions'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { AccountReferral } from '../../types/ReferralTypes'
import { EdgeSceneProps } from '../../types/routerTypes'
import { PluginTweak } from '../../types/TweakTypes'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { bestOfPlugins } from '../../util/ReferralHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { RadioListModal } from '../modals/RadioListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsSubHeader } from '../settings/SettingsSubHeader'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'

interface OwnProps extends EdgeSceneProps<'exchangeSettings'> {}

interface DispatchProps {
  changePreferredSwapPlugin: (pluginId: string | undefined) => void
  changePreferredSwapPluginType: (swapPluginType: EdgeSwapPluginType | undefined) => void
  ignoreAccountSwap: () => Promise<void>
  removePromotion: (installerId: string) => Promise<void>
}

interface StateProps {
  accountPlugins: PluginTweak[]
  accountReferral: AccountReferral
  swapConfigs: EdgePluginMap<EdgeSwapConfig>
  settingsPreferredSwap: string | undefined
  settingsPreferredSwapType: EdgeSwapPluginType | undefined
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface State {
  enabled: { [pluginId: string]: boolean }
}

export class SwapSettings extends React.Component<Props, State> {
  sortedCexIds: string[]
  sortedDexIds: string[]
  swapConfigUnsubscribeFns: CallbackRemover[] = []

  constructor(props: Props) {
    super(props)
    const { swapConfigs } = props

    this.state = { enabled: {} }
    for (const pluginId of Object.keys(swapConfigs)) {
      const exchange = swapConfigs[pluginId]
      this.state.enabled[pluginId] = exchange.enabled
    }

    const exchangeIds = Object.keys(swapConfigs).filter(id => id !== 'transfer')
    const cexIds = exchangeIds.filter(id => swapConfigs[id].swapInfo.isDex !== true)
    const dexIds = exchangeIds.filter(id => swapConfigs[id].swapInfo.isDex === true)
    this.sortedCexIds = cexIds.sort((a, b) => swapConfigs[a].swapInfo.displayName.localeCompare(swapConfigs[b].swapInfo.displayName))
    this.sortedDexIds = dexIds.sort((a, b) => swapConfigs[a].swapInfo.displayName.localeCompare(swapConfigs[b].swapInfo.displayName))
  }

  async componentWillUnmount() {
    this.swapConfigUnsubscribeFns.forEach(unsubscribe => unsubscribe())
    this.swapConfigUnsubscribeFns = []
  }

  componentDidMount(): void {
    const { swapConfigs } = this.props
    this.swapConfigUnsubscribeFns = []
    for (const pluginId of Object.keys(swapConfigs)) {
      const unsubscribe = swapConfigs[pluginId].watch('enabled', pluginEnabled => {
        this.setState({ enabled: { ...this.state.enabled, [pluginId]: pluginEnabled } })
      })
      this.swapConfigUnsubscribeFns.push(unsubscribe)
    }
  }

  handlePreferredModal = () => {
    const {
      accountPlugins,
      changePreferredSwapPlugin,
      changePreferredSwapPluginType,
      swapConfigs,
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
      selected = lstrings.swap_preferred_dex
    } else if (settingsPreferredSwapType === 'CEX') {
      selected = lstrings.swap_preferred_cex
    } else {
      selected = swapConfigs[selectedPluginId] != null ? swapConfigs[selectedPluginId].swapInfo.displayName : lstrings.swap_preferred_cheapest
    }

    // Process Items
    const cexItems = Object.keys(swapConfigs)
      .filter(pluginId => swapConfigs[pluginId].swapInfo.isDex !== true)
      .sort((a, b) => swapConfigs[a].swapInfo.displayName.localeCompare(swapConfigs[b].swapInfo.displayName))

    const dexItems = Object.keys(swapConfigs)
      .filter(pluginId => swapConfigs[pluginId].swapInfo.isDex === true)
      .sort((a, b) => swapConfigs[a].swapInfo.displayName.localeCompare(swapConfigs[b].swapInfo.displayName))

    const exchangeItems = [...dexItems, ...cexItems]
      // const exchangeItems = [...cexItems, ...dexItems]
      .filter(pluginId => swapConfigs[pluginId].enabled && pluginId !== 'transfer')
      .map(pluginId => ({
        name: swapConfigs[pluginId].swapInfo.displayName,
        icon: getSwapPluginIconUri(pluginId, theme)
      }))

    const preferCheapest = {
      name: lstrings.swap_preferred_cheapest,
      icon: <AntDesignIcon name="barschart" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
    }

    const preferDex = {
      name: lstrings.swap_preferred_dex,
      icon: <Feather name="globe" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
    }

    const preferCex = {
      name: lstrings.swap_preferred_cex,
      icon: <MaterialCommunityIcons name="bank-outline" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
    }

    // Render
    Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title={lstrings.swap_preferred_header}
        items={[preferCheapest, preferDex, preferCex, ...exchangeItems]}
        selected={selected}
      />
    ))
      .then(async result => {
        if (result == null) return

        // Cancel any active promotions:
        if (activePlugins.swapSource.type === 'account') await ignoreAccountSwap()

        // Apply the user's choice:
        if (result === preferDex.name) {
          changePreferredSwapPluginType('DEX')
        } else if (result === preferCex.name) {
          changePreferredSwapPluginType('CEX')
        } else {
          changePreferredSwapPlugin(Object.keys(swapConfigs).find(pluginId => swapConfigs[pluginId].swapInfo.displayName === result))
        }
      })
      .catch(err => showError(err))
  }

  render() {
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <ScrollView contentContainerStyle={{ paddingBottom: this.props.theme.rem(4) }}>
          <SettingsSubHeader label={lstrings.settings_exchange_instruction} />
          <SettingsHeaderRow label={lstrings.swap_options_header_decentralized} />
          {this.sortedDexIds.map(pluginId => this.renderPlugin(pluginId))}
          <SettingsHeaderRow label={lstrings.swap_options_header_centralized} />
          {this.sortedCexIds.map(pluginId => this.renderPlugin(pluginId))}
          <SettingsHeaderRow label={lstrings.swap_preferred_header} />
          {this.renderPreferredArea()}
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderPlugin(pluginId: string) {
    const { swapConfigs } = this.props
    const { displayName } = swapConfigs[pluginId].swapInfo
    const pluginEnabled = this.state.enabled[pluginId]

    return (
      <SettingsSwitchRow
        key={pluginId}
        label={displayName}
        value={pluginEnabled}
        onPress={async () => {
          this.setState({ enabled: { ...this.state.enabled, [pluginId]: !pluginEnabled } })
          await swapConfigs[pluginId].changeEnabled(!pluginEnabled)
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
    const { accountPlugins, swapConfigs, accountReferral, settingsPreferredSwap, settingsPreferredSwapType, theme } = this.props
    const styles = getStyles(theme)
    const iconSize = theme.rem(1.25)

    // Pick plugin:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, settingsPreferredSwap)
    const pluginId = activePlugins.preferredSwapPluginId
    const { swapSource } = activePlugins

    // Pick the plugin description:
    let { label, icon } =
      pluginId != null && swapConfigs[pluginId] != null
        ? {
            label: swapConfigs[pluginId].swapInfo.displayName,
            icon: this.renderPluginIcon(pluginId)
          }
        : {
            label: lstrings.swap_preferred_cheapest,
            icon: <AntDesignIcon name="barschart" color={theme.icon} size={iconSize} style={styles.swapIcon} />
          }

    if (settingsPreferredSwapType != null) {
      if (settingsPreferredSwapType === 'DEX') {
        label = lstrings.swap_preferred_dex
        icon = <Feather name="globe" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
      } else if (settingsPreferredSwapType === 'CEX') {
        label = lstrings.swap_preferred_cex
        icon = <MaterialCommunityIcons name="bank-outline" color={theme.icon} size={theme.rem(1.25)} style={styles.swapExchangeIcon} />
      }
    }

    // If a promo controls the swap plugin, provide a disable option:
    if (swapSource.type === 'promotion') {
      return (
        <>
          <SettingsSubHeader label={lstrings.swap_preferred_promo_instructions} />
          <SettingsTappableRow action="delete" label={label} onPress={async () => await this.props.removePromotion(swapSource.installerId)}>
            {icon}
          </SettingsTappableRow>
        </>
      )
    }

    return (
      <>
        <SettingsSubHeader label={lstrings.swap_preferred_instructions} />
        <SettingsTappableRow label={label} onPress={this.handlePreferredModal}>
          {icon}
        </SettingsTappableRow>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
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

export const SwapSettingsScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    accountPlugins: state.account.referralCache.accountPlugins,
    accountReferral: state.account.accountReferral,
    swapConfigs: state.core.account.swapConfig,
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
    async ignoreAccountSwap() {
      await dispatch(ignoreAccountSwap())
    },
    async removePromotion(installerId: string) {
      await dispatch(removePromotion(installerId))
    }
  })
)(withTheme(SwapSettings))
