// @flow

import React from 'react'
import { Platform } from 'react-native'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import { Bridge, onMethod } from 'yaob'

import { javascript } from '../../lib/bridge/injectThisInWebView.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { setPluginScene } from '../../modules/UI/scenes/Plugins/BackButton.js'
import { EdgeProvider } from '../../modules/UI/scenes/Plugins/EdgeProvider.js'
import type { BuySellPlugin } from '../../types.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

// WebView bridge managemer --------------------------------------------

type WebViewCallbacks = {
  onMessage: Function,
  setRef: Function
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
function makeOuterWebViewBridge<Root> (onRoot: (root: Root) => mixed, debug: boolean = false): WebViewCallbacks {
  let bridge: Bridge | void
  let gatedRoot: Root | void
  let webview: WebView | void

  // Gate the root object on the webview being ready:
  const tryReleasingRoot = () => {
    if (gatedRoot != null && webview != null) {
      onRoot(gatedRoot)
      gatedRoot = void 0
    }
  }

  // Feed incoming messages into the YAOB bridge (if any):
  const onMessage = event => {
    const message = JSON.parse(event.nativeEvent.data)
    if (debug) console.info('plugin →', message)

    // This is a terrible hack. We are using our inside knowledge
    // of YAOB's message format to determine when the client has restarted.
    if (bridge != null && message.events != null && message.events.find(event => event.localId === 0)) {
      bridge.close(new Error('plugin: The WebView has been unmounted.'))
      bridge = void 0
    }

    // If we have no bridge, start one:
    if (bridge == null) {
      let firstMessage = true
      bridge = new Bridge({
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
      onMethod.call(bridge._state, 'root', root => {
        gatedRoot = root
        tryReleasingRoot()
      })
    }

    // Finally, pass the message to the bridge:
    try {
      bridge.handleMessage(message)
    } catch (e) {
      console.warn('plugin bridge error: ' + String(e))
    }
  }

  // Listen for the webview component to mount:
  const setRef = element => {
    webview = element
    tryReleasingRoot()
  }

  return { onMessage, setRef }
}

// Plugin scene --------------------------------------------------------

type Props = {
  dispatch: Dispatch,
  plugin: BuySellPlugin,
  state: State
}

type PluginWorkerApi = {
  setEdgeProvider(provider: EdgeProvider): Promise<mixed>
}

class PluginView extends React.Component<Props> {
  _callbacks: WebViewCallbacks
  _canGoBack: boolean
  _edgeProvider: EdgeProvider
  _webview: WebView | void

  constructor (props) {
    super(props)
    setPluginScene(this)

    // Set up the plugin:
    const { dispatch, plugin, state } = this.props

    // Set up the EdgeProvider:
    this._edgeProvider = new EdgeProvider(plugin.pluginId, state, dispatch)

    // Set up the WebView bridge:
    this._canGoBack = false
    this._callbacks = makeOuterWebViewBridge((root: PluginWorkerApi) => {
      root.setEdgeProvider(this._edgeProvider).catch(e => {
        console.warn('plugin setEdgeProvider error: ' + String(e))
      })
    }, true)

    // Capture the WebView ref:
    const { setRef } = this._callbacks
    this._callbacks.setRef = (element: WebView | void) => {
      if (element == null) this._canGoBack = false
      this._webview = element
      setRef(element)
    }
  }

  componentDidUpdate () {
    this._edgeProvider.updateState(this.props.state)
  }

  goBack (): boolean {
    if (this._webview == null || !this._canGoBack) {
      return false
    }
    this._webview.goBack()
    return true
  }

  onNavigationStateChange = event => {
    console.log('Plugin navigation: ', event)
    this._canGoBack = event.canGoBack
  }

  render () {
    const { uri, originWhitelist = ['file://*', 'https://*', 'http://*', 'edge://*'] } = this.props.plugin
    const userAgent =
      Platform.OS === 'android'
        ? 'Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; SCH-I535 Build/KOT49H) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
        : 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'

    return (
      <SceneWrapper background="body" hasTabs={false}>
        <WebView
          allowFileAccess
          allowUniversalAccessFromFileURLs
          geolocationEnabled
          injectedJavaScript={javascript}
          javaScriptEnabled={true}
          onNavigationStateChange={this.onNavigationStateChange}
          onMessage={this._callbacks.onMessage}
          originWhitelist={originWhitelist}
          ref={this._callbacks.setRef}
          setWebContentsDebuggingEnabled={true}
          source={{ uri }}
          userAgent={userAgent + ' hasEdgeProvider edge/app.edge.'}
          useWebKit
        />
      </SceneWrapper>
    )
  }
}

// Connector -----------------------------------------------------------

const mapStateToProps = state => ({ state })
const mapDispatchToProps = dispatch => ({ dispatch })

export const PluginViewConnect = connect(
  mapStateToProps,
  mapDispatchToProps
)(PluginView)
