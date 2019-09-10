// @flow

import { type EdgeSwapConfig } from 'edge-core-js/types'
import React, { Component } from 'react'
import { Image, View } from 'react-native'
import CookieManager from 'react-native-cookies'
import { Actions } from 'react-native-router-flux'

import { getSwapPluginIcon } from '../../assets/images/exchange'
import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/SettingsStyle'
import SwitchRow from '../common/RowSwitch.js'
import { RowWithButton } from '../common/RowWithButton.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type ExchangeSettingsProps = {
  exchanges: {
    [string]: EdgeSwapConfig
  },
  shapeShiftLogOut(): void
}

type ExchangeSettingsState = {
  enabled: { [pluginId: string]: boolean },
  needsActivation: { [pluginId: string]: boolean }
}

export class ExchangeSettingsComponent extends Component<ExchangeSettingsProps, ExchangeSettingsState> {
  cleanups: Array<() => mixed> = []
  sortedIds: Array<string>

  constructor (props: ExchangeSettingsProps) {
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

  _onToggleEnableExchange = (pluginId: string) => {
    const { exchanges } = this.props
    const newValue = !exchanges[pluginId].enabled
    exchanges[pluginId].changeEnabled(newValue)
  }

  shapeShiftSignInToggle = () => {
    if (this.state.needsActivation.shapeshift) {
      CookieManager.clearAll()
        .catch(e => {}) // TODO: Error handling
        .then(() => Actions[Constants.SWAP_ACTIVATE_SHAPESHIFT]())
    } else {
      this.props.shapeShiftLogOut()
    }
  }

  render () {
    return (
      <SceneWrapper hasTabs={false} background="body">
        <View style={styles.instructionArea}>
          <T style={styles.instructionText}>{s.strings.settings_exchange_instruction}</T>
        </View>
        {this.sortedIds.map(pluginId => this.renderPlugin(pluginId))}
      </SceneWrapper>
    )
  }

  renderPlugin (pluginId: string) {
    const { exchanges } = this.props
    const { displayName } = exchanges[pluginId].swapInfo
    const logoSource = getSwapPluginIcon(pluginId)
    const logo = <Image resizeMode={'contain'} style={styles.settingsRowLeftLogo} source={logoSource} />

    if (pluginId === 'shapeshift') {
      const ssLoginText = this.state.needsActivation.shapeshift ? s.strings.ss_login : s.strings.ss_logout

      return (
        <View style={styles.doubleRowContainer} key={pluginId}>
          <SwitchRow logo={logo} leftText={displayName} onToggle={() => this._onToggleEnableExchange(pluginId)} value={this.state.enabled[pluginId]} />
          <RowWithButton logo={logoSource} leftText={displayName + ' ' + s.strings.account} rightText={ssLoginText} onPress={this.shapeShiftSignInToggle} />
        </View>
      )
    }

    return (
      <SwitchRow
        logo={logo}
        key={pluginId}
        leftText={displayName}
        onToggle={() => this._onToggleEnableExchange(pluginId)}
        value={this.state.enabled[pluginId]}
      />
    )
  }
}
