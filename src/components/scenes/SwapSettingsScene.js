// @flow

import { type EdgePluginMap, type EdgeSwapConfig } from 'edge-core-js/types'
import React, { type Node, Component, Fragment } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import CookieManager from 'react-native-cookies'
import { Actions } from 'react-native-router-flux'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'

import { removeCreationSwapPlugin } from '../../actions/CreationReasonActions.js'
import { setPreferredSwapPluginId } from '../../actions/SettingsActions.js'
import { deactivateShapeShift } from '../../actions/ShapeShiftActions.js'
import { getSwapPluginIcon } from '../../assets/images/exchange'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { getCreationTweaks } from '../../selectors/AccountSelectors.js'
import { dayText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type AppTweaks, getActivePlugins } from '../../types/AppTweaks.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SettingsHeaderRow } from '../common/SettingsHeaderRow.js'
import { SettingsLabelRow } from '../common/SettingsLabelRow.js'
import { SettingsRow } from '../common/SettingsRow.js'
import { SettingsSwitchRow } from '../common/SettingsSwitchRow.js'
import { SwapPreferredModal } from '../modals/SwapPreferredModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'

type DispatchProps = {
  changePreferredSwapPlugin(pluginId: string | void): void,
  shapeShiftLogOut(): void,
  removeCreationSwapPlugin(): void
}

type StateProps = {
  creationTweaks: AppTweaks,
  exchanges: EdgePluginMap<EdgeSwapConfig>,
  preferredSwapPluginId: string | void
}

type Props = StateProps & DispatchProps

type State = {
  enabled: { [pluginId: string]: boolean },
  needsActivation: { [pluginId: string]: boolean }
}

export class SwapSettings extends Component<Props, State> {
  cleanups: Array<() => mixed> = []
  sortedIds: Array<string>

  constructor (props: Props) {
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

    this.sortedIds = Object.keys(exchanges).sort((a, b) => exchanges[a].swapInfo.displayName.localeCompare(exchanges[b].swapInfo.displayName))
  }

  componentWillUnmount () {
    for (const cleanup of this.cleanups) cleanup()
  }

  shapeShiftSignInToggle = () => {
    if (this.state.needsActivation.shapeshift) {
      CookieManager.clearAll()
        .catch(showError)
        .then(() => Actions[Constants.SWAP_ACTIVATE_SHAPESHIFT]())
    } else {
      this.props.shapeShiftLogOut()
    }
  }

  handlePreferredModal = () => {
    const { changePreferredSwapPlugin, creationTweaks, exchanges, preferredSwapPluginId, removeCreationSwapPlugin } = this.props

    // Pick plugin:
    const activePlugins = getActivePlugins(creationTweaks, preferredSwapPluginId)
    const pluginId = activePlugins.preferredSwapPluginId

    Airship.show(bridge => <SwapPreferredModal bridge={bridge} exchanges={exchanges} selected={pluginId} />).then(result => {
      if (result.type === 'cancel') return
      if (activePlugins.preferredSwapSource === 'creation') removeCreationSwapPlugin()
      changePreferredSwapPlugin(result.pluginId)
    })
  }

  render () {
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

  renderPlugin (pluginId: string) {
    const { exchanges } = this.props
    const { displayName } = exchanges[pluginId].swapInfo
    const logo = this.renderPluginIcon(pluginId)

    function handlePress () {
      const newValue = !exchanges[pluginId].enabled
      exchanges[pluginId].changeEnabled(newValue)
    }

    const toggle = <SettingsSwitchRow key={pluginId} icon={logo} text={displayName} value={this.state.enabled[pluginId]} onPress={handlePress} />

    if (pluginId === 'shapeshift') {
      const leftText = displayName + ' ' + s.strings.account
      const actionText = this.state.needsActivation.shapeshift ? s.strings.ss_login : s.strings.ss_logout

      return (
        <Fragment>
          {toggle}
          <SettingsLabelRow key="activate" icon={logo} text={leftText} right={actionText} onPress={this.shapeShiftSignInToggle} />
        </Fragment>
      )
    }

    return toggle
  }

  renderPluginIcon (pluginId: string): Node {
    const logoSource = getSwapPluginIcon(pluginId)
    return <Image resizeMode="contain" style={styles.swapIcon} source={logoSource} />
  }

  renderPreferredArea () {
    const { exchanges, creationTweaks, preferredSwapPluginId } = this.props

    // Pick plugin:
    const activePlugins = getActivePlugins(creationTweaks, preferredSwapPluginId)
    const pluginId = activePlugins.preferredSwapPluginId

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
      <Fragment>
        <View style={styles.instructionArea}>
          <Text style={styles.instructionText}>{s.strings.swap_preferred_instructions}</Text>
        </View>

        <SettingsRow icon={icon} text={text} onPress={this.handlePreferredModal} />
      </Fragment>
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
    creationTweaks: getCreationTweaks(state),
    exchanges: state.core.account.swapConfig,
    preferredSwapPluginId: state.ui.settings.preferredSwapPluginId
  }),
  (dispatch: Dispatch): DispatchProps => ({
    shapeShiftLogOut () {
      dispatch(deactivateShapeShift())
    },
    removeCreationSwapPlugin () {
      dispatch(removeCreationSwapPlugin())
    },
    changePreferredSwapPlugin (pluginId) {
      dispatch(setPreferredSwapPluginId(pluginId))
    }
  })
)(SwapSettings)
