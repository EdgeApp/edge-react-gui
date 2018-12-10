// @flow

import { type EdgeSwapConfig } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, View } from 'react-native'

import { changellyLogo, changenowLogo, defaultLogo, shapeshiftLogo } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/SettingsStyle'
import SwitchRow from '../common/RowSwitch.js'

type ExchangeSettingsProps = {
  exchanges: {
    [string]: EdgeSwapConfig
  }
}

type GuiExchangeSetting = {
  enabled: boolean,
  name: string
}

const exchangeInfo = {
  shapeshift: {
    logo: shapeshiftLogo
  },
  changelly: {
    logo: changellyLogo
  },
  changenow: {
    logo: changenowLogo
  },
  default: {
    logo: defaultLogo
  }
}

type ExchangeSettingsState = {
  [exchange: string]: {
    enabled: boolean
  }
}

export class ExchangeSettingsComponent extends Component<ExchangeSettingsProps, ExchangeSettingsState> {
  exchangeList: Array<GuiExchangeSetting>

  constructor (props: ExchangeSettingsProps) {
    super(props)
    this.state = {}
    const { exchanges } = props
    this.exchangeList = []
    for (const exchange in exchanges) {
      const exchangeData = { enabled: exchanges[exchange].enabled, name: exchange }
      this.exchangeList.push(exchangeData)
      this.state[exchange] = {
        enabled: exchanges[exchange].enabled
      }
    }
  }

  subHeader (title: string) {
    return (
      <Gradient style={[styles.headerRow]}>
        <View style={[styles.headerTextWrap]}>
          <View style={styles.leftArea}>
            <T style={styles.headerText}>{title}</T>
          </View>
        </View>
      </Gradient>
    )
  }

  _onToggleEnableExchange = (exchangeName: string) => {
    const { exchanges } = this.props
    const newValue = !exchanges[exchangeName].enabled
    exchanges[exchangeName].changeEnabled(newValue)
    this.setState({
      [exchangeName]: {
        enabled: newValue
      }
    })
  }

  render () {
    return (
      <SafeAreaView>
        <View style={[styles.ethereumSettings]}>
          <Gradient style={styles.gradient} />
          <View style={styles.container}>
            <View style={styles.instructionArea}>
              <T style={styles.instructionText}>{s.strings.settings_exchange_instruction}</T>
            </View>
            {this.exchangeList.map(exchange => {
              const logoSource = exchangeInfo[exchange.name] ? exchangeInfo[exchange.name].logo : exchangeInfo.default.logo
              const logo = <Image resizeMode={'contain'} style={styles.settingsRowLeftLogo} source={logoSource} />
              const exchangeName = exchange.name.charAt(0).toUpperCase() + exchange.name.substr(1)
              return (
                <SwitchRow
                  logo={logo}
                  key={exchange.name}
                  leftText={exchangeName}
                  onToggle={() => this._onToggleEnableExchange(exchange.name)}
                  value={this.state[exchange.name].enabled}
                />
              )
            })}
          </View>
        </View>
      </SafeAreaView>
    )
  }
}
