// @flow

import { bitcoinCurrencyPluginFactory, bitcoincashCurrencyPluginFactory, dashCurrencyPluginFactory, litecoinCurrencyPluginFactory } from 'edge-currency-bitcoin'
import { ethereumCurrencyPluginFactory } from 'edge-currency-ethereum'
import { coinbasePlugin, shapeshiftPlugin, coincapPlugin } from 'edge-exchange-plugins'
import type { EdgeContext, EdgeContextCallbacks, EdgeCurrencyPlugin, EdgeCorePluginFactory } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, Keyboard, Linking, Platform, StatusBar, TouchableWithoutFeedback } from 'react-native'
import HockeyApp from 'react-native-hockeyapp'
import Locale from 'react-native-locale'
import { Actions, Drawer, Modal, Overlay, Router, Scene, Stack, Tabs } from 'react-native-router-flux'
import SplashScreen from 'react-native-smart-splash-screen'
import { MenuProvider } from 'react-native-popup-menu'
// $FlowFixMe
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator'
import { connect } from 'react-redux'
import * as URI from 'uri-js'

import ENV from '../../env.json'
import MenuIcon from '../assets/images/MenuButton/menu.png'
import exchangeIconSelected from '../assets/images/tabbar/exchange_selected.png'
import exchangeIcon from '../assets/images/tabbar/exchange.png'
import receiveIconSelected from '../assets/images/tabbar/receive_selected.png'
import receiveIcon from '../assets/images/tabbar/receive.png'
import scanIconSelected from '../assets/images/tabbar/scan_selected.png'
import scanIcon from '../assets/images/tabbar/scan.png'
import walletIconSelected from '../assets/images/tabbar/wallets_selected.png'
import walletIcon from '../assets/images/tabbar/wallets.png'
import ExchangeDropMenu from '../connectors/components/HeaderMenuExchangeConnector'
import RequestDropMenu from '../connectors/components/HeaderMenuRequestConnector'
import ExchangeConnector from '../connectors/scene/CryptoExchangeSceneConnector'
import EdgeLoginSceneConnector from '../connectors/scene/EdgeLoginSceneConnector'
import OtpSettingsSceneConnector from '../connectors/scene/OtpSettingsSceneConnector.js'
import PasswordRecoveryConnector from '../connectors/scene/PasswordRecoveryConnector.js'
import * as Constants from '../constants/indexConstants'
import { setIntlLocale } from '../locales/intl'
import s, { selectLocale } from '../locales/strings.js'
import { makeCoreContext } from '../util/makeContext.js'
import * as CONTEXT_API from './Core/Context/api'
import { styles } from './style.js'
import AutoLogout from './UI/components/AutoLogout/AutoLogoutConnector'
import ControlPanel from './UI/components/ControlPanel/ControlPanelConnector'
import ErrorAlert from './UI/components/ErrorAlert/ErrorAlertConnector'
import T from './UI/components/FormattedText'
import BackButton from './UI/components/Header/Component/BackButton.ui'
import HelpButton from './UI/components/Header/Component/HelpButtonConnector'
import Header from './UI/components/Header/Header.ui'
import HelpModal from './UI/components/HelpModal'
import TransactionAlert from './UI/components/TransactionAlert/TransactionAlertConnector'
import { CAMERA, CONTACTS, type Permission } from './UI/permissions.js'
import AddToken from './UI/scenes/AddToken/AddTokenConnector.js'
import ChangeMiningFeeExchange from './UI/scenes/ChangeMiningFee/ChangeMiningFeeExchangeConnector.ui'
import ChangeMiningFeeSendConfirmation from './UI/scenes/ChangeMiningFee/ChangeMiningFeeSendConfirmationConnector.ui'
import ChangePasswordConnector from './UI/scenes/ChangePinPassword/ChangePasswordConnector.ui'
import ChangePinConnector from './UI/scenes/ChangePinPassword/ChangePinConnector.ui'
import { CreateWalletName } from './UI/scenes/CreateWallet/CreateWalletName.ui.js'
import { CreateWalletReview } from './UI/scenes/CreateWallet/CreateWalletReviewConnector'
import { CreateWalletSelectCrypto } from './UI/scenes/CreateWallet/CreateWalletSelectCryptoConnector'
import { CreateWalletSelectFiat } from './UI/scenes/CreateWallet/CreateWalletSelectFiatConnector'
import EditToken from './UI/scenes/EditToken'
import LoginConnector from './UI/scenes/Login/LoginConnector'
import ManageTokens from './UI/scenes/ManageTokens'
import Request from './UI/scenes/Request/index'
import Scan from './UI/scenes/Scan/ScanConnector'
import SendConfirmation from './UI/scenes/SendConfirmation/index'
import SendConfirmationOptions from './UI/scenes/SendConfirmation/SendConfirmationOptionsConnector.js'
import CurrencySettings from './UI/scenes/Settings/CurrencySettingsConnector'
import DefaultFiatSettingConnector from './UI/scenes/Settings/DefaultFiatSettingConnector'
import SettingsOverview from './UI/scenes/Settings/SettingsOverviewConnector'
import TransactionDetails from './UI/scenes/TransactionDetails/TransactionDetailsConnector.js'
import TransactionListConnector from './UI/scenes/TransactionList/TransactionListConnector'
import { HwBackButtonHandler } from './UI/scenes/WalletList/components/HwBackButtonHandler'
import WalletList from './UI/scenes/WalletList/WalletListConnector'
import { ContactsLoaderConnecter as ContactsLoader } from './UI/components/ContactsLoader/indexContactsLoader.js'

const pluginFactories: Array<EdgeCorePluginFactory> = [
  // Exchanges:
  coinbasePlugin,
  shapeshiftPlugin,
  coincapPlugin,
  // Currencies:
  bitcoincashCurrencyPluginFactory,
  bitcoinCurrencyPluginFactory,
  dashCurrencyPluginFactory,
  ethereumCurrencyPluginFactory,
  litecoinCurrencyPluginFactory
]

const localeInfo = Locale.constants() // should likely be moved to login system and inserted into Redux

const HOCKEY_APP_ID = Platform.select(ENV.HOCKEY_APP_ID)
global.etherscanApiKey = ENV.ETHERSCAN_API_KEY

const RouterWithRedux = connect()(Router)

StatusBar.setBarStyle('light-content', true)

const tabBarIconFiles: { [tabName: string]: string } = {}
tabBarIconFiles[Constants.WALLET_LIST] = walletIcon
tabBarIconFiles[Constants.REQUEST] = receiveIcon
tabBarIconFiles[Constants.SCAN] = scanIcon
tabBarIconFiles[Constants.TRANSACTION_LIST] = exchangeIcon
tabBarIconFiles[Constants.EXCHANGE] = exchangeIcon

const tabBarIconFilesSelected: { [tabName: string]: string } = {}
tabBarIconFilesSelected[Constants.WALLET_LIST] = walletIconSelected
tabBarIconFilesSelected[Constants.REQUEST] = receiveIconSelected
tabBarIconFilesSelected[Constants.SCAN] = scanIconSelected
tabBarIconFilesSelected[Constants.TRANSACTION_LIST] = exchangeIconSelected
tabBarIconFilesSelected[Constants.EXCHANGE] = exchangeIconSelected

const TRANSACTION_DETAILS = s.strings.title_transaction_details
const WALLETS = s.strings.title_wallets
const CREATE_WALLET_SELECT_CRYPTO = s.strings.title_create_wallet_select_crypto
const CREATE_WALLET_SELECT_FIAT = s.strings.title_create_wallet_select_fiat
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
const OTP = s.strings.title_otp
const DEFAULT_FIAT = s.strings.title_default_fiat

type Props = {
  requestPermission: (permission: Permission) => void,
  username?: string,
  addCurrencyPlugin: EdgeCurrencyPlugin => void,
  setKeyboardHeight: number => void,
  addContext: EdgeContext => void,
  addUsernames: (Array<string>) => void,
  setDeviceDimensions: any => void,
  dispatchEnableScan: () => void,
  dispatchDisableScan: () => void,
  urlReceived: string => void,
  updateCurrentSceneKey: (string) => void,
  contextCallbacks: EdgeContextCallbacks
}
type State = {
  context: ?EdgeContext
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
    makeCoreContext(this.props.contextCallbacks, pluginFactories).then(context => {
      // Put the context into Redux:
      this.props.addContext(context)

      CONTEXT_API.listUsernames(context).then(usernames => {
        this.props.addUsernames(usernames)
      })
      setIntlLocale(localeInfo)
      selectLocale('enUS')
      SplashScreen.close({
        animationType: SplashScreen.animationType.fade,
        duration: 850,
        delay: 500
      })
    })
    Linking.getInitialURL()
      .then(url => {
        if (url) {
          this.doDeepLink(url)
        }
        // this.navigate(url);
      })
      .catch(e => console.log(e))
    Linking.addEventListener('url', this.handleOpenURL)
  }
  doDeepLink (url: string) {
    const parsedUri = URI.parse(url)
    const query = parsedUri.query
    if (!query.includes('token=')) {
      return
    }
    const splitArray = query.split('token=')
    const nextString = splitArray[1]
    const finalArray = nextString.split('&')
    const token = finalArray[0]
    this.props.urlReceived(token)
  }
  handleOpenURL = (event: Object) => {
    this.doDeepLink(event.url)
  }

  render () {
    return (
      <MenuProvider style={styles.mainMenuContext}>
        <RouterWithRedux backAndroidHandler={this.handleBack}>
          <Overlay>
            <Modal hideNavBar transitionConfig={() => ({ screenInterpolator: CardStackStyleInterpolator.forFadeFromBottomAndroid })}>
              {/* <Lightbox> */}
              <Stack key={Constants.ROOT} hideNavBar panHandlers={null}>
                <Scene key={Constants.LOGIN} initial component={LoginConnector} username={this.props.username} />

                <Scene
                  key={Constants.TRANSACTION_DETAILS}
                  navTransparent={true}
                  onEnter={() => this.props.requestPermission(CONTACTS)}
                  clone
                  component={TransactionDetails}
                  renderTitle={this.renderTitle(TRANSACTION_DETAILS)}
                  renderLeftButton={this.renderBackButton()}
                  renderRightButton={this.renderMenuButton()}
                />

                <Drawer key={Constants.EDGE} hideNavBar contentComponent={ControlPanel} hideDrawerButton={true} drawerPosition="right">
                  {/* Wrapper Scene needed to fix a bug where the tabs would reload as a modal ontop of itself */}
                  <Scene hideNavBar>
                    <Tabs
                      key={Constants.EDGE}
                      swipeEnabled={true}
                      navTransparent={true}
                      tabBarPosition={'bottom'}
                      showLabel={true}
                      tabBarStyle={styles.footerTabStyles}
                    >
                      <Stack key={Constants.WALLET_LIST} icon={this.icon(Constants.WALLET_LIST)} tabBarLabel={WALLETS}>
                        <Scene
                          key={Constants.WALLET_LIST_SCENE}
                          navTransparent={true}
                          component={WalletList}
                          renderTitle={this.renderTitle(WALLETS)}
                          renderLeftButton={this.renderHelpButton()}
                          renderRightButton={this.renderMenuButton()}
                        />

                        <Scene
                          key={Constants.CREATE_WALLET_NAME}
                          navTransparent={true}
                          component={CreateWalletName}
                          renderTitle={this.renderTitle(CREATE_WALLET)}
                          renderLeftButton={this.renderBackButton(WALLETS)}
                          renderRightButton={this.renderEmptyButton()}
                        />

                        <Scene
                          key={Constants.CREATE_WALLET_SELECT_CRYPTO}
                          navTransparent={true}
                          component={CreateWalletSelectCrypto}
                          renderTitle={this.renderTitle(CREATE_WALLET_SELECT_CRYPTO)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton()}
                        />

                        <Scene
                          key={Constants.CREATE_WALLET_SELECT_FIAT}
                          navTransparent={true}
                          component={CreateWalletSelectFiat}
                          renderTitle={this.renderTitle(CREATE_WALLET_SELECT_FIAT)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton()}
                        />

                        <Scene
                          key={Constants.CREATE_WALLET_REVIEW}
                          navTransparent={true}
                          component={CreateWalletReview}
                          renderTitle={this.renderTitle(CREATE_WALLET)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton()}
                        />

                        <Scene
                          key={Constants.TRANSACTION_LIST}
                          onEnter={() => {
                            this.props.requestPermission(CONTACTS)
                            this.props.updateCurrentSceneKey(Constants.TRANSACTION_LIST)
                          }}
                          navTransparent={true}
                          component={TransactionListConnector}
                          renderTitle={this.renderWalletListNavBar()}
                          renderLeftButton={this.renderBackButton(WALLETS)}
                          renderRightButton={this.renderMenuButton()}
                        />

                        <Scene
                          key={Constants.MANAGE_TOKENS}
                          renderLeftButton={this.renderBackButton()}
                          navTransparent={true}
                          component={ManageTokens}
                          renderTitle={this.renderTitle(MANAGE_TOKENS)}
                          renderRightButton={this.renderEmptyButton()}
                          animation={'fade'}
                          duration={600}
                        />
                        <Scene
                          key={Constants.ADD_TOKEN}
                          component={AddToken}
                          navTransparent={true}
                          onLeft={Actions.pop}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton()}
                          renderTitle={this.renderTitle(ADD_TOKEN)}
                        />
                        <Scene
                          key={Constants.EDIT_TOKEN}
                          component={EditToken}
                          navTransparent={true}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderEmptyButton()}
                          renderTitle={this.renderTitle(EDIT_TOKEN)}
                        />
                      </Stack>

                      <Scene
                        key={Constants.REQUEST}
                        navTransparent={true}
                        icon={this.icon(Constants.REQUEST)}
                        tabBarLabel={REQUEST}
                        component={Request}
                        renderTitle={this.renderWalletListNavBar()}
                        renderLeftButton={this.renderRequestMenuButton()}
                        renderRightButton={this.renderMenuButton()}
                      />

                      <Stack key={Constants.SCAN} icon={this.icon(Constants.SCAN)} tabBarLabel={SEND}>
                        <Scene
                          key={Constants.SCAN_NOT_USED}
                          navTransparent={true}
                          onEnter={() => {
                            this.props.requestPermission(CAMERA)
                            this.props.dispatchEnableScan()
                          }}
                          onExit={this.props.dispatchDisableScan}
                          component={Scan}
                          renderTitle={this.renderWalletListNavBar()}
                          renderLeftButton={this.renderHelpButton()}
                          renderRightButton={this.renderMenuButton()}
                        />
                        <Scene
                          key={Constants.EDGE_LOGIN}
                          navTransparent={true}
                          component={EdgeLoginSceneConnector}
                          renderTitle={this.renderTitle(EDGE_LOGIN)}
                          renderLeftButton={this.renderHelpButton()}
                          renderRightButton={this.renderEmptyButton()}
                        />
                      </Stack>

                      <Stack key={Constants.EXCHANGE} icon={this.icon(Constants.EXCHANGE)} tabBarLabel={EXCHANGE}>
                        <Scene
                          key={Constants.EXCHANGE_NOT_USED}
                          navTransparent={true}
                          component={ExchangeConnector}
                          renderTitle={this.renderTitle(EXCHANGE)}
                          renderLeftButton={this.renderExchangeButton()}
                          renderRightButton={this.renderMenuButton()}
                        />
                        <Scene
                          key={Constants.CHANGE_MINING_FEE_EXCHANGE}
                          navTransparent={true}
                          component={ChangeMiningFeeExchange}
                          renderTitle={this.renderTitle(CHANGE_MINING_FEE)}
                          renderLeftButton={this.renderBackButton()}
                          renderRightButton={this.renderHelpButton()}
                        />
                      </Stack>
                    </Tabs>

                    <Stack key={Constants.SEND_CONFIRMATION} hideTabBar>
                      <Scene
                        key={Constants.SEND_CONFIRMATION_NOT_USED}
                        navTransparent={true}
                        hideTabBar
                        panHandlers={null}
                        component={SendConfirmation}
                        renderTitle={this.renderTitle(SEND_CONFIRMATION)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderSendConfirmationButton()}
                      />
                      <Scene
                        key={Constants.CHANGE_MINING_FEE_SEND_CONFIRMATION}
                        navTransparent={true}
                        component={ChangeMiningFeeSendConfirmation}
                        renderTitle={this.renderTitle(CHANGE_MINING_FEE)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderHelpButton()}
                      />
                    </Stack>

                    <Stack key={Constants.MANAGE_TOKENS} hideTabBar>
                      <Scene
                        key={Constants.MANAGE_TOKENS_NOT_USED}
                        navTransparent={true}
                        component={ManageTokens}
                        renderTitle={this.renderTitle(MANAGE_TOKENS)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />

                      <Scene
                        key={Constants.ADD_TOKEN}
                        navTransparent={true}
                        component={AddToken}
                        renderTitle={this.renderTitle(ADD_TOKEN)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />
                    </Stack>

                    <Stack key={Constants.SETTINGS_OVERVIEW_TAB} hideDrawerButton={true}>
                      <Scene
                        key={Constants.SETTINGS_OVERVIEW}
                        navTransparent={true}
                        component={SettingsOverview}
                        renderTitle={this.renderTitle(SETTINGS)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />
                      <Scene
                        key={Constants.CHANGE_PASSWORD}
                        navTransparent={true}
                        component={ChangePasswordConnector}
                        renderTitle={this.renderTitle(CHANGE_PASSWORD)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />
                      <Scene
                        key={Constants.CHANGE_PIN}
                        navTransparent={true}
                        component={ChangePinConnector}
                        renderTitle={this.renderTitle(CHANGE_PIN)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />
                      <Scene
                        key={Constants.OTP_SETUP}
                        navTransparent={true}
                        component={OtpSettingsSceneConnector}
                        renderTitle={this.renderTitle(OTP)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />
                      <Scene
                        key={Constants.RECOVER_PASSWORD}
                        navTransparent={true}
                        component={PasswordRecoveryConnector}
                        renderTitle={this.renderTitle(PASSWORD_RECOVERY)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />
                      {this.renderCurrencySettings()}
                      <Scene
                        key={Constants.DEFAULT_FIAT_SETTING}
                        navTransparent={true}
                        component={DefaultFiatSettingConnector}
                        renderTitle={this.renderTitle(DEFAULT_FIAT)}
                        renderLeftButton={this.renderBackButton()}
                        renderRightButton={this.renderEmptyButton()}
                      />
                    </Stack>
                  </Scene>
                </Drawer>
              </Stack>
            </Modal>
          </Overlay>
        </RouterWithRedux>
        <HelpModal style={{ flex: 1 }} />
        <ErrorAlert />
        <TransactionAlert />
        <AutoLogout />
        <ContactsLoader />
      </MenuProvider>
    )
  }

  renderCurrencySettings = () => {
    const settings = []
    for (const key in Constants.CURRENCY_SETTINGS) {
      const { pluginName, currencyCode } = Constants.CURRENCY_SETTINGS[key]
      const title = s.strings[`title_${pluginName}_settings`]
      settings.push(
        <Scene
          key={key}
          pluginName={pluginName}
          currencyCode={currencyCode}
          navTransparent={true}
          component={CurrencySettings}
          renderTitle={this.renderTitle(title || pluginName)}
          renderLeftButton={this.renderBackButton()}
          renderRightButton={this.renderEmptyButton()}
        />
      )
    }
    return settings
  }

  renderWalletListNavBar = () => {
    return <Header />
  }

  renderEmptyButton = () => {
    return <BackButton />
  }

  renderHelpButton = () => {
    return <HelpButton />
  }

  renderBackButton = (label: string = BACK) => {
    return <BackButton withArrow onPress={this.handleBack} label={label} />
  }

  renderTitle = (title: string) => {
    return <T style={styles.titleStyle}>{title}</T>
  }

  renderMenuButton = () => {
    return (
      <TouchableWithoutFeedback onPress={Actions.drawerOpen}>
        <Image source={MenuIcon} />
      </TouchableWithoutFeedback>
    )
  }

  renderExchangeButton = () => {
    return <ExchangeDropMenu />
  }

  renderRequestMenuButton = () => {
    return <RequestDropMenu />
  }

  renderSendConfirmationButton = () => {
    return <SendConfirmationOptions />
  }

  icon = (tabName: string) => (props: { focused: boolean }) => {
    if (typeof tabBarIconFiles[tabName] === 'undefined' || typeof tabBarIconFilesSelected[tabName] === 'undefined') {
      throw new Error('Invalid tabbar name')
    }
    let imageFile
    if (props.focused) {
      imageFile = tabBarIconFilesSelected[tabName]
    } else {
      imageFile = tabBarIconFiles[tabName]
    }
    return <Image source={imageFile} />
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
    if (this.isCurrentScene(Constants.LOGIN)) {
      return false
    }
    if (this.isCurrentScene(Constants.WALLET_LIST_SCENE)) {
      return HwBackButtonHandler()
    }
    Actions.pop()
    return true
  }
}
