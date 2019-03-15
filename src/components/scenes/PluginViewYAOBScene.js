// @flow

import React from 'react'
import { BackHandler, Platform, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import { Bridge } from 'yaob'

import ENV from '../../../env.json'
import { sendConfirmationUpdateTx } from '../../actions/SendConfirmationActions'
import { selectWallet } from '../../actions/WalletActions'
import { javascript } from '../../lib/bridge/injectThisInWebView.js'
import s from '../../locales/strings.js'
import * as CORE_SELECTORS from '../../modules/Core/selectors.js'
import { openABAlert } from '../../modules/UI/components/ABAlert/action'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import BackButton from '../../modules/UI/components/Header/Component/BackButton.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { EdgeProvider } from '../../modules/UI/scenes/Plugins/bridgeApi'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import styles from '../../styles/scenes/PluginsStyle.js'
import type { BuySellPlugin } from '../../types'

const BACK = s.strings.title_back

type PluginProps = {
  plugin: BuySellPlugin,
  navigation: any,
  showAlert: Function,
  account: any,
  guiWallet: any,
  coreWallet: any,
  coreWallets: any,
  wallets: any,
  walletName: any,
  walletId: any,
  currentState: any,
  thisDispatch: Function,
  selectWallet(string, string): void,
  sendConfirmationUpdateTx(GuiMakeSpendInfo): void
}

type PluginState = {
  showWalletList: any
}
function handleMyClick () {
  EdgeProvider.handleBack()
}

export function renderYaobPluginBackButton (label: string = BACK) {
  return <BackButton withArrow onPress={handleMyClick} label={label} />
}

class PluginView extends React.Component<PluginProps, PluginState> {
  plugin: any
  webview: any
  yaobBridge: Bridge
  counter: number
  constructor (props) {
    super(props)
    this.state = {
      showWalletList: false
    }
    console.log('pvs: YAOB')
    this.counter = 0
    this.webview = null
    this.plugin = this.props.plugin
    this.plugin.environment.apiKey = ENV.PLUGIN_API_KEYS ? ENV.PLUGIN_API_KEYS[this.plugin.name] : 'edgeWallet' // latter is dummy code
  }

  backButtonClickHandler = arg => {
    if (!this.webview) return

    if (arg) {
      this.webview.injectJavaScript('window.history.back()')
      return
    }
    Actions.pop()
  }
  componentDidMount () {
    BackHandler.addEventListener('hardwareBackPress', EdgeProvider.handleBack)
  }

  componentWillUnmount () {
    BackHandler.removeEventListener('hardwareBackPress', EdgeProvider.handleBack)
  }

  _renderWebView = () => {
    return this.plugin.sourceFile
  }

  _renderTitle = title => {
    Actions.refresh({
      renderTitle: (
        <View style={styles.titleWrapper}>
          <T style={styles.titleStyle}>{title}</T>
        </View>
      )
    })
  }

  _onMessage = event => {
    if (!this.webview) {
      return
    }
    let data = null
    try {
      data = JSON.parse(event.nativeEvent.data)
      this.yaobBridge.handleMessage(data)
    } catch (e) {
      console.log('this was the E. so there ')
      console.log(e)
      // return
    }
  }

  _setWebview = webview => {
    this.webview = webview
  }

  webviewLoaded = () => {
    if (!this.webview) return
    this.yaobBridge = new Bridge({
      sendMessage: message => this.webview.injectJavaScript(`window.bridge.handleMessage(${JSON.stringify(message)})`)
    })
    const edgeProvider = new EdgeProvider(this.props.plugin, this.props.currentState, this.props.thisDispatch, this.backButtonClickHandler)
    this.yaobBridge.sendRoot(edgeProvider)
  }

  _onNavigationStateChange = navState => {
    if (navState.loading) {
      return
    }
    if (!navState.canGoForward) {
      EdgeProvider.navStackPush(navState.url)
    } else if (!navState.canGoBack) {
      EdgeProvider.navStackClear()
    }
  }
  render () {
    const contentScaling = Platform.OS !== 'ios'
    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <WebView
          allowFileAccess
          allowUniversalAccessFromFileURLs
          onMessage={this._onMessage}
          onLoadEnd={this.webviewLoaded}
          javaScriptEnabled={true}
          injectedJavaScript={javascript}
          onNavigationStateChange={this._onNavigationStateChange}
          originWhitelist={['file://', 'https://', 'http://', 'edge://']}
          ref={this._setWebview}
          scalesPageToFit={contentScaling}
          source={this._renderWebView()}
          userAgent={
            'Mozilla/5.0 (Linux; Android 6.0.1; SM-G532G Build/MMB29T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.83 Mobile Safari/537.36'
          }
          setWebContentsDebuggingEnabled={true}
        />
      </SafeAreaView>
    )
  }
}

const mapStateToProps = state => {
  const account = CORE_SELECTORS.getAccount(state)
  const guiWallet = UI_SELECTORS.getSelectedWallet(state)
  const coreWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const coreWallets = state.core.wallets.byId
  const wallets = state.ui.wallets.byId
  const walletName = coreWallet.name
  const walletId = coreWallet.id
  const currentState = state
  return {
    account,
    guiWallet,
    coreWallet,
    coreWallets,
    wallets,
    walletName,
    walletId,
    currentState
  }
}

const mapDispatchToProps = dispatch => ({
  showAlert: alertSyntax => dispatch(openABAlert('OPEN_AB_ALERT', alertSyntax)),
  selectWallet: (walletId: string, currencyCode: string) => dispatch(selectWallet(walletId, currencyCode)),
  sendConfirmationUpdateTx: (info: GuiMakeSpendInfo) => dispatch(sendConfirmationUpdateTx(info)),
  thisDispatch: dispatch
})

const PluginViewYAOBConnect = connect(
  mapStateToProps,
  mapDispatchToProps
)(PluginView)
export { PluginViewYAOBConnect }
