// @flow

import { type EdgeSwapConfig } from 'edge-core-js/types'
import React, { Component } from 'react'
import { Image, View } from 'react-native'

import {
  changellyLogo,
  changenowLogo,
  coinswitchLogo,
  defaultLogo,
  faastLogo,
  foxExchangeLogo,
  godexLogo,
  shapeshiftLogo,
  totleLogo
} from '../../assets/images/exchange'
import { SwapKYCModalConnector } from '../../connectors/components/SwapKYCModalConnector.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/SettingsStyle'
import { launchModal } from '../common/ModalProvider.js'
import SwitchRow from '../common/RowSwitch.js'
import { RowWithButton } from '../common/RowWithButton.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type ExchangeSettingsProps = {
  exchanges: {
    [string]: EdgeSwapConfig
  },
  shapeShiftNeedsKYC: boolean,
  shapeShiftLogOut(): void
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
  faast: {
    logo: faastLogo
  },
  totle: {
    logo: totleLogo
  },
  godex: {
    logo: godexLogo
  },
  foxExchange: {
    logo: foxExchangeLogo
  },
  coinswitch: {
    logo: coinswitchLogo
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
  shapeShiftSignInToggle = () => {
    if (this.props.shapeShiftNeedsKYC) {
      launchModal(SwapKYCModalConnector, { style: { margin: 0 } }).then((response: null | { accessToken: string, refreshToken: string }) => {
        console.log('exchange: ', response)
      })
      return
    }
    this.props.shapeShiftLogOut()
  }
  render () {
    const ssLoginText = this.props.shapeShiftNeedsKYC ? s.strings.ss_login : s.strings.ss_logout
    return (
      <SceneWrapper hasTabs={false} background="body">
        <View style={styles.instructionArea}>
          <T style={styles.instructionText}>{s.strings.settings_exchange_instruction}</T>
        </View>
        {this.exchangeList.map(exchange => {
          const logoSource = exchangeInfo[exchange.name] ? exchangeInfo[exchange.name].logo : exchangeInfo.default.logo
          const logo = <Image resizeMode={'contain'} style={styles.settingsRowLeftLogo} source={logoSource} />
          const exchangeName = exchange.name.charAt(0).toUpperCase() + exchange.name.substr(1)
          if (exchangeName === 'Shapeshift') {
            return (
              <View style={styles.doubleRowContainer} key={exchange.name}>
                <SwitchRow
                  logo={logo}
                  key={exchange.name}
                  leftText={exchangeName}
                  onToggle={() => this._onToggleEnableExchange(exchange.name)}
                  value={this.state[exchange.name].enabled}
                />
                <RowWithButton
                  logo={logoSource}
                  key={exchange.name + '1'}
                  leftText={exchangeName + ' ' + s.strings.account}
                  rightText={ssLoginText}
                  onPress={this.shapeShiftSignInToggle}
                />
              </View>
            )
          }
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
      </SceneWrapper>
    )
  }
}
