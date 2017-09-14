// import HockeyApp from 'react-native-hockeyapp'
// import SplashScreen from 'react-native-splash-screen'
import React, {Component} from 'react'
import {View, StatusBar, Keyboard} from 'react-native'
import {connect} from 'react-redux'
import {ActionConst, Scene, Router} from 'react-native-router-flux'
import {Container, StyleProvider} from 'native-base'
import {MenuContext} from 'react-native-menu'
import getTheme from '../theme/components'
import platform from '../theme/variables/platform'
import Locale from 'react-native-locale'

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
import {SettingsOverview} from './UI/scenes/Settings'

import {addExchangeTimer} from  './UI/Settings/action'
import {updateExchangeRates} from './ExchangeRates/action.js'
import {setDeviceDimensions, setKeyboardHeight} from './UI/dimensions/action'
import {addContext} from './Core/Context/action.js'
import {setHeaderHeight} from './UI/dimensions/action.js'
import {addCurrencyPlugin} from './UI/Settings/action.js'
import {addUsernames} from './Core/Context/action'

import * as CORE_SELECTORS from './Core/selectors'
import * as CONTEXT_API from './Core/Context/api'

import {makeContext, makeReactNativeIo} from 'airbitz-core-react-native'
import * as EXCHANGE_PLUGINS from 'airbitz-exchange-plugins'
import {BitcoinCurrencyPluginFactory} from 'airbitz-currency-bitcoin'
import {LitecoinCurrencyPluginFactory} from 'airbitz-currency-litecoin'
import {EthereumCurrencyPluginFactory} from 'airbitz-currency-ethereum'

const currencyPluginFactories = []
currencyPluginFactories.push(EthereumCurrencyPluginFactory)
currencyPluginFactories.push(BitcoinCurrencyPluginFactory)
currencyPluginFactories.push(LitecoinCurrencyPluginFactory)

import {setLocaleInfo} from './UI/locale/action'
const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

import styles from './style.js'

import ENV from '../../env.json'
import {mapAllFiles} from 'disklet'

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

  componentDidMount () {
    // HockeyApp.start()
    // HockeyApp.checkForUpdate() // optional
    makeReactNativeIo()
    .then(io =>
      // Make the core context:
       makeContext({
         apiKey: AIRBITZ_API_KEY,
         plugins: [...currencyPluginFactories, ...Object.values(EXCHANGE_PLUGINS)],
         io
       }))
    .then(context => {
      // Put the context into Redux:
      this.props.addContext(context)

      CONTEXT_API.listUsernames(context)
      .then(usernames => {
        this.props.addUsernames(usernames)
      })
      this.props.setLocaleInfo(localeInfo)
      // this.setState({ context, loading: false }, () => SplashScreen.hide())
      this.setState({context, loading: false})
      const exchangeTimer = setInterval(() => {
        this.props.updateExchangeRates()
      }, 30000) // Dummy dispatch to allow scenes to update in mapStateToProps
      this.props.dispatch(addExchangeTimer(exchangeTimer))
    })
  }

  render () {
    const routes = this.props.routes
    if (!this.props.context) return
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{flex: 1}}>
          <View style={styles.statusBarHack}>
            <Container onLayout={this._onLayout}>

              <StatusBar translucent backgroundColor='green' barStyle='light-content' />

              <RouterWithRedux>
                <Scene key='root' hideNavBar>
                  <Scene key='login' type={ActionConst.REPLACE} initial username={this.props.username} component={Login} animation={'fade'} duration={600} />

                  <Scene hideNavBar hideTabBar key='edge' component={Layout} routes={routes} animation={'fade'} duration={600}>

                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='walletList' initial component={WalletList} title='Wallets' animation={'fade'} duration={600} />
                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='createWallet' component={CreateWallet} title='Create Wallet' animation={'fade'} duration={600} />

                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='transactionList' component={TransactionListConnect} title='Transactions' animation={'fade'} duration={600} />
                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='transactionDetails' component={TransactionDetails} title='Transaction Details' duration={0} />

                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='scan' component={Scan} title='Scan' animation={'fade'} duration={600} />
                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='sendConfirmation' component={SendConfirmation} title='Send Confirmation' animation={'fade'} duration={600} />

                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='request' component={Request} title='Request' animation={'fade'} duration={600} />

                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='settingsOverview' component={SettingsOverview} title='Settings' animation={'fade'} duration={600} />

                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='btcSettings' component={BTCSettings} title='BTC Settings' animation={'fade'} duration={600} />
                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='ethSettings' component={ETHSettings} title='ETH Settings' animation={'fade'} duration={600} />

                    <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='directory' component={Directory} title='Directory' animation={'fade'} duration={600} />

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

const mapStateToProps = (state) => ({
  routes: state.routes,
  context: CORE_SELECTORS.getContext(state)
})
const mapDispatchToProps = (dispatch) => ({
  dispatch,
  addCurrencyPlugin: (plugin) => dispatch(addCurrencyPlugin(plugin)),
  setKeyboardHeight: (keyboardHeight) => dispatch(setKeyboardHeight(keyboardHeight)),
  addContext: (context) => dispatch(addContext(context)),
  addUsernames: (usernames) => dispatch(addUsernames(usernames)),
  setLocaleInfo: (localeInfo) => dispatch(setLocaleInfo(localeInfo)),
  updateExchangeRates: () => dispatch(updateExchangeRates()),
  setDeviceDimensions: (dimensions) => dispatch(setDeviceDimensions(dimensions)),
  setHeaderHeight: (height) => dispatch(setHeaderHeight(height))
})
export default connect(mapStateToProps, mapDispatchToProps)(Main)
