import * as React from 'react'
import { WebView } from 'react-native-webview'

import { EdgeAppSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'

export interface WebViewSceneParams {
  title: string
  uri: string
}

interface Props extends EdgeAppSceneProps<'webView'> {}

export const WebViewScene = (props: Props) => {
  const { uri } = props.route.params

  return (
    <SceneWrapper avoidKeyboard>
      <WebView source={{ uri }} />
    </SceneWrapper>
  )
}
