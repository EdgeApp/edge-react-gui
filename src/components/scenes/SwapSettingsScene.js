// @flow

import { type EdgePluginMap, type EdgeSwapConfig } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { ignoreAccountSwap, removePromotion } from '../../actions/AccountReferralActions.js'
import { setPreferredSwapPluginId } from '../../actions/SettingsActions.js'
import { getSwapPluginIconUri } from '../../constants/CdnConstants'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { type AccountReferral } from '../../types/ReferralTypes.js'
import { type PluginTweak } from '../../types/TweakTypes.js'
import { bestOfPlugins } from '../../util/ReferralHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SwapPreferredModal } from '../modals/SwapPreferredModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { SettingsHeaderRow } from '../themed/SettingsHeaderRow.js'
import { SettingsSwitchRow } from '../themed/SettingsSwitchRow.js'
import { SettingsTappableRow } from '../themed/SettingsTappableRow.js'

type DispatchProps = {
  changePreferredSwapPlugin: (pluginId: string | void) => void,
  ignoreAccountSwap: () => void,
  removePromotion: (installerId: string) => Promise<void>
}

type StateProps = {
  accountPlugins: PluginTweak[],
  accountReferral: AccountReferral,
  exchanges: EdgePluginMap<EdgeSwapConfig>,
  settingsPreferredSwap: string | void
}

type Props = StateProps & DispatchProps & ThemeProps

type State = {
  enabled: { [pluginId: string]: boolean },
  needsActivation: { [pluginId: string]: boolean }
}

export class SwapSettings extends React.Component<Props, State> {
  cleanups: Array<() => mixed> = []
  sortedIds: string[]

  constructor(props: Props) {
    super(props)
    const { exchanges } = props

    this.state = { enabled: {}, needsActivation: {} }
    for (const pluginId of Object.keys(exchanges)) {
      const exchange = exchanges[pluginId]
      this.state.enabled[pluginId] = exchange.enabled
      this.state.needsActivation[pluginId] = exchange.needsActivation

      this.cleanups.push(
        exchange.watch('enabled', enabled =>
          this.setState(state => ({
            enabled: { ...state.enabled, [pluginId]: enabled }
          }))
        )
      )
      this.cleanups.push(
        exchange.watch('needsActivation', needsActivation =>
          this.setState(state => ({
            needsActivation: { ...state.needsActivation, [pluginId]: needsActivation }
          }))
        )
      )
    }

    const exchangeIds = Object.keys(exchanges).filter(id => id !== 'transfer')
    this.sortedIds = exchangeIds.sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))
  }

  componentWillUnmount() {
    for (const cleanup of this.cleanups) cleanup()
  }

  handlePreferredModal = () => {
    const { accountPlugins, changePreferredSwapPlugin, exchanges, ignoreAccountSwap, accountReferral, settingsPreferredSwap } = this.props

    // Pick plugin:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, settingsPreferredSwap)
    const pluginId = activePlugins.preferredSwapPluginId

    Airship.show(bridge => <SwapPreferredModal bridge={bridge} exchanges={exchanges} selected={pluginId} />).then(result => {
      if (result.type === 'cancel') return
      if (activePlugins.swapSource.type === 'account') ignoreAccountSwap()
      changePreferredSwapPlugin(result.pluginId)
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
          {this.sortedIds.map(pluginId => this.renderPlugin(pluginId))}
          <SettingsHeaderRow label={s.strings.swap_preferred_header} />
          {this.renderPreferredArea()}
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderPlugin(pluginId: string) {
    const { exchanges } = this.props
    const { displayName } = exchanges[pluginId].swapInfo

    return (
      <SettingsSwitchRow
        key={pluginId}
        label={displayName}
        value={this.state.enabled[pluginId]}
        onPress={async () => {
          const newValue = !exchanges[pluginId].enabled
          await exchanges[pluginId].changeEnabled(newValue)
        }}
      >
        {this.renderPluginIcon(pluginId)}
      </SettingsSwitchRow>
    )
  }

  renderPluginIcon(pluginId: string): React.Node {
    const { theme } = this.props
    const logoSource = getSwapPluginIconUri(pluginId, theme)
    const styles = getStyles(theme)
    return <FastImage resizeMode="contain" style={styles.swapIcon} source={{ uri: logoSource }} />
  }

  renderPreferredArea() {
    const { accountPlugins, exchanges, accountReferral, settingsPreferredSwap, theme } = this.props
    const styles = getStyles(theme)
    const iconSize = theme.rem(1.25)

    // Pick plugin:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, settingsPreferredSwap)
    const pluginId = activePlugins.preferredSwapPluginId
    const { swapSource } = activePlugins

    // Pick the plugin description:
    const { label, icon } =
      pluginId != null && exchanges[pluginId] != null
        ? {
            label: exchanges[pluginId].swapInfo.displayName,
            icon: this.renderPluginIcon(pluginId)
          }
        : {
            label: s.strings.swap_preferred_cheapest,
            icon: <AntDesignIcon name="barschart" color={theme.icon} size={iconSize} style={styles.swapIcon} />
          }

    // If a promo controls the swap plugin, provide a disable option:
    if (swapSource.type === 'promotion') {
      return (
        <>
          <View style={styles.instructionArea}>
            <Text style={styles.instructionText}>{s.strings.swap_preferred_promo_instructions}</Text>
          </View>
          <SettingsTappableRow action="delete" label={label} onPress={() => this.props.removePromotion(swapSource.installerId)}>
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
  }
}))

export const SwapSettingsScene = connect<StateProps, DispatchProps, ThemeProps>(
  state => ({
    accountPlugins: state.account.referralCache.accountPlugins,
    accountReferral: state.account.accountReferral,
    exchanges: state.core.account.swapConfig,
    settingsPreferredSwap: state.ui.settings.preferredSwapPluginId
  }),
  dispatch => ({
    changePreferredSwapPlugin(pluginId) {
      dispatch(setPreferredSwapPluginId(pluginId))
    },
    ignoreAccountSwap() {
      dispatch(ignoreAccountSwap())
    },
    async removePromotion(installerId: string) {
      await dispatch(removePromotion(installerId))
    }
  })
)(withTheme(SwapSettings))
