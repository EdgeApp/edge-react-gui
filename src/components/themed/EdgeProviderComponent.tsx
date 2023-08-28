import { uncleaner } from 'cleaners'
import * as React from 'react'
import { NativeSyntheticEvent, Platform } from 'react-native'
import { WebView, WebViewMessageEvent } from 'react-native-webview'

import { EdgeProviderServer } from '../../controllers/edgeProvider/EdgeProviderServer'
import { javascript } from '../../controllers/edgeProvider/injectThisInWebView'
import { methodCleaners } from '../../controllers/edgeProvider/types/edgeProviderCleaners'
import { asRpcCall, rpcErrorCodes, RpcReturn } from '../../controllers/edgeProvider/types/jsonRpcCleaners'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { UriQueryMap } from '../../types/WebTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { makePluginUri } from '../../util/GuiPluginTools'
import { bestOfPlugins } from '../../util/ReferralHelpers'
import { setPluginScene } from '../navigation/GuiPluginBackButton'
import { showToast } from '../services/AirshipInstance'
import { requestPermissionOnSettings } from '../services/PermissionsManager'

export interface Props {
  // The GUI plugin we are showing the user:
  plugin: GuiPlugin

  // Set these to add stuff to the plugin URI:
  deepPath?: string
  deepQuery?: UriQueryMap

  navigation: NavigationBase
}

interface WebViewEvent {
  canGoBack: boolean
}

export function EdgeProviderComponent(props: Props): JSX.Element {
  const { navigation, deepPath, deepQuery, plugin } = props

  const {
    displayName,
    mandatoryPermissions = false,
    needsCountryCode = false,
    originWhitelist = ['file://*', 'https://*', 'http://*', 'edge://*'],
    permissions = [],
    pluginId
  } = plugin

  // Redux stuff:
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const disklet = useSelector(state => state.core.disklet)
  const accountPlugins = useSelector(state => state.account.referralCache.accountPlugins)
  const accountReferral = useSelector(state => state.account.accountReferral)
  const selectedWalletId = useSelector(state => state.ui.wallets.selectedWalletId)
  const selectedCurrencyCode = useSelector(state => state.ui.wallets.selectedCurrencyCode)
  const countryCode = useSelector(state => state.ui.settings.countryCode)

  // Get the promo information:
  const { promoCode, promoMessage } = React.useMemo(() => {
    const activePlugins = bestOfPlugins(accountPlugins, accountReferral, undefined)
    return {
      promoCode: activePlugins.promoCodes[pluginId],
      promoMessage: activePlugins.promoMessages[pluginId]
    }
  }, [accountPlugins, accountReferral, pluginId])

  // Make sure we have the permissions the plugin requires:
  useAsyncEffect(async () => {
    for (const permission of permissions) {
      const deniedPermission = await requestPermissionOnSettings(disklet, permission, displayName, mandatoryPermissions)
      if (deniedPermission) {
        navigation.goBack()
        return
      }
    }

    // Now show the promo message, if we have one:
    if (promoMessage != null) showToast(promoMessage)
  }, [displayName, mandatoryPermissions, navigation, permissions, promoMessage, disklet])

  // Sign up for back-button events:
  const webView = React.useRef<WebView>(null)
  const canGoBack = React.useRef<boolean>(false)
  React.useEffect(() => {
    setPluginScene({
      goBack() {
        if (webView.current == null || !canGoBack.current) {
          navigation.goBack()
          return false
        }
        webView.current.goBack()
        return true
      }
    })
  }, [navigation])

  const handleLoadProgress = useHandler((event: NativeSyntheticEvent<WebViewEvent>) => {
    console.log('Plugin navigation: ', event.nativeEvent)
    canGoBack.current = event.nativeEvent.canGoBack
  })

  const handleNavigationStateChange = useHandler((event: WebViewEvent) => {
    console.log('Plugin navigation: ', event)
    canGoBack.current = event.canGoBack
  })

  // Mechanism to force-restart the webview:
  const [webViewKey, setWebViewKey] = React.useState(0)
  const reloadWebView = useHandler(() => setWebViewKey(webViewKey + 1))

  // Build our EdgeProvider instance one time:
  const [edgeProvider] = React.useState(() => {
    const selectedWallet = account.currencyWallets[selectedWalletId]
    const selectedTokenId = selectedWallet == null ? undefined : getTokenId(account, selectedWallet.currencyInfo.pluginId, selectedCurrencyCode)
    return new EdgeProviderServer({
      account,
      dispatch,
      navigation,
      plugin,
      reloadWebView,
      selectedTokenId,
      selectedWallet,
      deepLink: {
        deepPath,
        deepQuery: needsCountryCode ? { ...deepQuery, countryCode } : deepQuery,
        promoCode
      }
    })
  })

  const handleMessage = useHandler((event: WebViewMessageEvent) => {
    try {
      const clean = asRpcCall(JSON.parse(event.nativeEvent.data))
      const method = clean.method as keyof typeof methodCleaners
      const cleaners = methodCleaners[method]
      if (cleaners == null) return

      const { asParams, asReturn } = cleaners
      const wasReturn = uncleaner<any>(asReturn)

      const f: (...args: any[]) => Promise<any> = edgeProvider[method]
      f.apply(edgeProvider, asParams(clean.params))
        .then(out => {
          const message: RpcReturn = {
            error: undefined,
            id: clean.id,
            jsonrpc: '2.0',
            result: wasReturn(out)
          }
          const js = `window.edgeProviderBridge.postReturn(${JSON.stringify(message)})`
          webView.current?.injectJavaScript(js)
        })
        .catch(error => {
          const message: RpcReturn = {
            error: {
              code: rpcErrorCodes.unknown,
              data: undefined,
              message: error.message
            },
            id: clean.id,
            jsonrpc: '2.0',
            result: undefined
          }
          const js = `window.edgeProviderBridge.postReturn(${JSON.stringify(message)})`
          webView.current?.injectJavaScript(js)
        })
    } catch (e) {
      // We got some sort of invalid request
    }
  })

  const uri = React.useMemo<string>(() => {
    return makePluginUri(plugin, {
      deepPath,
      deepQuery,
      promoCode
    })
  }, [deepPath, deepQuery, plugin, promoCode])

  const userAgent =
    Platform.OS === 'android'
      ? 'Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; SCH-I535 Build/KOT49H) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30'
      : 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1'

  return (
    <WebView
      allowFileAccess
      allowUniversalAccessFromFileURLs
      geolocationEnabled
      injectedJavaScript={javascript}
      javaScriptEnabled
      key={`webView${webViewKey}`}
      mediaPlaybackRequiresUserAction={false}
      originWhitelist={originWhitelist}
      ref={webView}
      source={{ uri }}
      userAgent={userAgent + ' hasEdgeProvider edge/app.edge.'}
      onLoadProgress={handleLoadProgress}
      onMessage={handleMessage}
      onNavigationStateChange={handleNavigationStateChange}
    />
  )
}
