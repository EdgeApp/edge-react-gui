// @flow

import React from 'react'
import { Actions } from 'react-native-router-flux'

import s from '../../../../locales/strings'
import BackButton from '../../components/Header/Component/BackButton.ui'

// The scene holds a ref to the webview:
type PluginScene = { goBack(): boolean }
let currentPlugin: PluginScene | void

export function setPluginScene (plugin: PluginScene | void) {
  currentPlugin = plugin
}

export function renderPluginBackButton (label: string = s.strings.title_back) {
  return <BackButton withArrow onPress={handlePluginBack} label={label} />
}

export function handlePluginBack () {
  if (currentPlugin == null || !currentPlugin.goBack()) {
    Actions.pop()
  }
}
