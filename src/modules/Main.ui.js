// @flow
import type {
  AbcContext,
  AbcContextCallbacks,
  AbcCorePlugin,
  AbcCurrencyPlugin,
  AbcContextOptions
} from 'airbitz-core-types'

import HockeyApp from 'react-native-hockeyapp'
import React, {Component} from 'react'
import {Keyboard, Platform, StatusBar, Image, AppState} from 'react-native'
import {connect} from 'react-redux'
import ControlPanel from './UI/components/ControlPanel/ControlPanelConnector'
import THEME from '../theme/variables/airbitz'

import {
  Scene,
  Router,
  Actions,
  Overlay,
  Tabs,
  Modal,
  Drawer,
  Stack
} from 'react-native-router-flux'
import {StyleProvider} from 'native-base'
import {MenuContext} from 'react-native-menu'
import getTheme from '../theme/components'
import platform from '../theme/variables/platform'
import Locale from 'react-native-locale'
import * as Constants from '../constants/indexConstants'
import LoginConnector from './UI/scenes/Login/LoginConnector'
import EdgeLoginSceneConnector from '../connectors/scene/EdgeLoginSceneConnector'
import ChangePasswordConnector from './UI/scenes/ChangePinPassword/ChangePasswordConnector.ui'
import ChangePinConnector from './UI/scenes/ChangePinPassword/ChangePinConnector.ui'
import PasswordRecoveryConnector from './UI/scenes/PasswordRecovery/PasswordRecoveryConnector.ui'
import TransactionListConnector from './UI/scenes/TransactionList/TransactionListConnector'
import HelpButton from './UI/components/Header/Component/HelpButton.ui'
import ExchangeDropMenu from '../connectors/components/HeaderMenuExchangeConnector'

import TransactionDetails from './UI/scenes/TransactionDetails/TransactionDetailsConnector.js'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/ScanConnector'
import ExchangeConnector from '../connectors/scene/CryptoExchangeSceneConnector'
import WalletList from './UI/scenes/WalletList/WalletListConnector'
import CreateWallet from './UI/scenes/CreateWallet/createWalletConnector'
import SettingsOverview from './UI/scenes/Settings/SettingsOverviewConnector'
import CurrencySettings from './UI/scenes/Settings/CurrencySettingsConnector'
import DefaultFiatSettingConnector from './UI/scenes/Settings/DefaultFiatSettingConnector'
import SendConfirmationOptions from './UI/scenes/SendConfirmation/SendConfirmationOptionsConnector.js'

// $FlowFixMe
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator'
import HelpModal from './UI/components/HelpModal'
import ErrorAlert from './UI/components/ErrorAlert/ErrorAlertConnector'
import TransactionAlert from './UI/components/TransactionAlert/TransactionAlertConnector'
import MenuIcon from '../assets/images/walletlist/sort.png'
import Header from './UI/components/Header/Header.ui'
import walletIcon from '../assets/images/tabbar/wallets.png'
import walletIconSelected from '../assets/images/tabbar/wallets_selected.png'
import receiveIcon from '../assets/images/tabbar/receive.png'
import receiveIconSelected from '../assets/images/tabbar/receive_selected.png'
import scanIcon from '../assets/images/tabbar/scan.png'
import scanIconSelected from '../assets/images/tabbar/scan_selected.png'
import exchangeIcon from '../assets/images/tabbar/exchange.png'
import exchangeIconSelected from '../assets/images/tabbar/exchange_selected.png'
import styles from './style.js'

import * as CONTEXT_API from './Core/Context/api'

import {makeFakeContexts, makeReactNativeContext} from 'airbitz-core-react-native'
import {coinbasePlugin, shapeshiftPlugin} from 'edge-exchange-plugins'
// $FlowFixMe
import {BitcoinCurrencyPluginFactory, LitecoinCurrencyPluginFactory, BitcoincashCurrencyPluginFactory} from 'edge-currency-bitcoin'
import {EthereumCurrencyPluginFactory} from 'edge-currency-ethereum'

const pluginFactories: Array<AbcCorePlugin> = [
  coinbasePlugin,
  shapeshiftPlugin
]
pluginFactories.push((EthereumCurrencyPluginFactory: any))
pluginFactories.push(BitcoinCurrencyPluginFactory)
pluginFactories.push(LitecoinCurrencyPluginFactory)
pluginFactories.push(BitcoincashCurrencyPluginFactory)

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

import ENV from '../../env.json'

const {AIRBITZ_API_KEY, SHAPESHIFT_API_KEY} = ENV
const HOCKEY_APP_ID = Platform.select(ENV.HOCKEY_APP_ID)

const RouterWithRedux = connect()(Router)

type Props = {
  username?: string,
  routes: any,
  autoLogoutTimeInSeconds: number,
  addExchangeTimer: (number) => void,
  addCurrencyPlugin: (AbcCurrencyPlugin) => void,
  setKeyboardHeight: (number) => void,
  addContext: (AbcContext) => void,
  addUsernames: (Array<string>) => void,
  setLocaleInfo: (any) => void,
  setDeviceDimensions: (any) => void,
  autoLogout: () => void,
  dispatchEnableScan: () => void,
  dispatchDisableScan: () => void,
  contextCallbacks: AbcContextCallbacks
}

type State = {
  context: ?AbcContext,
  loading: boolean,
  mainActive: boolean,
  timeout: ?number
}

StatusBar.setBarStyle('light-content', true)

const tabBarIconFiles: {[tabName: string]: string} = {}
tabBarIconFiles[Constants.WALLET_LIST] = walletIcon
tabBarIconFiles[Constants.REQUEST] = receiveIcon
tabBarIconFiles[Constants.SCAN] = scanIcon
tabBarIconFiles[Constants.TRANSACTION_LIST] = exchangeIcon
tabBarIconFiles[Constants.EXCHANGE] = exchangeIcon

const tabBarIconFilesSelected: {[tabName: string]: string} = {}
tabBarIconFilesSelected[Constants.WALLET_LIST] = walletIconSelected
tabBarIconFilesSelected[Constants.REQUEST] = receiveIconSelected
tabBarIconFilesSelected[Constants.SCAN] = scanIconSelected
tabBarIconFilesSelected[Constants.TRANSACTION_LIST] = exchangeIconSelected
tabBarIconFilesSelected[Constants.EXCHANGE] = exchangeIconSelected

function makeCoreContext (callbacks: AbcContextCallbacks): Promise<AbcContext> {
  const opts: AbcContextOptions = {
    apiKey: AIRBITZ_API_KEY,
    callbacks,
    plugins: pluginFactories,
    shapeshiftKey: SHAPESHIFT_API_KEY
  }

  if (ENV.USE_FAKE_CORE) {
    const [context] = makeFakeContexts({...opts, localFakeUser: true})
    return Promise.resolve(context)
  }

  return makeReactNativeContext(opts)
}

export default class Main extends Component<Props, State> {
  keyboardDidShowListener: any
  keyboardDidHideListener: any

  constructor (props: Props) {
    super(props)

    this.state = {
      mainActive: true,
      timeout: undefined,
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
    AppState.removeEventListener('change', this._handleAppStateChange)
    this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener.remove()
  }

  componentDidMount () {
    AppState.addEventListener('change', this._handleAppStateChange)

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
      this.setState({context, loading: false})
    })
  }

  icon = (tabName: string) => (props: {focused: boolean}) => {
    if (typeof tabBarIconFiles[tabName] === 'undefined' || typeof tabBarIconFilesSelected[tabName] === 'undefined') {
      throw new Error('Invalid tabbar name')
    }
    let imageFile
    if (props.focused) {
      imageFile = tabBarIconFilesSelected[tabName]
    } else {
      imageFile = tabBarIconFiles[tabName]
    }
    return (
      <Image source={imageFile}/>
    )
  }

  renderWalletListNavBar = () => (
    <Header/>
  )

  render () {
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={{flex: 1}}>
          <RouterWithRedux backAndroidHandler={this.handleBack}>
            <Overlay>
              <Modal hideNavBar transitionConfig={() => ({screenInterpolator: CardStackStyleInterpolator.forFadeFromBottomAndroid})}>
                {/*<Lightbox>*/}
                <Stack hideNavBar key='root' navigationBarStyle={{backgroundColor: THEME.COLORS.TRANSPARENT}} backButtonTintColor='white' titleStyle={{color: THEME.COLORS.WHITE, alignSelf: 'center'}}>
                  <Scene key={Constants.LOGIN} component={LoginConnector} title='login' animation={'fade'} duration={600} initial username={this.props.username} />
                  <Scene key={Constants.TRANSACTION_DETAILS} navTransparent={true} component={TransactionDetails} back clone title='Transaction Details' animation={'fade'} duration={600} />
                  <Drawer hideNavBar key='edge' contentComponent={ControlPanel} hideDrawerButton={true} drawerPosition='right'>
                    {/*
                     Wrapper Scene needed to fix a bug where the tabs would
                     reload as a modal ontop of itself
                     */}
                    <Scene hideNavBar>
                      {/*<Gradient>*/}
                      <Tabs key='edge' swipeEnabled={true} navTransparent={true} tabBarPosition={'bottom'} showLabel={true}>
                        <Stack key={Constants.WALLET_LIST} navigationBarStyle={{backgroundColor: THEME.COLORS.PRIMARY}} title='Wallets' icon={this.icon(Constants.WALLET_LIST)} activeTintColor={'transparent'} tabBarLabel='Wallets'>
                          <Scene key='walletList_notused' component={WalletList} navTransparent={true} title='Wallets' onRight={() => Actions.drawerOpen()} renderLeftButton={() => <HelpButton/>} rightButtonImage={MenuIcon} />
                          <Scene key={Constants.CREATE_WALLET} component={CreateWallet} title='Create Wallet' navTransparent={true} animation={'fade'} duration={600} />
                          <Scene key={Constants.TRANSACTION_LIST} tintColor={styles.backButtonColor} navTransparent={true} icon={this.icon(Constants.TRANSACTION_LIST)}renderTitle={this.renderWalletListNavBar} component={TransactionListConnector} onRight={() => Actions.drawerOpen()} rightButtonImage={MenuIcon} tabBarLabel='Transactions' title='Transactions' animation={'fade'} duration={600} />
                        </Stack>
                        <Scene key={Constants.REQUEST} renderTitle={this.renderWalletListNavBar} navTransparent={true} icon={this.icon(Constants.REQUEST)} component={Request} tabBarLabel='Request' title='Request' renderLeftButton={() => <HelpButton/>} onRight={() => Actions.drawerOpen()} rightButtonImage={MenuIcon} animation={'fade'} duration={600} />
                        <Stack key={Constants.SCAN} title='Send' navigationBarStyle={{backgroundColor: THEME.COLORS.PRIMARY}} icon={this.icon(Constants.SCAN)} tabBarLabel='Send' >
                          <Scene key='scan_notused' renderTitle={this.renderWalletListNavBar} component={Scan} onRight={() => Actions.drawerOpen()} rightButtonImage={MenuIcon} onEnter={this.props.dispatchEnableScan} onExit={this.props.dispatchDisableScan} renderLeftButton={() => <HelpButton/>} tabBarLabel='Send' title='Send' animation={'fade'} duration={600} />
                          <Scene key={Constants.EDGE_LOGIN}
                            renderTitle={'Edge Login'}
                            component={EdgeLoginSceneConnector}
                            renderLeftButton={() => <HelpButton/>}
                            animation={'fade'}
                            duration={200} />
                        </Stack>
                        <Scene key={Constants.EXCHANGE} navigationBarStyle={{backgroundColor: THEME.COLORS.PRIMARY}} icon={this.icon(Constants.EXCHANGE)} renderLeftButton={() => <ExchangeDropMenu/>} component={ExchangeConnector} onRight={() => Actions.drawerOpen()} rightButtonImage={MenuIcon} tabBarLabel='Exchange' title='Exchange' animation={'fade'} duration={600} />
                      </Tabs>
                      <Stack key={Constants.SEND_CONFIRMATION} navTransparent={true} hideTabBar title='Send Confirmation' >
                        <Scene key='sendconfirmation_notused' hideTabBar component={SendConfirmation} back title='Send Confirmation' panHandlers={null} renderRightButton={() => <SendConfirmationOptions/>} animation={'fade'} duration={600} />
                      </Stack>
                      <Stack key='settingsOverviewTab' title='Settings' navigationBarStyle={{backgroundColor: THEME.COLORS.PRIMARY}} hideDrawerButton={true} >
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

          <HelpModal style={{flex: 1}} />
          <ErrorAlert/>
          <TransactionAlert/>

        </MenuContext>
      </StyleProvider>
    )
  }

  _keyboardDidShow = (event) => {
    let keyboardHeight = event.endCoordinates.height
    this.props.setKeyboardHeight(keyboardHeight)
  }

  _keyboardDidHide = () => {
    this.props.setKeyboardHeight(0)
  }

  _handleAppStateChange = (nextAppState: 'active' | 'background' | 'inactive') => {
    if (this.foregrounded(nextAppState)) {
      // console.log('Background -> Foreground')
      // this.setState({mainActive: true})
      //
      // this.cancelAutoLogoutTimer()
    }

    if (this.backgrounded(nextAppState)) {
      // Todo: Figure out why setState() inside _handleAppStateChange crashes app upon foreground
      // console.log('Foreground -> Background')
      // this.setState({mainActive: false})
      //
      // if (this.props.autoLogoutTimeInSeconds) this.beginAutoLogoutTimer()
    }
  }

  foregrounded (nextAppState: 'active' | 'background' | 'inactive') {
    return !this.state.mainActive && nextAppState === 'active'
  }

  backgrounded (nextAppState: 'active' | 'background' | 'inactive') {
    return this.state.mainActive && nextAppState !== 'active'
  }

  beginAutoLogoutTimer () {
    const autoLogoutTimeInMilliseconds = (this.props.autoLogoutTimeInSeconds * 1000)
    const timeout = setTimeout(this.autoLogout, autoLogoutTimeInMilliseconds)
    this.setState({timeout})
  }

  cancelAutoLogoutTimer () {
    const {timeout} = this.state
    clearTimeout(timeout)
    this.setState({timeout: undefined})
  }

  autoLogout () {
    // console.log('TIMEOUT')
    this.props.autoLogout()
  }

  isCurrentScene = (sceneKey: string) => {
    return Actions.currentScene === sceneKey
  }

  handleBack = () => {
    if (!this.isCurrentScene('walletList_notused')) {
      Actions.pop()
    }
    return true
  }
}
