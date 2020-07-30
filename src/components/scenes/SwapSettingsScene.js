// @flow

import { type EdgePluginMap, type EdgeSwapConfig } from 'edge-core-js/types'
import * as React from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'

import { ignoreAccountSwap, removePromotion } from '../../actions/AccountReferralActions.js'
import { setPreferredSwapPluginId } from '../../actions/SettingsActions.js'
import { getSwapPluginIcon } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { dayText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type AccountReferral } from '../../types/ReferralTypes.js'
import { type PluginTweak } from '../../types/TweakTypes.js'
import { bestOfPlugins } from '../../util/ReferralHelpers.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { SettingsRow } from '../common/SettingsRow.js'
import { SettingsSwitchRow } from '../common/SettingsSwitchRow.js'
import { SwapPreferredModal } from '../modals/SwapPreferredModal.js'
import { Airship } from '../services/AirshipInstance.js'

type DispatchProps = {
  changePreferredSwapPlugin(pluginId: string | void): void,
  ignoreAccountSwap(): void,
  removePromotion(installerId: string): void
}

type StateProps = {
  accountPlugins: PluginTweak[],
  accountReferral: AccountReferral,
  exchanges: EdgePluginMap<EdgeSwapConfig>,
  settingsPreferredSwap: string | void
}

type Props = StateProps & DispatchProps

type State = {
  enabled: { [pluginId: string]: boolean },
  needsActivation: { [pluginId: string]: boolean }
}

export class SwapSettings extends React.Component<Props, State> {
  cleanups: Array<() => mixed> = []
  sortedIds: Array<string>

  constructor(props: Props) {
    super(props)
    const { exchanges } = props

    this.state = { enabled: {}, needsActivation: {} }
    for (const pluginId in exchanges) {
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
    return (
      <SceneWrapper hasTabs={false} background="body">
        <ScrollView contentContainerStyle={{ paddingBottom: THEME.rem(4) }}>
          <View style={styles.instructionArea}>
            <Text style={styles.instructionText}>{s.strings.settings_exchange_instruction}</Text>
          </View>
          {this.sortedIds.map(pluginId => this.renderPlugin(pluginId))}
          <SettingsHeaderRow text={s.strings.swap_preferred_header} />
          {this.renderPreferredArea()}
        </ScrollView>
      </SceneWrapper>
    )
  }

  renderPlugin(pluginId: string) {
    const { exchanges } = this.props
    const { displayName } = exchanges[pluginId].swapInfo
    const logo = this.renderPluginIcon(pluginId)

    function handlePress() {
      const newValue = !exchanges[pluginId].enabled
      exchanges[pluginId].changeEnabled(newValue)
    }

    return <SettingsSwitchRow key={pluginId} icon={logo} text={displayName} value={this.state.enabled[pluginId]} onPress={handlePress} />
  }

  renderPluginIcon(pluginId: string): React.Node {
    const logoSource = getSwapPluginIcon(pluginId)
    return <Image resizeMode="contain" style={styles.swapIcon} source={logoSource} />
  }

  renderPreferredArea() {
    const { accountPlugins, exchanges, accountReferral, settingsPreferredSwap } = this.props

    // Pick plugin:
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, settingsPreferredSwap)
    const pluginId = activePlugins.preferredSwapPluginId
    const { swapSource } = activePlugins

    // Pick the instructions format:
    const { instructions, handlePress, right } =
      swapSource.type === 'promotion'
        ? {
            instructions: s.strings.swap_preferred_promo_instructions,
            handlePress: () => this.props.removePromotion(swapSource.installerId),
            right: <AntDesignIcon name="close" color={THEME.COLORS.GRAY_1} size={iconSize} style={styles.swapIcon} />
          }
        : {
            instructions: s.strings.swap_preferred_instructions,
            handlePress: this.handlePreferredModal,
            right: null
          }

    // Pick the selection row:
    const { text, icon } =
      pluginId != null && exchanges[pluginId] != null
        ? {
            text: exchanges[pluginId].swapInfo.displayName,
            icon: this.renderPluginIcon(pluginId)
          }
        : {
            text: s.strings.swap_preferred_cheapest,
            icon: <AntDesignIcon name="barschart" color={THEME.COLORS.GRAY_1} size={iconSize} style={styles.swapIcon} />
          }

    return (
      <>
        <View style={styles.instructionArea}>
          <Text style={styles.instructionText}>{instructions}</Text>
        </View>

        <SettingsRow icon={icon} text={text} onPress={handlePress} right={right} />
      </>
    )
  }
}

const iconSize = THEME.rem(1.375)

const rawStyles = {
  instructionArea: {
    backgroundColor: THEME.COLORS.GRAY_4,
    padding: THEME.rem(1)
  },
  instructionText: {
    ...dayText('center'),
    color: THEME.COLORS.GRAY_1
  },
  swapIcon: {
    height: iconSize,
    width: iconSize
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const SwapSettingsScene = connect(
  (state: ReduxState): StateProps => ({
    accountPlugins: state.account.referralCache.accountPlugins,
    accountReferral: state.account.accountReferral,
    exchanges: state.core.account.swapConfig,
    settingsPreferredSwap: state.ui.settings.preferredSwapPluginId
  }),
  (dispatch: Dispatch): DispatchProps => ({
    changePreferredSwapPlugin(pluginId) {
      dispatch(setPreferredSwapPluginId(pluginId))
    },
    ignoreAccountSwap() {
      dispatch(ignoreAccountSwap())
    },
    removePromotion(installerId: string) {
      dispatch(removePromotion(installerId))
    }
  })
)(SwapSettings)
