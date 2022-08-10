// @flow

import * as React from 'react'

import { Actions } from '../../types/routerTypes.js'
import { BackButton } from './BackButton.js'

// The scene holds a ref to the webview:
type PluginScene = { goBack(): boolean }
let currentPlugin: PluginScene | void

export function setPluginScene(plugin: PluginScene | void) {
  currentPlugin = plugin
}

export function renderPluginBackButton() {
  return <BackButton onPress={handlePluginBack} />
}

export function handlePluginBack() {
  if (currentPlugin == null || !currentPlugin.goBack()) {
    Actions.pop()
  }
}
