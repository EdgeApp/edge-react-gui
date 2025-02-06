import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { WebView, WebViewNavigation } from 'react-native-webview'

import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { useHandler } from '../../../hooks/useHandler'
import { BuyTabSceneProps } from '../../../types/routerTypes'

export interface FiatPluginOpenWebViewParams {
  url: string
  injectedJs?: string
  onClose?: (() => boolean) | (() => void)
  onMessage?: (message: string, injectJs: (js: string) => void) => void
  onUrlChange?: (url: string) => void
}

interface Props extends BuyTabSceneProps<'guiPluginWebView'> {}

export function FiatPluginWebViewComponent(props: Props): JSX.Element {
  const { route } = props
  const { injectedJs, onClose, onMessage, onUrlChange, url } = route.params
  const navigation = useNavigation()

  const webViewRef = React.useRef<WebView>(null)

  const handleNavigationStateChange = useHandler((event: WebViewNavigation) => {
    console.log('FiatPluginWebView navigation: ', event)
    if (onUrlChange != null) onUrlChange(event.url)
  })

  const injectJs = (js: string) => {
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
        injectedJavaScriptBeforeContentLoaded={injectedJs}
      />
    </SceneWrapper>
  )
}
