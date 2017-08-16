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

import Login from './UI/scenes/Login/index.js'
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

import { addBitcoinPlugin, addEthereumPlugin } from './UI/Settings/action.js'

import { makeReactNativeIo } from 'airbitz-core-react-native'
import { makeContext } from 'airbitz-core-js'
import * as PLUGINS from 'airbitz-exchange-plugins'
import { makeBitcoinPlugin } from 'airbitz-currency-bitcoin'
import { makeEthereumPlugin } from 'airbitz-currency-ethereum'

import {setLocaleInfo} from './UI/locale/action'

import styles from './style.js'

import ENV from '../../env.json'
const AIRBITZ_API_KEY = ENV.AIRBITZ_API_KEY
const HOCKEY_APP_ID = Platform.select(ENV.HOCKEY_APP_ID)

const RouterWithRedux = connect()(Router)

class Main extends Component {
  constructor (props) {
    super(props)
    const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux
    this.props.dispatch(setLocaleInfo(localeInfo))
    console.log('just dispatched localeInfo: ', localeInfo)
    console.log('main constructor props', props)

    this.state = {
      loading: true,
      loginVisible: true,
      context: {}
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

  _keyboardDidShow = (e) => {
    let keyboardHeight = e.endCoordinates.height
    this.props.dispatch(setKeyboardHeight(keyboardHeight))
  }

  _keyboardDidHide = (e) => {
    this.props.dispatch(setKeyboardHeight(0))
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

      const bitcoinPlugin = makeBitcoinPlugin({io})
      this.props.dispatch(addBitcoinPlugin(bitcoinPlugin))

      const ethereumPlugin = makeEthereumPlugin({io})
      this.props.dispatch(addEthereumPlugin(ethereumPlugin))

      const context = makeContext({
        plugins: Object.values(PLUGINS),
        apiKey: AIRBITZ_API_KEY,
        io
      })

      this.props.dispatch(addContext(context))
      this.props.dispatch(addUsernamesRequest(context))
      this.setState({
        context,
        loading: false
      }, () => { SplashScreen.hide() })
    })
    // Dummy dispatch to allow scenes to update mapStateToProps
    setInterval(() => { this.props.dispatch(updateExchangeRates()) }, 30000)
  }

  _onLayout = (event) => {
    const { width, height } = event.nativeEvent.layout
    const xScale = (width / 375).toFixed(2)
    const yScale = (height / 647).toFixed(2)
    this.props.dispatch(setDeviceDimensions({ width, height, xScale, yScale }))
  }

  render () {
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
        <Login
          callbacks={makeAccountCallbacks(this.props.dispatch)}
          context={this.state.context}
          onLoggedIn={account => {
            this.props.dispatch(initializeAccount(account))
            this.setState({ loginVisible: false })
          }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center'
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
                <Header />

                <RouterWithRedux>

                  <Scene key='root' hideNavBar>

                    <Scene key='scan' component={Scan} title='Scan' animation={'fade'} duration={300} />

                    <Scene key='walletList' initial component={WalletList} title='Wallets' animation={'fade'} duration={300} />

                    <Scene key='directory' component={Directory} title='Directory' animation={'fade'} duration={300} />

                    <Scene key='transactionList' component={TransactionListConnect} title='Transactions' animation={'fade'} duration={300} />

                    <Scene key='transactionDetails' component={TransactionDetails} title='Transaction Details' duration={0} />

                    <Scene key='request' component={Request} title='Request' animation={'fade'} duration={300} />

                    <Scene key='sendConfirmation' component={SendConfirmation} title='Send Confirmation' animation={'fade'} duration={300} />

                    <Scene key='createWallet' component={CreateWallet} title='Create Wallet' animation={'fade'} duration={300} />

                    <Scene key='settingsOverview' component={SettingsOverview} title='Settings' animation={'fade'} duration={300} />

                    <Scene key='btcSettings' component={BTCSettings} title='BTC Settings' animation={'fade'} duration={300} />

                    <Scene key='ethSettings' component={ETHSettings} title='ETH Settings' animation={'fade'} duration={300} />

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

export default connect()(Main)
