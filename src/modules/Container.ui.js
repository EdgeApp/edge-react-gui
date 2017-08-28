import HockeyApp from 'react-native-hockeyapp'
import SplashScreen from 'react-native-splash-screen'
import React, { Component } from 'react'
import { View, StatusBar, Platform, Keyboard } from 'react-native'
import { connect } from 'react-redux'
import { Scene, Router } from 'react-native-router-flux'
import { Container, StyleProvider } from 'native-base'
import { MenuContext } from 'react-native-menu'
import LinearGradient from 'react-native-linear-gradient'
import getTheme from '../theme/components'
import platform from '../theme/variables/platform'

import TransactionListConnect from './UI/scenes/TransactionList'
import TransactionDetails from './UI/scenes/TransactionDetails'
import Directory from './UI/scenes/Directory/Directory.ui'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/Scan.ui'
import WalletList from './UI/scenes/WalletList/WalletList.ui'
import CreateWallet from './UI/scenes/CreateWallet/index.js'
import {SettingsOverview, BTCSettings, ETHSettings} from './UI/scenes/Settings'

import { LoginScreen } from 'airbitz-core-js-ui'
import Locale from 'react-native-locale'
import SideMenu from './UI/components/SideMenu/SideMenu.ui'
import Header from './UI/components/Header/Header.ui'
import TabBar from './UI/components/TabBar/TabBar.ui'
import HelpModal from './UI/components/HelpModal'
import ABAlert from './UI/components/ABAlert'
import TransactionAlert from './UI/components/TransactionAlert'

import { updateExchangeRates } from './ExchangeRates/action.js'
import { setDeviceDimensions, setKeyboardHeight } from './UI/dimensions/action'
import { makeAccountCallbacks } from '../modules/Core/Account/callbacks.js'
import { initializeAccount } from './Login/action.js'
import { addContext, addUsernamesRequest } from './Core/Context/action.js'

import {setHeaderHeight} from './UI/dimensions/action.js'

import { addCurrencyPlugin } from './UI/Settings/action.js'

import { makeReactNativeIo } from 'airbitz-core-react-native'
import { makeContext } from 'airbitz-core-js'
import * as EXCHANGE_PLUGINS from 'airbitz-exchange-plugins'
// import { BitcoinPlugin } from 'airbitz-currency-bitcoin'
import { EthereumCurrencyPluginFactory } from 'airbitz-currency-ethereum'
const currencyPlugins = [
  EthereumCurrencyPluginFactory
]
global.madeCurrencyPlugins = []

import {setLocaleInfo} from './UI/locale/action'
const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

import styles from './style.js'

import ENV from '../../env.json'
import { mapAllFiles } from 'disklet'

// import { dumpFolder } from '../../debugTools.js'
export function dumpFolder (folder) {
  return mapAllFiles(folder, (file, path) =>
    file.getText(file).then(text => console.log(`dumpfolder: "${path}": "${text}"`))
  )
}

const AIRBITZ_API_KEY = ENV.AIRBITZ_API_KEY
const HOCKEY_APP_ID = Platform.select(ENV.HOCKEY_APP_ID)

const RouterWithRedux = connect()(Router)

class Main extends Component {
  constructor (props) {
    super(props)

    this.state = {
      loading: true,
      loginVisible: true,
      context: {}
    }
  }

  async makeAllPlugins (io) {
    if (global.madeCurrencyPlugins.length === 0) {
      for (const pluginFactory of currencyPlugins) {
        const madePlugin = await pluginFactory.makePlugin({io})
        global.madeCurrencyPlugins.push(madePlugin)
        this.props.addCurrencyPlugin(madePlugin)
      }
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

  _keyboardDidShow = (event) => {
    let keyboardHeight = event.endCoordinates.height
    this.props.setKeyboardHeight(keyboardHeight)
  }

  _keyboardDidHide = (_event) => {
    this.props.setKeyboardHeight(0)
  }

  componentDidMount () {
    HockeyApp.start()
    HockeyApp.checkForUpdate() // optional

    makeReactNativeIo()
    .then(io => {
      const abcInfo = io.console.info
      const abcWarn = io.console.warn
      const abcError = io.console.error

      io.console.info = (...rest) => { abcInfo('ABC_CORE', ...rest) }
      io.console.warn = (...rest) => { abcWarn('ABC_CORE', ...rest) }
      io.console.error = (...rest) => { abcError('ABC_CORE', ...rest) }

      this.makeAllPlugins(io).then(() => {
        const context = makeContext({
          plugins: Object.values(EXCHANGE_PLUGINS),
          apiKey: AIRBITZ_API_KEY,
          io
        })

        this.props.addContext(context)
        this.props.addUsernamesRequest(context)
        this.setState({
          context,
          loading: false
        }, () => { SplashScreen.hide() })
      })
    })
    this.props.setLocaleInfo(localeInfo)
    // console.warn('REMOVE BEFORE FLIGHT') XXX -KevinS
    setInterval(() => { this.props.updateExchangeRates() }, 3000) // Dummy dispatch to allow scenes to update in mapStateToProps
    // setInterval(() => { this.props.updateExchangeRates() }, 30000) // Dummy dispatch to allow scenes to update in mapStateToProps
  }

  _onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout
    const xScale = (width / 375).toFixed(2)
    const yScale = (height / 647).toFixed(2)
    this.props.setDeviceDimensions({ width, height, xScale, yScale })
  }

  render () {
    const routes = this.props.routes

    if (this.state.loading) {
      return (
        <LinearGradient
          style={styles.background}
          start={{x: 0, y: 0}} end={{x: 1, y: 0}}
          colors={['#3b7adb', '#2b569a']} />
      )
    }

    if (this.state.loginVisible) {
      return (
        <LoginScreen
          callbacks={makeAccountCallbacks(this.props.dispatch)}
          context={this.state.context}
          onLogin={(error = null, account) => {
            this.props.initializeAccount(account)
            this.setState({ loginVisible: false })
          }}
        />
      )
    }

    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{ flex: 1 }}>
          <View style={styles.statusBarHack}>
            <Container onLayout={this._onLayout}>

              <StatusBar backgroundColor='green' barStyle='light-content' />

              <SideMenu>
                <Header routes={routes} setHeaderHeight={this.props.setHeaderHeight} />

                <RouterWithRedux>

                  <Scene key='root' hideNavBar>
                    <Scene key='walletList' initial component={WalletList} title='Wallets' animation={'fade'} duration={600} />
                    <Scene key='createWallet' component={CreateWallet} title='Create Wallet' animation={'fade'} duration={300} />

                    <Scene key='transactionList' component={TransactionListConnect} title='Transactions' animation={'fade'} duration={300} />
                    <Scene key='transactionDetails' component={TransactionDetails} title='Transaction Details' duration={0} />

                    <Scene key='scan' component={Scan} title='Scan' animation={'fade'} duration={300} />
                    <Scene key='sendConfirmation' component={SendConfirmation} title='Send Confirmation' animation={'fade'} duration={300} />

                    <Scene key='request' component={Request} title='Request' animation={'fade'} duration={300} />

                    <Scene key='settingsOverview' component={SettingsOverview} title='Settings' animation={'fade'} duration={300} />
                    <Scene key='btcSettings' component={BTCSettings} title='BTC Settings' animation={'fade'} duration={300} />
                    <Scene key='ethSettings' component={ETHSettings} title='ETH Settings' animation={'fade'} duration={300} />

                    <Scene key='directory' component={Directory} title='Directory' animation={'fade'} duration={300} />
                  </Scene>

                </RouterWithRedux>

                <HelpModal />
                <ABAlert />
                <TransactionAlert />

              </SideMenu>
              <TabBar />
            </Container>
          </View>
        </MenuContext>
      </StyleProvider>
    )
  }
}

const mapStateToProps = (state) => ({
  routes: state.routes
})
const mapDispatchToProps = (dispatch) => ({
  dispatch: () => dispatch,
  addCurrencyPlugin: (madePlugin) => dispatch(addCurrencyPlugin(madePlugin)),
  setKeyboardHeight: (keyboardHeight) => dispatch(setKeyboardHeight(keyboardHeight)),
  addContext: (context) => dispatch(addContext(context)),
  addUsernamesRequest: (context) => dispatch(addUsernamesRequest(context)),
  setLocaleInfo: (localInfo) => dispatch(setLocaleInfo(localeInfo)),
  updateExchangeRates: () => dispatch(updateExchangeRates()),
  setDeviceDimensions: (dimensions) => dispatch(setDeviceDimensions(dimensions)),
  initializeAccount: (account) => dispatch(initializeAccount(account)),
  setHeaderHeight: (height) => dispatch(setHeaderHeight(height))
})
export default connect(mapStateToProps, mapDispatchToProps)(Main)
