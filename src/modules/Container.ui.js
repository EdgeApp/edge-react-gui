// import HockeyApp from 'react-native-hockeyapp'
import SplashScreen from 'react-native-splash-screen'
import React, { Component } from 'react'
import { View, StatusBar, Platform, Keyboard } from 'react-native'
import { connect } from 'react-redux'
import { Scene, Router } from 'react-native-router-flux'
import { Container, StyleProvider } from 'native-base'
import { MenuContext } from 'react-native-menu'
import getTheme from '../theme/components'
import platform from '../theme/variables/platform'

import SideMenu from './UI/components/SideMenu/SideMenu.ui'
import TabBar from './UI/components/TabBar/TabBar.ui'
import ABAlert from './UI/components/ABAlert/ABAlert.ui'
import TransactionAlert from './UI/components/TransactionAlert/index'
import HelpModal from './UI/components/HelpModal/index'

import Login from './UI/scenes/Login/Login.ui'
import Layout from './UI/scenes/layout/Layout.ui'
import TransactionListConnect from './UI/scenes/TransactionList'
import TransactionDetails from './UI/scenes/TransactionDetails'
import Directory from './UI/scenes/Directory/Directory.ui'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/Scan.ui'
import WalletList from './UI/scenes/WalletList/WalletList.ui'
import CreateWallet from './UI/scenes/CreateWallet/index.js'
import BTCSettings from './UI/scenes/Settings/BTCSettings.ui'
import ETHSettings from './UI/scenes/Settings/ETHSettings.ui'
import { SettingsOverview } from './UI/scenes/Settings'

import Locale from 'react-native-locale'

import { updateExchangeRates } from './ExchangeRates/action.js'
import { setDeviceDimensions, setKeyboardHeight } from './UI/dimensions/action'
import { addContext, addUsernames } from './Core/Context/action.js'

import {setHeaderHeight} from './UI/dimensions/action.js'

import { addCurrencyPlugin } from './UI/Settings/action.js'

import { makeReactNativeIo } from 'airbitz-core-react-native'
import { makeContext } from 'airbitz-core-js'
import * as EXCHANGE_PLUGINS from 'airbitz-exchange-plugins'
import { BitcoinCurrencyPluginFactory } from 'airbitz-currency-bitcoin'
import { EthereumCurrencyPluginFactory } from 'airbitz-currency-ethereum'
import * as CORE_SELECTORS from './Core/selectors'

let currencyPlugins = []

if (Platform.OS === 'ios') {
  currencyPlugins = [
    BitcoinCurrencyPluginFactory,
    EthereumCurrencyPluginFactory
  ]
} else if (Platform.OS === 'android') {
  currencyPlugins = [
    EthereumCurrencyPluginFactory
  ]
}

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
// const HOCKEY_APP_ID = Platform.select(ENV.HOCKEY_APP_ID)

const RouterWithRedux = connect()(Router)

class Main extends Component {
  constructor (props) {
    super(props)

    this.state = {
      context: {}
    }
  }

  componentWillMount () {
    // HockeyApp.configure(HOCKEY_APP_ID, true)
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

  _keyboardDidHide = () => {
    this.props.setKeyboardHeight(0)
  }

  async makeCoreContext () {
    const io = await makeReactNativeIo()

    // Tweak the io logging:
    const abcInfo = io.console.info
    const abcWarn = io.console.warn
    const abcError = io.console.error
    io.console.info = (...rest) => {
      abcInfo('ABC_CORE', ...rest)
    }
    io.console.warn = (...rest) => {
      abcWarn('ABC_CORE', ...rest)
    }
    io.console.error = (...rest) => {
      abcError('ABC_CORE', ...rest)
    }

    // Make the core context:
    const context = makeContext({
      apiKey: AIRBITZ_API_KEY,
      plugins: [...currencyPlugins, ...Object.values(EXCHANGE_PLUGINS)],
      io
    })

    // Put the context into Redux:
    this.props.addContext(context)
    this.props.addUsernames(context.usernames)
    for (const plugin of await context.getCurrencyPlugins()) {
      this.props.addCurrencyPlugin(plugin)
    }

    return context
  }

  componentDidMount () {
    // HockeyApp.start()
    // HockeyApp.checkForUpdate() // optional

    this.makeCoreContext()
    .then(context => {
      this.setState({ context, loading: false }, () => SplashScreen.hide())

      this.props.setLocaleInfo(localeInfo)
      // console.warn('REMOVE BEFORE FLIGHT') XXX -KevinS
      setInterval(() => {
        this.props.updateExchangeRates()
      // }, 3000) // Dummy dispatch to allow scenes to update in mapStateToProps
      }, 30000) // Dummy dispatch to allow scenes to update in mapStateToProps
    })
  }

  _onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout
    const xScale = (width / 375).toFixed(2)
    const yScale = (height / 647).toFixed(2)
    this.props.setDeviceDimensions({ width, height, xScale, yScale })
  }

  render () {
    const routes = this.props.routes
    if (!this.props.context) return
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{ flex: 1 }}>
          <View style={styles.statusBarHack}>
            <Container onLayout={this._onLayout}>

              <StatusBar backgroundColor='green' barStyle='light-content' />

                <RouterWithRedux>

                  <Scene key='root' hideNavBar>
                    <Scene key='login' initial component={Login} animation={'fade'} duration={600} />

                    <Scene key='edge' component={Layout} routes={routes} animation={'fade'} duration={600}>

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
                  </Scene>

                </RouterWithRedux>


                <HelpModal />
                <ABAlert />
                <TransactionAlert />
                <SideMenu />
                <TabBar />
            </Container>
          </View>
        </MenuContext>
      </StyleProvider>
    )
  }
}

const mapStateToProps = (state) => ({
  routes: state.routes,
  context: CORE_SELECTORS.getContext(state)
})
const mapDispatchToProps = (dispatch) => ({
  dispatch: () => dispatch,
  addCurrencyPlugin: (madePlugin) => dispatch(addCurrencyPlugin(madePlugin)),
  setKeyboardHeight: (keyboardHeight) => dispatch(setKeyboardHeight(keyboardHeight)),
  addContext: (context) => dispatch(addContext(context)),
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  setLocaleInfo: (localeInfo) => dispatch(setLocaleInfo(localeInfo)),
  updateExchangeRates: () => dispatch(updateExchangeRates()),
  setDeviceDimensions: (dimensions) => dispatch(setDeviceDimensions(dimensions)),
  setHeaderHeight: (height) => dispatch(setHeaderHeight(height))
})
export default connect(mapStateToProps, mapDispatchToProps)(Main)
