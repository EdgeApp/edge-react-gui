// @flow

import { type EdgeMetadata } from 'edge-core-js'
import React from 'react'
import { BackHandler, Platform, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import parse from 'url-parse'
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
import { PluginBridge, pop as pluginPop } from '../../modules/UI/scenes/Plugins/api'
import { EdgeProvider } from '../../modules/UI/scenes/Plugins/EdgeProvider.js'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import type { GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'
import styles from '../../styles/scenes/PluginsStyle.js'

const BACK = s.strings.title_back

type PluginProps = {
  plugin: any,
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

export function renderPluginBackButton (label: string = BACK) {
  return <BackButton withArrow onPress={pluginPop} label={label} />
}

class PluginView extends React.Component<PluginProps, PluginState> {
  bridge: any
  plugin: any
  updateBridge: Function
  webview: any
  successUrl: ?string
  openingSendConfirmation: boolean
  yaobBridge: Bridge
  constructor (props) {
    super(props)
    console.log('pvs: Legacy')
    this.state = {
      showWalletList: false
    }
    this.webview = null
    this.plugin = this.props.plugin
    this.plugin.environment.apiKey = ENV.PLUGIN_API_KEYS ? ENV.PLUGIN_API_KEYS[this.plugin.name] : 'edgeWallet' // latter is dummy code
    this.updateBridge(this.props)
  }

  updateBridge (props) {
    this.bridge = new PluginBridge({
      plugin: props.plugin,
      account: props.account,
      coreWallets: props.coreWallets,
      wallets: props.wallets,
      walletName: props.walletName,
      walletId: props.walletId,
      navigationState: this.props.navigation.state,
      folder: props.account.pluginData,
      pluginId: this.plugin.pluginId,
      toggleWalletList: this.toggleWalletList,
      chooseWallet: this.chooseWallet,
      showAlert: this.props.showAlert,
      back: this._webviewBack,
      renderTitle: this._renderTitle,
      edgeCallBack: this.edgeCallBack
    })
  }

  chooseWallet = (walletId: string, currencyCode: string) => {
    this.props.selectWallet(walletId, currencyCode)
  }
  toggleWalletList = () => {
    this.setState({ showWalletList: !this.state.showWalletList })
  }

  handleBack = () => {
    pluginPop()
    return true
  }

  componentDidUpdate () {
    this.bridge.context.coreWallets = this.props.coreWallets
    this.bridge.context.wallets = this.props.wallets
    this.bridge.context.walletName = this.props.walletName
    this.bridge.context.walletId = this.props.coreWallet && this.props.coreWallet.id ? this.props.coreWallet.id : null
    this.bridge.context.wallet = this.props.coreWallet
  }

  componentDidMount () {
    this.bridge.componentDidMount()
    BackHandler.addEventListener('hardwareBackPress', this.handleBack)
  }

  componentWillUnmount () {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBack)
  }

  _renderWebView = () => {
    return this.plugin.sourceFile
  }

  _webviewBack = () => {
    if (!this.webview) return
    this.webview.injectJavaScript('window.history.back()')
  }
  _webviewOpenUrl = (url: string) => {
    if (!this.webview) return
    this.webview.injectJavaScript("window.open('" + url + "', '_self')")
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

  _pluginReturn = data => {
    if (!this.webview) return
    this.webview.injectJavaScript(`window.PLUGIN_RETURN('${JSON.stringify(data)}')`)
  }

  _nextMessage = datastr => {
    if (!this.webview) return
    this.webview.injectJavaScript(`window.PLUGIN_NEXT('${datastr}')`)
  }

  _onMessage = event => {
    if (!this.webview) {
      return
    }
    let data = null
    try {
      data = JSON.parse(event.nativeEvent.data)
    } catch (e) {
      console.log(e)
      return
    }
    const { cbid, func } = data
    if (!cbid && !func) {
      this.yaobBridge.handleMessage(data)
      return
    }

    this._nextMessage(cbid)
    if (this.bridge[func]) {
      this.bridge[func](data)
        .then(res => {
          this._pluginReturn({ cbid, func, err: null, res })
        })
        .catch(err => {
          this._pluginReturn({ cbid, func, err, res: null })
        })
    } else if (func === 'edgeCallBack') {
      // this is if we are taking what used to be a callback url. There is no promise to return.
      this.edgeCallBack(data)
    } else {
      this._pluginReturn({ cbid, func, err: 'invalid function' })
    }
  }

  _setWebview = webview => {
    this.webview = webview
  }
  // This is the preferred method for calling back . it does not return any promise like other bridge calls.
  edgeCallBack = data => {
    switch (data['edge-callback']) {
      case 'paymentUri':
        if (this.openingSendConfirmation) {
          return
        }
        this.openingSendConfirmation = true
        this.props.coreWallet.parseUri(data['edge-uri']).then(result => {
          if (typeof result.currencyCode === 'string' && typeof result.nativeAmount === 'string' && typeof result.publicAddress === 'string') {
            let metadata: ?EdgeMetadata = {
              name: data['edge-source'] || (result.metadata ? result.metadata.name : undefined),
              category: result.metadata ? result.metadata.category : undefined,
              notes: result.metadata ? result.metadata.notes : undefined
            }
            if (metadata && !metadata.name && !metadata.category && !metadata.notes) {
              metadata = undefined
            }
            const info: GuiMakeSpendInfo = {
              currencyCode: result.currencyCode,
              nativeAmount: result.nativeAmount,
              publicAddress: result.publicAddress,
              metadata,
              onBack: () => {
                this.openingSendConfirmation = false
              }
            }
            this.successUrl = data['x-success']
            this.bridge
              .makeSpendRequest(info)
              .then(tr => {
                this.openingSendConfirmation = false
                Actions.pop()
                if (this.successUrl) {
                  this._webviewOpenUrl(this.successUrl)
                }
              })
              .catch(e => {
                console.log(e)
              })
          }
        })
        break
    }
  }

  _onNavigationStateChange = navState => {
    if (navState.loading) {
      return
    }
    const parsedUrl = parse(navState.url, {}, true)

    // TODO: if no partners are using this we should delete
    if (parsedUrl.protocol === 'edge:' && parsedUrl.hostname === 'x-callback-url') {
      switch (parsedUrl.pathname) {
        case '/paymentUri':
          if (this.openingSendConfirmation) {
            return
          }

          this.openingSendConfirmation = true
          this.props.coreWallet.parseUri(parsedUrl.query.uri).then(result => {
            const info: GuiMakeSpendInfo = {
              currencyCode: result.currencyCode,
              nativeAmount: result.nativeAmount,
              publicAddress: result.publicAddress
            }
            this.successUrl = parsedUrl.query['x-success'] ? parsedUrl.query['x-success'] : null
            this.bridge
              .makeSpendRequest(info)
              .then(tr => {
                this.openingSendConfirmation = false
                Actions.pop()
                if (this.successUrl) {
                  this._webviewOpenUrl(this.successUrl)
                }
              })
              .catch(e => {
                console.log(e)
              })
          })
          break
        default:
          console.log('nothing yet')
      }

      return
    }
    if (parsedUrl.protocol === 'edge-ret:') {
      Actions.pop()
      return
    }
    if (parsedUrl.origin === this.successUrl) {
      this.bridge.navStackClear()
      return
    }

    if (!navState.canGoForward) {
      this.bridge.navStackPush(navState.url)
    } else if (!navState.canGoBack) {
      this.bridge.navStackClear()
    }
  }
  webviewLoaded = () => {
    this.yaobBridge = new Bridge({
      sendMessage: message => this.webview.injectJavaScript(`window.bridge.handleMessage(${JSON.stringify(message)})`)
    })
    const edgeProvider = new EdgeProvider(this.props.plugin, this.props.currentState, this.props.thisDispatch, this._webviewBack)
    this.yaobBridge.sendRoot(edgeProvider)
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
          onNavigationStateChange={this._onNavigationStateChange}
          originWhitelist={['file://', 'https://', 'http://', 'edge://']}
          ref={this._setWebview}
          injectedJavaScript={javascript}
          javaScriptEnabled={true}
          onLoadEnd={this.webviewLoaded}
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
  const coreWallet = guiWallet && guiWallet.id ? CORE_SELECTORS.getWallet(state, guiWallet.id) : null
  const coreWallets = state.core.wallets.byId
  const wallets = state.ui.wallets.byId
  const walletName = coreWallet ? coreWallet.name : null
  const walletId = coreWallet ? coreWallet.id : null
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

const LegacyPluginViewConnect = connect(
  mapStateToProps,
  mapDispatchToProps
)(PluginView)
export { LegacyPluginViewConnect }
