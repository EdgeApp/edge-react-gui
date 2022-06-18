// @flow

import * as React from 'react'

import { type NavigationProp, type ParamList } from '../../types/routerTypes.js'
import { BackButton } from './BackButton.js'

// The scene holds a ref to the webview:
type PluginScene = { goBack(): boolean }
let currentPlugin: PluginScene | void

export function setPluginScene(plugin: PluginScene | void) {
  currentPlugin = plugin
}

export function renderPluginBackButton<Name: $Keys<ParamList>>(navigation: NavigationProp<Name>) {
  return <BackButton onPress={() => handlePluginBack(navigation)} />
}

export function handlePluginBack<Name: $Keys<ParamList>>(navigation: NavigationProp<Name>) {
  if (currentPlugin == null || !currentPlugin.goBack()) {
    navigation.pop()
  }
}
