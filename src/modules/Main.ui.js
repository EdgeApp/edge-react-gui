// @flow
import type {AbcContext, AbcContextCallbacks, AbcCurrencyPlugin} from 'airbitz-core-types'

import HockeyApp from 'react-native-hockeyapp'
// import SplashScreen from 'react-native-splash-screen'
import React, {Component} from 'react'
import {View, StatusBar, Keyboard, Platform} from 'react-native'
import {connect} from 'react-redux'
import {ActionConst, Scene, Router} from 'react-native-router-flux'
import {Container, StyleProvider} from 'native-base'
import {MenuContext} from 'react-native-menu'
import getTheme from '../theme/components'
import platform from '../theme/variables/platform'
import Locale from 'react-native-locale'
import * as Constants from '../constants'
import LoginConnector from './UI/scenes/Login/LoginConnector'
import ChangePasswordConnector from './UI/scenes/ChangePinPassword/ChangePasswordConnector.ui'
import ChangePinConnector from './UI/scenes/ChangePinPassword/ChangePinConnector.ui'
import PasswordRecoveryConnector from './UI/scenes/PasswordRecovery/PasswordRecoveryConnector.ui'
import LayoutConnector from './UI/scenes/layout/LayoutConnector'
import TransactionListConnector from './UI/scenes/TransactionList/TransactionListConnector'

import TransactionDetails from './UI/scenes/TransactionDetails/TransactionDetailsConnector.js'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/ScanConnector'
import WalletList from './UI/scenes/WalletList/WalletListConnector'
import CreateWallet from './UI/scenes/CreateWallet/createWalletConnector'
import SettingsOverview from './UI/scenes/Settings/SettingsOverviewConnector'
import CurrencySettings from './UI/scenes/Settings/CurrencySettingsConnector'
import DefaultFiatSettingConnector from './UI/scenes/Settings/DefaultFiatSettingConnector'
import * as CONTEXT_API from './Core/Context/api'

import {makeContext, makeReactNativeIo} from 'airbitz-core-react-native'
import * as EXCHANGE_PLUGINS from 'edge-exchange-plugins'
// $FlowFixMe
import {BitcoinCurrencyPluginFactory, LitecoinCurrencyPluginFactory, BitcoincashCurrencyPluginFactory} from 'edge-currency-bitcoin'
import {EthereumCurrencyPluginFactory} from 'edge-currency-ethereum'

const currencyPluginFactories = []
currencyPluginFactories.push(EthereumCurrencyPluginFactory)
currencyPluginFactories.push(BitcoinCurrencyPluginFactory)
currencyPluginFactories.push(LitecoinCurrencyPluginFactory)
currencyPluginFactories.push(BitcoincashCurrencyPluginFactory)

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

import styles from './style.js'

import ENV from '../../env.json'

const AIRBITZ_API_KEY = ENV.AIRBITZ_API_KEY
const HOCKEY_APP_ID = Platform.select(ENV.HOCKEY_APP_ID)

const RouterWithRedux = connect()(Router)

type Props = {
  username?: string,
  routes: any,
  addExchangeTimer: (number) => void,
  addCurrencyPlugin: (AbcCurrencyPlugin) => void,
  setKeyboardHeight: (number) => void,
  addContext: (AbcContext) => void,
  addUsernames: (Array<string>) => void,
  setLocaleInfo: (any) => void,
  setDeviceDimensions: (any) => void,
  contextCallbacks: AbcContextCallbacks
}

type State = {
  context: ?AbcContext,
  loading: boolean
}

export default class Main extends Component<Props, State> {
  keyboardDidShowListener: any
  keyboardDidHideListener: any

  constructor (props: Props) {
    super(props)

    this.state = {
      context: undefined,
      loading: true
    }
  }

  componentWillMount () {
    HockeyApp.configure(HOCKEY_APP_ID, true)
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow)
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide)
  }

  componentWillUnmount () {
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()
  }

  componentDidMount () {
    HockeyApp.start()
    HockeyApp.checkForUpdate() // optional
    makeReactNativeIo()
    .then((io) =>
      // Make the core context:
       makeContext({
         apiKey: AIRBITZ_API_KEY,
         plugins: [...currencyPluginFactories, ...Object.values(EXCHANGE_PLUGINS)],
         callbacks: this.props.contextCallbacks,
         io
       }))
    .then((context) => {
      // Put the context into Redux:
      this.props.addContext(context)

      CONTEXT_API.listUsernames(context)
      .then((usernames) => {
        this.props.addUsernames(usernames)
      })
      this.props.setLocaleInfo(localeInfo)
      // this.setState({ context, loading: false }, () => SplashScreen.hide())
      this.setState({context, loading: false})
    })
  }

  render () {
    const routes = this.props.routes
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{flex: 1}}>
          <View style={styles.statusBarHack}>
            <Container onLayout={this._onLayout}>

              <StatusBar translucent backgroundColor='green' barStyle='light-content' />

              <RouterWithRedux>
              <Scene key='root' hideNavBar>
                <Scene hideNavBar hideTabBar type={ActionConst.RESET} key={Constants.LOGIN} component={LoginConnector} title='login' animation={'fade'} duration={600} initial username={this.props.username} />

                <Scene hideNavBar hideTabBar key={Constants.EDGE} component={LayoutConnector} routes={routes} animation={'fade'} duration={600}>
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.CHANGE_PASSWORD}   component={ChangePasswordConnector}   title='Change Password' animation={'fade'} duration={600} />
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.CHANGE_PIN}        component={ChangePinConnector}        title='Change Pin' animation={'fade'} duration={600} />
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.RECOVER_PASSWORD}  component={PasswordRecoveryConnector} title='Password Recovery' animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.WALLET_LIST}   component={WalletList}   title='Wallets'       animation={'fade'} duration={600} initial/>
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.CREATE_WALLET} component={CreateWallet} title='Create Wallet' animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.TRANSACTION_LIST}    component={TransactionListConnector} title='Transactions'        animation={'fade'} duration={600} />
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.TRANSACTION_DETAILS} component={TransactionDetails}       title='Transaction Details' animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.SCAN}              component={Scan}             title='Scan'              animation={'fade'} duration={600} />
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.SEND_CONFIRMATION} component={SendConfirmation} title='Send Confirmation' animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.REQUEST} component={Request} title='Request' animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.SETTINGS_OVERVIEW} component={SettingsOverview} title='Settings' animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.BTC_SETTINGS} component={CurrencySettings} currencyCode={'BTC'} pluginName={'bitcoin'}     title='BTC Settings' animation={'fade'} duration={600} />
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.BCH_SETTINGS} component={CurrencySettings} currencyCode={'BCH'} pluginName={'bitcoinCash'} title='BCH Settings' animation={'fade'} duration={600} />
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.ETH_SETTINGS} component={CurrencySettings} currencyCode={'ETH'} pluginName={'ethereum'}    title='ETH Settings' animation={'fade'} duration={600} />
                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.LTC_SETTINGS} component={CurrencySettings} currencyCode={'LTC'} pluginName={'litecoin'}    title='LTC Settings' animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='defaultFiatSetting' component={DefaultFiatSettingConnector} title='Default Fiat' animation={'fade'} duration={600} />

                </Scene>
              </Scene>
            </RouterWithRedux>

            </Container>
          </View>
        </MenuContext>
      </StyleProvider>
    )
  }

  _onLayout = (event) => {
    const {width, height} = event.nativeEvent.layout
    const xScale = (width / 375).toFixed(2)
    const yScale = (height / 647).toFixed(2)
    this.props.setDeviceDimensions({width, height, xScale, yScale})
  }

  _keyboardDidShow = (event) => {
    let keyboardHeight = event.endCoordinates.height
    this.props.setKeyboardHeight(keyboardHeight)
  }

  _keyboardDidHide = () => {
    this.props.setKeyboardHeight(0)
  }
}
