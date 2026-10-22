import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { WebView, type WebViewNavigation } from 'react-native-webview'
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes'

import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { showError } from '../../../components/services/AirshipInstance'
import { useHandler } from '../../../hooks/useHandler'
import type { BuySellTabSceneProps } from '../../../types/routerTypes'

export interface FiatPluginOpenWebViewParams {
  url: string
  injectedJs?: string
  onClose: (() => boolean) | (() => void)
  onMessage?: (message: string, injectJs: (js: string) => void) => void
  /**
   * Called before the WebView navigates its main frame to a URL. Return
   * false to refuse the load and keep the WebView on its current page.
   * Frames inside the page never reach this callback. Android stops waiting
   * for the answer after 250ms and loads the page anyway, in which case
   * `onUrlChange` reports the URL.
   */
  onShouldStartLoad?: (url: string) => boolean
  onUrlChange?: (url: string) => void | Promise<void>
}

interface Props extends BuySellTabSceneProps<'guiPluginWebView'> {}

export const FiatPluginWebViewComponent: React.FC<Props> = props => {
  const { route } = props
  const {
    injectedJs,
    onClose,
    onMessage,
    onShouldStartLoad,
    onUrlChange,
    url
  } = route.params
  const navigation = useNavigation()

  const webViewRef = React.useRef<WebView>(null)

  const handleNavigationStateChange = useHandler((event: WebViewNavigation) => {
    console.log('FiatPluginWebView navigation: ', event)
    if (onUrlChange != null) {
      const p = onUrlChange(event.url)
      p?.catch((error: unknown) => {
        showError(error)
      })
    }
  })

  const handleShouldStartLoad = useHandler(
    (event: ShouldStartLoadRequest): boolean => {
      // A frame inside the page must not be able to stand in for the page
      // itself, so only loads known to be for the main frame are the
      // caller's to refuse:
      if (!event.isTopFrame) return true
      return onShouldStartLoad?.(event.url) ?? true
    }
  )

  const injectJs = (js: string): void => {
    if (webViewRef.current != null) webViewRef.current.injectJavaScript(js)
  }

  const handleMessage = useHandler(event => {
    const { data } = event.nativeEvent
    if (onMessage != null) onMessage(data, injectJs)
  })

  React.useEffect(
    () =>
      navigation.addListener('beforeRemove', event => {
        if (onClose != null) {
          if (onClose() === false) event.preventDefault()
        }
      }),
    [navigation, onClose]
  )

  return (
    <SceneWrapper hasTabs avoidKeyboard>
      <WebView
        allowUniversalAccessFromFileURLs
        geolocationEnabled
        javaScriptEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        ref={webViewRef}
        scalesPageToFit
        source={{ uri: url }}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={
          onShouldStartLoad == null ? undefined : handleShouldStartLoad
        }
        injectedJavaScriptBeforeContentLoaded={injectedJs}
      />
    </SceneWrapper>
  )
}
