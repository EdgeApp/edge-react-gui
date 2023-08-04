import * as React from 'react'
import { WebView } from 'react-native-webview'

import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'

export interface WebViewSceneParams {
  title: string
  uri: string
}

interface Props extends EdgeSceneProps<'webView'> {}

export const WebViewScene = (props: Props) => {
  const { uri } = props.route.params

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <WebView source={{ uri }} />
    </SceneWrapper>
  )
}
