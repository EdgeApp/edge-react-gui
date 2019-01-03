// @flow

import React from 'react'
import { BackHandler, FlatList, Image, Platform, Text, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'

import { selectWallet } from '../../actions/WalletActions'
import s from '../../locales/strings.js'
import * as CORE_SELECTORS from '../../modules/Core/selectors.js'
import { openABAlert } from '../../modules/UI/components/ABAlert/action'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import BackButton from '../../modules/UI/components/Header/Component/BackButton.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { PluginBridge, pop as pluginPop } from '../../modules/UI/scenes/Plugins/api'
import { buySellPlugins, spendPlugins } from '../../modules/UI/scenes/Plugins/plugins'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import styles from '../../styles/scenes/PluginsStyle.js'

const BACK = s.strings.title_back

type PluginListProps = {}

type PluginListState = {
  data: Array<Object>
}

class PluginList extends React.Component<PluginListProps, PluginListState> {
  constructor (props) {
    super(props)
    this.state = {
      data: []
    }
  }

  _onPress = plugin => {
    Actions.plugin({ plugin: plugin })
  }

  _renderPlugin = ({ item }) => (
    <TouchableWithoutFeedback onPress={() => this._onPress(item)}>
      <View style={styles.pluginRow}>
        <View style={styles.pluginBox}>
          <View style={styles.pluginLeft}>
            <View style={[styles.logo]}>{item.imageUrl && <Image style={{ height: '100%' }} source={{ uri: item.imageUrl }} />}</View>
            <View style={styles.textBoxWrap}>
              <Text style={styles.titleBox}>{item.name}</Text>
              <Text style={styles.subtitleBox}>{item.subtitle}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )

  render () {
    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          <FlatList data={this.state.data} renderItem={this._renderPlugin} keyExtractor={item => item.name} />
        </View>
      </SafeAreaView>
    )
  }
}

class PluginBuySell extends PluginList {
  componentDidMount () {
    this.setState({
      data: buySellPlugins()
    })
  }
}

class PluginSpend extends PluginList {
  componentDidMount () {
    this.setState({
      data: spendPlugins()
    })
  }
}

type PluginProps = {
  plugin: any,
  navigation: any,
  showAlert: Function,
  account: any,
  guiWallet: any,
  abcWallet: any,
  coreWallets: any,
  wallets: any,
  walletName: any,
  walletId: any,
  selectWallet(string, string): void
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

  constructor (props) {
    super(props)
    this.state = {
      showWalletList: false
    }
    this.webview = null
    this.plugin = this.props.plugin
    this.updateBridge(this.props)
  }

  updateBridge (props) {
    console.log('Props ', this.props)
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
      renderTitle: this._renderTitle
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
    this.bridge.context.account = this.props.account
    this.bridge.context.coreWallets = this.props.coreWallets
    this.bridge.context.wallets = this.props.wallets
    this.bridge.context.walletName = this.props.walletName
    this.bridge.context.walletId = this.props.abcWallet.id
    this.bridge.context.wallet = this.props.abcWallet
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
    this.webview.injectJavaScript('window.history.back()')
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
    this.webview.injectJavaScript(`window.PLUGIN_RETURN('${JSON.stringify(data)}')`)
  }

  _nextMessage = datastr => {
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
    this._nextMessage(cbid)

    if (this.bridge[func]) {
      this.bridge[func](data)
        .then(res => {
          this._pluginReturn({ cbid, func, err: null, res })
        })
        .catch(err => {
          this._pluginReturn({ cbid, func, err, res: null })
        })
    } else {
      this._pluginReturn({ cbid, func, err: 'invalid function' })
    }
  }

  _setWebview = webview => {
    this.webview = webview
  }

  _onNavigationStateChange = navState => {
    console.log('PVS: returning state. ', navState)
    if (navState.loading) {
      return
    }
    // TODO: improve handling of edge-ret URIs
    if (navState.url.match(/edge:\/\/x-callback-url\/paymentURI/)) {
      // ski[p this and use the url parse.
      console.log('stop: evaluate')
      // send full UIR into scan actions. -> possibly to the scanner.. url.parse
      // look at scan scene parse -> anstract it. - makeSpendInfo can add onDone
      return
    }

    if (navState.url.match(/edge-ret:\/\/plugins/)) {
      Actions.pop()
      return
    }
    if (!navState.canGoForward) {
      this.bridge.navStackPush(navState.url)
    } else if (!navState.canGoBack) {
      this.bridge.navStackClear()
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
          onNavigationStateChange={this._onNavigationStateChange}
          originWhitelist={['file://', 'https://', 'http://', 'edge://']}
          ref={this._setWebview}
          scalesPageToFit={contentScaling}
          source={this._renderWebView()}
          setWebContentsDebuggingEnabled={true}
        />
      </SafeAreaView>
    )
  }
}

const mapStateToProps = state => {
  const account = CORE_SELECTORS.getAccount(state)
  const guiWallet = UI_SELECTORS.getSelectedWallet(state)
  const abcWallet = CORE_SELECTORS.getWallet(state, guiWallet.id)
  const coreWallets = state.core.wallets.byId
  const wallets = state.ui.wallets.byId
  const walletName = abcWallet.name
  const walletId = abcWallet.id
  console.log('Stop')
  return {
    account,
    guiWallet,
    abcWallet,
    coreWallets,
    wallets,
    walletName,
    walletId
  }
}

const mapDispatchToProps = dispatch => ({
  showAlert: alertSyntax => dispatch(openABAlert('OPEN_AB_ALERT', alertSyntax)),
  selectWallet: (walletId: string, currencyCode: string) => dispatch(selectWallet(walletId, currencyCode))
})

const PluginViewConnect = connect(
  mapStateToProps,
  mapDispatchToProps
)(PluginView)
export { PluginViewConnect, PluginBuySell, PluginSpend }
