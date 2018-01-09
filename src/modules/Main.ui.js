// @flow

import type {
  AbcContext,
  AbcContextCallbacks,
  AbcCorePlugin,
  AbcCurrencyPlugin,
  AbcContextOptions
} from 'airbitz-core-types'
import SplashScreen from 'react-native-smart-splash-screen'
import s, { selectLocale } from '../locales/strings.js'

import HockeyApp from 'react-native-hockeyapp'
import React, {Component} from 'react'
import {Keyboard, Platform, StatusBar, Image, TouchableWithoutFeedback} from 'react-native'
import T from './UI/components/FormattedText'
import {connect} from 'react-redux'
import ControlPanel from './UI/components/ControlPanel/ControlPanelConnector'
// import THEME from '../theme/variables/airbitz'

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
import HelpButton from './UI/components/Header/Component/HelpButtonConnector'
import BackButton from './UI/components/Header/Component/BackButton.ui'
import ExchangeDropMenu from '../connectors/components/HeaderMenuExchangeConnector'

import TransactionDetails from './UI/scenes/TransactionDetails/TransactionDetailsConnector.js'
import Request from './UI/scenes/Request/index'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import Scan from './UI/scenes/Scan/ScanConnector'
import ExchangeConnector from '../connectors/scene/CryptoExchangeSceneConnector'
import WalletList from './UI/scenes/WalletList/WalletListConnector'
import CreateWallet from './UI/scenes/CreateWallet/createWalletConnector'
import ManageTokens from './UI/scenes/ManageTokens'

import AddToken from './UI/scenes/AddToken'
import EditToken from './UI/scenes/EditToken'
import SettingsOverview from './UI/scenes/Settings/SettingsOverviewConnector'
import CurrencySettings from './UI/scenes/Settings/CurrencySettingsConnector'
import DefaultFiatSettingConnector from './UI/scenes/Settings/DefaultFiatSettingConnector'
import SendConfirmationOptions from './UI/scenes/SendConfirmation/SendConfirmationOptionsConnector.js'
import ChangeMiningFeeSendConfirmation from './UI/scenes/ChangeMiningFee/ChangeMiningFeeSendConfirmationConnector.ui'
import ChangeMiningFeeExchange from './UI/scenes/ChangeMiningFee/ChangeMiningFeeExchangeConnector.ui'

// $FlowFixMe
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator'
import HelpModal from './UI/components/HelpModal'
import ErrorAlert from './UI/components/ErrorAlert/ErrorAlertConnector'
import TransactionAlert from './UI/components/TransactionAlert/TransactionAlertConnector'
import MenuIcon from '../assets/images/MenuButton/menu.png'
import Header from './UI/components/Header/Header.ui'
import walletIcon from '../assets/images/tabbar/wallets.png'
import walletIconSelected from '../assets/images/tabbar/wallets_selected.png'
import receiveIcon from '../assets/images/tabbar/receive.png'
import receiveIconSelected from '../assets/images/tabbar/receive_selected.png'
import scanIcon from '../assets/images/tabbar/scan.png'
import scanIconSelected from '../assets/images/tabbar/scan_selected.png'
import exchangeIcon from '../assets/images/tabbar/exchange.png'
import exchangeIconSelected from '../assets/images/tabbar/exchange_selected.png'
import AutoLogout from './UI/components/AutoLogout/AutoLogoutConnector'

import {styles} from './style.js'

import * as CONTEXT_API from './Core/Context/api'

import {makeFakeContexts, makeReactNativeContext} from 'airbitz-core-react-native'
import {coinbasePlugin, shapeshiftPlugin} from 'edge-exchange-plugins'
import {
  BitcoinCurrencyPluginFactory,
  BitcoincashCurrencyPluginFactory,
  LitecoinCurrencyPluginFactory,
  DashCurrencyPluginFactory
} from 'edge-currency-bitcoin'
import {EthereumCurrencyPluginFactory} from 'edge-currency-ethereum'

import ENV from '../../env.json'

const pluginFactories: Array<AbcCorePlugin> = [
  coinbasePlugin,
  shapeshiftPlugin
]
pluginFactories.push(EthereumCurrencyPluginFactory)
pluginFactories.push(BitcoinCurrencyPluginFactory)
pluginFactories.push(BitcoincashCurrencyPluginFactory)
pluginFactories.push(LitecoinCurrencyPluginFactory)
pluginFactories.push(DashCurrencyPluginFactory)

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

const {AIRBITZ_API_KEY, SHAPESHIFT_API_KEY} = ENV
const HOCKEY_APP_ID = Platform.select(ENV.HOCKEY_APP_ID)

const RouterWithRedux = connect()(Router)

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

const TRANSACTION_DETAILS = s.strings.title_transaction_details
const WALLETS = s.strings.title_wallets
const CREATE_WALLET = s.strings.title_create_wallet
const REQUEST = s.strings.title_request
const SEND = s.strings.title_send
const EDGE_LOGIN = s.strings.title_edge_login
const EXCHANGE = s.strings.title_exchange
const CHANGE_MINING_FEE = s.strings.title_change_mining_fee
const BACK = s.strings.title_back
const SEND_CONFIRMATION = s.strings.title_send_confirmation
const MANAGE_TOKENS = s.strings.title_manage_tokens
const ADD_TOKEN = s.strings.title_add_token
const EDIT_TOKEN = s.strings.title_edit_token
const SETTINGS = s.strings.title_settings
const CHANGE_PASSWORD = s.strings.title_change_password
const CHANGE_PIN = s.strings.title_change_pin
const PASSWORD_RECOVERY = s.strings.title_password_recovery
const DEFAULT_FIAT = s.strings.title_default_fiat

type Props = {
  username?: string,
  addExchangeTimer: (number) => void,
  addCurrencyPlugin: (AbcCurrencyPlugin) => void,
  setKeyboardHeight: (number) => void,
  addContext: (AbcContext) => void,
  addUsernames: (Array<string>) => void,
  setLocaleInfo: (any) => void,
  setDeviceDimensions: (any) => void,
  dispatchEnableScan: () => void,
  dispatchDisableScan: () => void,
  contextCallbacks: AbcContextCallbacks
}
type State = {
  context: ?AbcContext,
}
export default class Main extends Component<Props, State> {
  keyboardDidShowListener: any
  keyboardDidHideListener: any

  constructor (props: Props) {
    super(props)

    this.state = {
      context: undefined
    }
  }

  componentWillMount () {
    HockeyApp.configure(HOCKEY_APP_ID, true)
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow)
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this.keyboardDidHide)
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
      selectLocale('enUS')
      SplashScreen.close({
        animationType: SplashScreen.animationType.fade,
        duration: 850,
        delay: 500
      })
    })
  }

  render () {
    return (
      <StyleProvider style={getTheme(platform)}>
        <MenuContext style={styles.mainMenuContext}>
          <RouterWithRedux backAndroidHandler={this.handleBack}>
            <Overlay>
              <Modal hideNavBar transitionConfig={() => ({screenInterpolator: CardStackStyleInterpolator.forFadeFromBottomAndroid})}>
                {/* <Lightbox> */}
                <Stack key='root' hideNavBar>
                  <Scene key={Constants.LOGIN} initial
                    component={LoginConnector}
                    username={this.props.username} />

                  <Scene key={Constants.TRANSACTION_DETAILS} navTransparent={true} clone
                    component={TransactionDetails}
                    renderTitle={this.renderTitle(TRANSACTION_DETAILS)}
                    renderLeftButton={this.renderBackButton()}
                    renderRightButton={this.renderMenuButton} />

                  <Drawer key='edge' hideNavBar contentComponent={ControlPanel} hideDrawerButton={true} drawerPosition='right'>
                    {/* Wrapper Scene needed to fix a bug where the tabs would reload as a modal ontop of itself */}
                    <Scene hideNavBar>
                      <Tabs key='edge' swipeEnabled={true} navTransparent={true} tabBarPosition={'bottom'} showLabel={true}>
                        <Stack key={Constants.WALLET_LIST} icon={this.icon(Constants.WALLET_LIST)} tabBarLabel={WALLETS}>
                          <Scene key={Constants.WALLET_LIST_SCENE} navTransparent={true}
                            component={WalletList}
                            renderTitle={this.renderTitle(WALLETS)}
                            renderLeftButton={this.renderHelpButton}
                            renderRightButton={this.renderMenuButton} />

                          <Scene key={Constants.CREATE_WALLET} navTransparent={true}
                            component={CreateWallet}
                            renderTitle={this.renderTitle(CREATE_WALLET)}
                            renderLeftButton={this.renderBackButton(WALLETS)}
                            renderRightButton={this.renderEmptyButton} />

                          <Scene key={Constants.TRANSACTION_LIST} navTransparent={true}
                            component={TransactionListConnector}
                            renderTitle={this.renderWalletListNavBar}
                            renderLeftButton={this.renderBackButton(WALLETS)}
                            renderRightButton={this.renderMenuButton} />

                          <Scene key={Constants.MANAGE_TOKENS}
                            renderLeftButton={this.renderBackButton()} navTransparent={true}
                            component={ManageTokens}
                            renderTitle={this.renderTitle(MANAGE_TOKENS)}
                            renderRightButton={this.renderEmptyButton}
                            animation={'fade'} duration={600} />
                          <Scene key={Constants.ADD_TOKEN}
                            component={AddToken} navTransparent={true}
                            onLeft={Actions.pop}
                            renderLeftButton={this.renderBackButton()}
                            renderRightButton={this.renderEmptyButton}
                            renderTitle={this.renderTitle(ADD_TOKEN)} />
                          <Scene key={Constants.EDIT_TOKEN}
                            component={EditToken} navTransparent={true}
                            renderLeftButton={this.renderBackButton()}
                            renderRightButton={this.renderEmptyButton}
                            renderTitle={this.renderTitle(EDIT_TOKEN)} />
                        </Stack>

                        <Scene key={Constants.REQUEST} navTransparent={true} icon={this.icon(Constants.REQUEST)} tabBarLabel={REQUEST}
                          component={Request}
                          renderTitle={this.renderWalletListNavBar}
                          renderLeftButton={this.renderHelpButton}
                          renderRightButton={this.renderMenuButton} />

                        <Stack key={Constants.SCAN} icon={this.icon(Constants.SCAN)} tabBarLabel={SEND}>
                          <Scene key='scan_notused' navTransparent={true} onEnter={this.props.dispatchEnableScan} onExit={this.props.dispatchDisableScan}
                            component={Scan}
                            renderTitle={this.renderWalletListNavBar}
                            renderLeftButton={this.renderHelpButton}
                            renderRightButton={this.renderMenuButton} />
                          <Scene key={Constants.EDGE_LOGIN}
                            component={EdgeLoginSceneConnector}
                            renderTitle={this.renderTitle(EDGE_LOGIN)}
                            renderLeftButton={this.renderHelpButton}
                            renderRightButton={this.renderEmptyButton} />
                        </Stack>

                        <Stack key={Constants.EXCHANGE} icon={this.icon(Constants.EXCHANGE)} tabBarLabel={EXCHANGE}>
                          <Scene key='exchange_notused' navTransparent={true}
                            component={ExchangeConnector}
                            renderTitle={this.renderTitle(EXCHANGE)}
                            renderLeftButton={this.renderExchangeButton}
                            renderRightButton={this.renderMenuButton} />
                          <Scene key={Constants.CHANGE_MINING_FEE_EXCHANGE} navTransparent={true}
                            component={ChangeMiningFeeExchange}
                            renderTitle={this.renderTitle(CHANGE_MINING_FEE)}
                            renderLeftButton={this.renderBackButton()}
                            renderRightButton={this.renderHelpButton} />
                        </Stack>
                      </Tabs>

                      <Stack key={Constants.SEND_CONFIRMATION} hideTabBar>
                        <Scene key='sendconfirmation_notused' navTransparent={true} hideTabBar panHandlers={null}
                          component={SendConfirmation}
                          renderTitle={this.renderTitle(SEND_CONFIRMATION)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderSendConfirmationButton} />
                        <Scene key={Constants.CHANGE_MINING_FEE_SEND_CONFIRMATION} navTransparent={true}
                          component={ChangeMiningFeeSendConfirmation}
                          renderTitle={this.renderTitle(CHANGE_MINING_FEE)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderHelpButton} />
                      </Stack>
                      <Stack key='settingsOverviewTab' hideDrawerButton={true}>
                        <Scene key={Constants.SETTINGS_OVERVIEW} navTransparent={true}
                          component={SettingsOverview}
                          renderTitle={this.renderTitle(SETTINGS)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton} />
                        <Scene key={Constants.CHANGE_PASSWORD} navTransparent={true}
                          component={ChangePasswordConnector}
                          renderTitle={this.renderTitle(CHANGE_PASSWORD)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton} />
                        <Scene key={Constants.CHANGE_PIN} navTransparent={true}
                          component={ChangePinConnector}
                          renderTitle={this.renderTitle(CHANGE_PIN)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton} />
                        <Scene key={Constants.RECOVER_PASSWORD} navTransparent={true}
                          component={PasswordRecoveryConnector}
                          renderTitle={this.renderTitle(PASSWORD_RECOVERY)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton} />
                        {this.renderCurrencySettings()}
                        <Scene key='defaultFiatSetting' navTransparent={true}
                          component={DefaultFiatSettingConnector}
                          renderTitle={this.renderTitle(DEFAULT_FIAT)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton} />
                      </Stack>
                    </Scene>
                  </Drawer>
                </Stack>
                {/* </Lightbox> */}
              </Modal>
            </Overlay>
          </RouterWithRedux>

          <HelpModal style={{flex: 1}} />
          <ErrorAlert/>
          <TransactionAlert/>

          <AutoLogout />

        </MenuContext>
      </StyleProvider>
    )
  }

  renderCurrencySettings = () => {
    const settings = []
    for (const key in Constants.CURRENCY_SETTINGS) {
      const {pluginName, currencyCode} = Constants.CURRENCY_SETTINGS[key]
      const title = s.strings[`title_${pluginName}_settings`]
      settings.push(<Scene key={key} pluginName={pluginName} currencyCode={currencyCode} navTransparent={true}
        component={CurrencySettings}
        renderTitle={this.renderTitle(title || pluginName)}
        renderLeftButton={this.renderBackButton()}
        renderRightButton={this.renderEmptyButton} />)
    }
    return settings
  }
  renderWalletListNavBar = () => (<Header/>)
  renderEmptyButton = () => () => (<BackButton />)
  renderHelpButton = () => (<HelpButton/>)
  renderBackButton = (label: string = BACK) => () => (<BackButton withArrow onPress={this.handleBack} label={label} />)
  renderTitle = (title: string) => {
    return <T style={styles.titleStyle}>{title}</T>
  }
  renderMenuButton = () => (<TouchableWithoutFeedback onPress={Actions.drawerOpen}><Image source={MenuIcon}/></TouchableWithoutFeedback>)
  renderExchangeButton = () => (<ExchangeDropMenu/>)
  renderSendConfirmationButton = () => (<SendConfirmationOptions/>)

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

  keyboardDidShow = (event: any) => {
    const keyboardHeight = event.endCoordinates.height
    this.props.setKeyboardHeight(keyboardHeight)
  }

  keyboardDidHide = () => {
    this.props.setKeyboardHeight(0)
  }

  isCurrentScene = (sceneKey: string) => {
    return Actions.currentScene === sceneKey
  }

  handleBack = () => {
    if (!this.isCurrentScene(Constants.WALLET_LIST_SCENE)) {
      Actions.pop()
    }
    return true
  }
}

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
