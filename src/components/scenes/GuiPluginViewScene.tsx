import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'
import { Platform } from 'react-native'
import { WebView } from 'react-native-webview'
import { Bridge, onMethod } from 'yaob'

import { EdgeProvider } from '../../modules/UI/scenes/Plugins/EdgeProvider'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { connect } from '../../types/reactRedux'
import { Dispatch, RootState } from '../../types/reduxTypes'
import { NavigationBase, RouteProp } from '../../types/routerTypes'
import { javascript } from '../../util/bridge/injectThisInWebView'
import { makePluginUri } from '../../util/GuiPluginTools'
import { bestOfPlugins } from '../../util/ReferralHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { setPluginScene } from '../navigation/GuiPluginBackButton'
import { showError, showToast } from '../services/AirshipInstance'
import { requestPermissionOnSettings } from '../services/PermissionsManager'

// WebView bridge managemer --------------------------------------------

interface WebViewCallbacks {
  onMessage: (event: any) => void
  setRef: (webView: WebView | null) => void
}

/**
 * Sets up a YAOB bridge for use with a React Native WebView.
 * The returned callbacks should be passed to the `onMessage` and `ref`
 * properties of the WebView. Handles WebView reloads and related
 * race conditions.
 * @param {*} onRoot Called when the inner HTML sends a root object.
 * May be called multiple times if the inner HTML reloads.
 * @param {*} debug Set to true to enable logging.
 */
function makeOuterWebViewBridge<Root>(onRoot: (root: Root) => unknown, debug: boolean = false): WebViewCallbacks {
  let bridge: Bridge | undefined
  let gatedRoot: Root | undefined
  let webview: WebView | null = null

  // Gate the root object on the webview being ready:
  const tryReleasingRoot = () => {
    if (gatedRoot != null && webview != null) {
      onRoot(gatedRoot)
      gatedRoot = undefined
    }
  }

  // Feed incoming messages into the YAOB bridge (if any):
  // @ts-expect-error
  const onMessage = event => {
    const message = JSON.parse(event.nativeEvent.data)
    if (debug) console.info('plugin →', message)

    // This was crashing us, so send to bugsnag:
    if (bridge != null && message.events != null && typeof message.events.find !== 'function') {
      Bugsnag.notify(new Error('Corrupted yaob events'), report => {
        report.addMetadata('yaob', {
          rawData: event.nativeEvent.data,
          eventType: typeof message.events
        })
      })
    }

    // This is a terrible hack. We are using our inside knowledge
    // of YAOB's message format to determine when the client has restarted.
    // @ts-expect-error
    if (bridge != null && Array.isArray(message.events) && message.events.find(event => event.localId === 0)) {
      bridge.close(new Error('plugin: The WebView has been unmounted.'))
      bridge = undefined
    }

    // If we have no bridge, start one:
    if (bridge == null) {
      let firstMessage = true
      bridge = new Bridge({
        hideProperties: ['allKeys', 'displayPrivateSeed', 'displayPublicSeed', 'keys', 'otpKey', 'loginKey', 'publicWalletInfo', 'recoveryKey'],
        sendMessage: message => {
          if (debug) console.info('plugin ←', message)
          if (webview == null) return

          const js = `if (window.bridge != null) {${
            firstMessage ? 'window.gotFirstMessage = true;' : 'window.gotFirstMessage && '
          } window.bridge.handleMessage(${JSON.stringify(message)})}`
          firstMessage = false
          webview.injectJavaScript(js)
        }
      })

      // Use our inside knowledge of YAOB to directly
      // subscribe to the root object appearing:
      // @ts-expect-error
      onMethod.call(bridge._state, 'root', root => {
        gatedRoot = root
        tryReleasingRoot()
      })
    }

    // Finally, pass the message to the bridge:
    try {
      bridge.handleMessage(message)
    } catch (e: any) {
      console.warn('plugin bridge error: ' + String(e))
    }
  }

  // Listen for the webview component to mount:
  const setRef = (element: WebView | null) => {
    webview = element
    tryReleasingRoot()
  }

  return { onMessage, setRef }
}

// Plugin scene --------------------------------------------------------

interface OwnProps {
  navigation: NavigationBase
  route: RouteProp<'pluginView' | 'pluginViewBuy' | 'pluginViewSell'>
}

interface DispatchProps {
  dispatch: Dispatch
}
interface StateProps {
  state: RootState
}
type Props = DispatchProps & StateProps & OwnProps

interface State {
  webViewKey: number
}

interface PluginWorkerApi {
  setEdgeProvider: (provider: EdgeProvider) => Promise<unknown>
}

class GuiPluginView extends React.Component<Props, State> {
  _callbacks: WebViewCallbacks
  _canGoBack: boolean
  _edgeProvider: EdgeProvider
  _promoCode: string | undefined
  _promoMessage: string | undefined
  _webview: WebView | null = null

  constructor(props: Props) {
    const { route, dispatch, state, navigation } = props
    const { deepPath, deepQuery, plugin } = route.params
    super(props)

    // Mechanism to re-boot the webview:
    this.state = { webViewKey: 0 }
    const restartPlugin = () => {
      this.setState({ webViewKey: this.state.webViewKey + 1 })
    }

    // Set up the EdgeProvider:
    this.updatePromoCode(plugin, state)
    this._edgeProvider = new EdgeProvider(navigation, plugin, state, dispatch, restartPlugin, deepPath, deepQuery, this._promoCode)

    // Set up the WebView bridge:
    this._canGoBack = false
    this._callbacks = makeOuterWebViewBridge((root: PluginWorkerApi) => {
      root.setEdgeProvider(this._edgeProvider).catch(e => {
        console.warn('plugin setEdgeProvider error: ' + String(e))
      })
    })

    // Capture the WebView ref:
    const { setRef } = this._callbacks
    this._callbacks.setRef = (element: WebView | null) => {
      if (element == null) this._canGoBack = false
      this._webview = element
      setRef(element)
    }
  }

  componentDidMount() {
    setPluginScene(this)

    this.checkPermissions()
      .then(() => {
        const message = this._promoMessage
        if (message != null) showToast(message)
      })
      .catch(showError)
  }

  componentDidUpdate() {
    const { route, state } = this.props
    const { deepPath, deepQuery, plugin } = route.params
    this.updatePromoCode(plugin, state)
    this._edgeProvider._updateState(state, deepPath, deepQuery, this._promoCode)
  }

  updatePromoCode(plugin: GuiPlugin, state: RootState) {
    const accountPlugins = state.account.referralCache.accountPlugins
    const accountReferral = state.account.accountReferral
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, undefined)
    this._promoCode = activePlugins.promoCodes[plugin.pluginId]
    this._promoMessage = activePlugins.promoMessages[plugin.pluginId]
  }

  async checkPermissions() {
    const { route, state } = this.props
    const { plugin } = route.params
    const { permissions = [] } = plugin
    const { displayName, mandatoryPermissions } = plugin
    const mandatory = mandatoryPermissions != null && mandatoryPermissions ? mandatoryPermissions : false
    for (const permission of permissions) {
      const deniedPermission = await requestPermissionOnSettings(state.core.disklet, permission, displayName, mandatory)
      if (deniedPermission) {
        this.goBack()
        return
      }
    }
  }

  goBack(): boolean {
    if (this._webview == null || !this._canGoBack) {
      this.props.navigation.goBack()
      return false
    }
    this._webview.goBack()
    return true
  }

  // @ts-expect-error
  onLoadProgress = event => {
    console.log('Plugin navigation: ', event.nativeEvent)
    this._canGoBack = event.nativeEvent.canGoBack
  }

  // @ts-expect-error
  onNavigationStateChange = event => {
    console.log('Plugin navigation: ', event)
    this._canGoBack = event.canGoBack
  }

  render() {
    const { route } = this.props
    const { webViewKey } = this.state
    const { deepPath, deepQuery, plugin } = route.params
    const { originWhitelist = ['file://*', 'https://*', 'http://*', 'edge://*'] } = plugin
    const uri = makePluginUri(plugin, {
      deepPath,
      deepQuery,
      promoCode: this._promoCode
    })

    const userAgent =
      Platform.OS === 'android'
        ? 'Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; SCH-I535 Build/KOT49H) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'

    return (
      <SceneWrapper background="body">
        <WebView
          allowFileAccess
          allowUniversalAccessFromFileURLs
          geolocationEnabled
          injectedJavaScript={javascript}
          javaScriptEnabled
          onLoadProgress={this.onLoadProgress}
          onNavigationStateChange={this.onNavigationStateChange}
          onMessage={this._callbacks.onMessage}
          originWhitelist={originWhitelist}
          key={`webView${webViewKey}`}
          ref={this._callbacks.setRef}
          source={{ uri }}
          userAgent={userAgent + ' hasEdgeProvider edge/app.edge.'}
          mediaPlaybackRequiresUserAction={false}
        />
      </SceneWrapper>
    )
  }
}

// Connector -----------------------------------------------------------

export const GuiPluginViewScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({ state }),
  dispatch => ({ dispatch })
)(GuiPluginView)
