// @flow
import type {AbcContext, AbcContextCallbacks, AbcCurrencyPlugin} from 'airbitz-core-types'

import HockeyApp from 'react-native-hockeyapp'
// import SplashScreen from 'react-native-splash-screen'
import React, {Component} from 'react'
import {Keyboard, Platform, StyleSheet, View, Text, StatusBar} from 'react-native'
import Button from 'react-native-button';
import {connect} from 'react-redux'
import SideMenu from './UI/components/SideMenu/SideMenuConnector'
import ControlPanel from './UI/components/ControlPanel/ControlPanel.ui'
import THEME from '../theme/variables/airbitz'

import {
  Scene,
  Router,
  Actions,
  Reducer,
  ActionConst,
  Overlay,
  Tabs,
  Modal,
  Drawer,
  Stack,
  Lightbox
} from 'react-native-router-flux'
import {StyleProvider} from 'native-base'
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
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator'
import MenuIcon from '../assets/images/walletlist/sort.png';
import Header from './UI/components/Header/Header.ui'
import headerStyle from './UI/components/Header/style'

import * as CONTEXT_API from './Core/Context/api'

import {makeFakeContexts, makeReactNativeContext} from 'airbitz-core-react-native'
import * as EXCHANGE_PLUGINS from 'edge-exchange-plugins'
// $FlowFixMe
// import {BitcoinCurrencyPluginFactory, LitecoinCurrencyPluginFactory, BitcoincashCurrencyPluginFactory} from 'edge-currency-bitcoin'
import {EthereumCurrencyPluginFactory} from 'edge-currency-ethereum'

const currencyPluginFactories = []
currencyPluginFactories.push(EthereumCurrencyPluginFactory)
// currencyPluginFactories.push(BitcoinCurrencyPluginFactory)
// currencyPluginFactories.push(LitecoinCurrencyPluginFactory)
// currencyPluginFactories.push(BitcoincashCurrencyPluginFactory)

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

import ENV from '../../env.json'
import Gradient from './UI/components/Gradient/Gradient.ui'

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

StatusBar.setBarStyle('light-content', true)

function makeCoreContext (callbacks: AbcContextCallbacks): Promise<AbcContext> {
  const opts = {
    apiKey: AIRBITZ_API_KEY,
    callbacks,
    plugins: [...currencyPluginFactories, ...Object.values(EXCHANGE_PLUGINS)]
  }

  if (ENV.USE_FAKE_CORE) {
    const [context] = makeFakeContexts({...opts, localFakeUser: true})
    return Promise.resolve(context)
  }

  return makeReactNativeContext(opts)
}

const drawerStyle = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'red',
  },
});

class DummyDrawer extends React.Component {
  static contextTypes = {
    drawer: React.PropTypes.object,
  }

  render() {
    return (
      <View style={drawerStyle.container}>
        <Text>Drawer Content</Text>
        <Button onPress={Actions.closeDrawer}>Back</Button>
        <Text>Title: {this.props.title}</Text>
        <Button onPress={Actions.pop}>Back</Button>
        <Button onPress={Actions.walletListTab}>Wallets</Button>
        <Button onPress={Actions.scanTab}>Scan QR Code</Button>
        <Button onPress={Actions.settingsOverviewTab}>Settings</Button>
      </View >
    );
  }
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
    makeCoreContext(this.props.contextCallbacks)
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

  renderWalletListNavBar = () => {
    return (
      <Header/>
    )
  }

  render () {
    const routes = this.props.routes
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{flex: 1}}>
          <RouterWithRedux>
            <Overlay>
                <Modal hideNavBar transitionConfig={() => ({ screenInterpolator: CardStackStyleInterpolator.forFadeFromBottomAndroid })}>
                  {/*<Lightbox>*/}
                    <Stack hideNavBar key='root' titleStyle={{ alignSelf: 'center' }}>
                      <Scene key={Constants.LOGIN} component={LoginConnector} title='login' animation={'fade'} duration={600} initial username={this.props.username} />
                      <Drawer hideNavBar key='edge' contentComponent={DummyDrawer} drawerImage={MenuIcon} hideDrawerButton={false} drawerPosition='right'>
                        {/*
                         Wrapper Scene needed to fix a bug where the tabs would
                         reload as a modal ontop of itself
                         */}
                        <Scene hideNavBar>
                          {/*<Gradient>*/}
                          <Tabs key='edge' swipeEnabled navTransparent={true} showLabel={false}>
                            <Stack key='walletListTab' title='Tab #1' tabBarLabel='Wall'>
                              <Scene key={Constants.WALLET_LIST} component={WalletList} title='Wallets' />
                              <Scene key={Constants.CREATE_WALLET} component={CreateWallet} title='Create Wallet' animation={'fade'} duration={600} />
                              <Scene key={Constants.TRANSACTION_LIST} renderTitle={this.renderWalletListNavBar} component={TransactionListConnector} title='Transactions' back/>
                            </Stack>
                            <Scene key={Constants.REQUEST} renderTitle={this.renderWalletListNavBar} component={Request} title='Request' animation={'fade'} duration={600} />
                            <Stack key='scanTab' title='Tab #2' tabBarLabel='Send'>
                              <Scene key={Constants.SCAN} renderTitle={this.renderWalletListNavBar} component={Scan} title='Scan' animation={'fade'} duration={600} />
                              <Scene key={Constants.SEND_CONFIRMATION} component={SendConfirmation} title='Send Confirmation' animation={'fade'} duration={600} />
                            </Stack>
                          </Tabs>
                          <Stack key='settingsOverviewTab' title='Settings' hideDrawerButton={true} >
                            <Scene key={Constants.SETTINGS_OVERVIEW} component={SettingsOverview} title='Settings' onLeft={Actions.pop} leftTitle='Back' animation={'fade'} duration={600} />
                            <Scene key={Constants.CHANGE_PASSWORD}   component={ChangePasswordConnector}   title='Change Password' animation={'fade'} duration={600} />
                            <Scene key={Constants.CHANGE_PIN}        component={ChangePinConnector}        title='Change Pin' animation={'fade'} duration={600} />
                            <Scene key={Constants.RECOVER_PASSWORD}  component={PasswordRecoveryConnector} title='Password Recovery' animation={'fade'} duration={600} />
                            <Scene key={Constants.BTC_SETTINGS} component={CurrencySettings} currencyCode={'BTC'} pluginName={'bitcoin'}     title='BTC Settings' animation={'fade'} duration={600} />
                            <Scene key={Constants.BCH_SETTINGS} component={CurrencySettings} currencyCode={'BCH'} pluginName={'bitcoinCash'} title='BCH Settings' animation={'fade'} duration={600} />
                            <Scene key={Constants.ETH_SETTINGS} component={CurrencySettings} currencyCode={'ETH'} pluginName={'ethereum'}    title='ETH Settings' animation={'fade'} duration={600} />
                            <Scene key={Constants.LTC_SETTINGS} component={CurrencySettings} currencyCode={'LTC'} pluginName={'litecoin'}    title='LTC Settings' animation={'fade'} duration={600} />
                            <Scene key='defaultFiatSetting' component={DefaultFiatSettingConnector} title='Default Fiat' animation={'fade'} duration={600} />
                          </Stack>
                          {/*</Gradient>*/}
                        </Scene>
                      </Drawer>
                    </Stack>
                  {/*</Lightbox>*/}
                </Modal>
            </Overlay>
          </RouterWithRedux>
        </MenuContext>
      </StyleProvider>
    )
  }


  // render () {
  //   const routes = this.props.routes
  //   return (
  //     <StyleProvider style={getTheme(platform)}>
  //       <MenuContext style={{flex: 1}}>
  //         <RouterWithRedux style={styles.statusBarHack}>
  //           <Scene key='root' hideNavBar>
  //             <Scene hideNavBar hideTabBar type={ActionConst.RESET} key={Constants.LOGIN} component={LoginConnector} title='login' animation={'fade'} duration={600} initial username={this.props.username} />
  //
  //               <Scene hideNavBar hideTabBar key={Constants.EDGE} component={LayoutConnector} routes={routes} animation={'fade'} duration={600}>
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.CHANGE_PASSWORD}   component={ChangePasswordConnector}   title='Change Password' animation={'fade'} duration={600} />
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.CHANGE_PIN}        component={ChangePinConnector}        title='Change Pin' animation={'fade'} duration={600} />
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.RECOVER_PASSWORD}  component={PasswordRecoveryConnector} title='Password Recovery' animation={'fade'} duration={600} />
  //
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.WALLET_LIST}   component={WalletList}   title='Wallets'       animation={'fade'} duration={600} initial/>
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.CREATE_WALLET} component={CreateWallet} title='Create Wallet' animation={'fade'} duration={600} />
  //
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.TRANSACTION_LIST}    component={TransactionListConnector} title='Transactions'        animation={'fade'} duration={600} />
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.TRANSACTION_DETAILS} component={TransactionDetails}       title='Transaction Details' animation={'fade'} duration={600} />
  //
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.SCAN}              component={Scan}             title='Scan'              animation={'fade'} duration={600} />
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.SEND_CONFIRMATION} component={SendConfirmation} title='Send Confirmation' animation={'fade'} duration={600} />
  //
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.REQUEST} component={Request} title='Request' animation={'fade'} duration={600} />
  //
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.SETTINGS_OVERVIEW} component={SettingsOverview} title='Settings' animation={'fade'} duration={600} />
  //
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.BTC_SETTINGS} component={CurrencySettings} currencyCode={'BTC'} pluginName={'bitcoin'}     title='BTC Settings' animation={'fade'} duration={600} />
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.BCH_SETTINGS} component={CurrencySettings} currencyCode={'BCH'} pluginName={'bitcoinCash'} title='BCH Settings' animation={'fade'} duration={600} />
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.ETH_SETTINGS} component={CurrencySettings} currencyCode={'ETH'} pluginName={'ethereum'}    title='ETH Settings' animation={'fade'} duration={600} />
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key={Constants.LTC_SETTINGS} component={CurrencySettings} currencyCode={'LTC'} pluginName={'litecoin'}    title='LTC Settings' animation={'fade'} duration={600} />
  //
  //                 <Scene hideNavBar hideTabBar type={ActionConst.REPLACE} key='defaultFiatSetting' component={DefaultFiatSettingConnector} title='Default Fiat' animation={'fade'} duration={600} />
  //
  //               </Scene>
  //             </Scene>
  //           </RouterWithRedux>
  //
  //       </MenuContext>
  //     </StyleProvider>
  //   )
  // }

  _keyboardDidShow = (event) => {
    let keyboardHeight = event.endCoordinates.height
    this.props.setKeyboardHeight(keyboardHeight)
  }

  _keyboardDidHide = () => {
    this.props.setKeyboardHeight(0)
  }
}
