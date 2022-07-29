// @flow
import * as React from 'react'
import { WebView } from 'react-native-webview'

import { config } from '../../theme/appConfig'
import { SceneWrapper } from '../common/SceneWrapper.js'

export function ExtraTabScene() {
  if (config.extraTab == null) throw new Error('No extra tab config info')
  const { webviewUrl } = config.extraTab

  return (
    <SceneWrapper background="body" avoidKeyboard>
      <WebView
        allowFileAccess
        allowUniversalAccessFromFileURLs
        geolocationEnabled
        javaScriptEnabled
        key="webViewExtraTab"
        source={{ uri: webviewUrl }}
        useWebKit
        mediaPlaybackRequiresUserAction={false}
      />
    </SceneWrapper>
  )
}
