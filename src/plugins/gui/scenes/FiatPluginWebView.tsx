import * as React from 'react'
import { WebView, WebViewNavigation } from 'react-native-webview'

import { SceneWrapper } from '../../../components/common/SceneWrapper'
import { useHandler } from '../../../hooks/useHandler'
import { EdgeSceneProps } from '../../../types/routerTypes'

export interface FiatPluginOpenWebViewParams {
  url: string
  onClose: () => void
  onUrlChange: (url: string) => void
}

interface Props extends EdgeSceneProps<'guiPluginWebView'> {}

export function FiatPluginWebViewComponent(props: Props): JSX.Element {
  const { route } = props
  const { onClose, onUrlChange, url } = route.params

  const handleNavigationStateChange = useHandler((event: WebViewNavigation) => {
    console.log('FiatPluginWebView navigation: ', event)
    onUrlChange(event.url)
  })

  React.useEffect(() => () => {
    // Cleanup code when scene unmounts
    onClose()
  })

  return (
    <SceneWrapper background="theme" hasTabs>
      <WebView
        allowUniversalAccessFromFileURLs
        geolocationEnabled
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
      />
    </SceneWrapper>
  )
}
