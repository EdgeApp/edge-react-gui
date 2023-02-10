import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { BackButton } from './BackButton'

// The scene holds a ref to the webview:
interface PluginScene {
  goBack: () => boolean
}
let currentPlugin: PluginScene | undefined

export function setPluginScene(plugin: PluginScene | undefined) {
  currentPlugin = plugin
}

export function PluginBackButton() {
  const handlePress = useHandler(() => {
    if (currentPlugin != null) currentPlugin.goBack()
  })
  return <BackButton onPress={handlePress} />
}
