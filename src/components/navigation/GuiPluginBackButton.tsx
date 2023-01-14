import * as React from 'react'
import { Actions } from 'react-native-router-flux'

import { BackButton } from './BackButton'

// The scene holds a ref to the webview:
interface PluginScene {
  goBack: () => boolean
}
let currentPlugin: PluginScene | undefined

export function setPluginScene(plugin: PluginScene | undefined) {
  currentPlugin = plugin
}

export function renderPluginBackButton() {
  return <BackButton onPress={() => handlePluginBack()} />
}

export function handlePluginBack() {
  if (currentPlugin == null || !currentPlugin.goBack()) {
    Actions.pop()
  }
}
