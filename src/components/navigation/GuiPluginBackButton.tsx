import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { BackButton } from './BackButton'

// The scene holds a ref to the webview:
interface PluginScene {
  goBack: () => boolean
}
let currentPlugin: PluginScene | undefined

/**
 * Hands the header back button to the focused plugin scene. The Buy and
 * Sell tabs each keep a plugin scene mounted, so the button must follow
 * focus rather than whichever webview mounted last.
 * Returns a cleanup that releases the button if this scene still holds it.
 */
export function setPluginScene(plugin: PluginScene): () => void {
  currentPlugin = plugin
  return () => {
    if (currentPlugin === plugin) currentPlugin = undefined
  }
}

export const PluginBackButton: React.FC = () => {
  const handlePress = useHandler(() => {
    if (currentPlugin != null) currentPlugin.goBack()
  })
  return <BackButton onPress={handlePress} />
}
