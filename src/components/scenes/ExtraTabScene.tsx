import * as React from 'react'
import WebView from 'react-native-webview'

import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { GuiPlugin } from '../../types/GuiPluginTypes'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { EdgeProviderComponent } from '../themed/EdgeProviderComponent'

interface Props extends EdgeAppSceneProps<'extraTab'> {}

export function ExtraTabScene(props: Props) {
  if (config.extraTab == null) throw new Error('No extra tab config info')
  const { tabTitleKey, tabType, webviewUrl } = config.extraTab
  const { navigation } = props

  if (tabType === 'edgeProvider') {
    const plugin: GuiPlugin = {
      pluginId: 'extraTab',
      storeId: 'extraTab',
      baseUri: webviewUrl,
      displayName: lstrings[tabTitleKey]
    }

    return (
      <SceneWrapper hasTabs>
        <EdgeProviderComponent plugin={plugin} navigation={navigation as NavigationBase} />
      </SceneWrapper>
    )
  }

  return (
    <SceneWrapper hasTabs avoidKeyboard>
      <WebView
        allowFileAccess
        allowsInlineMediaPlayback
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
