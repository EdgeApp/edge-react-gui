import type { NavigationProp } from '@react-navigation/native'
import { AppState, type AppStateStatus, Platform } from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'

import type { FiatPluginOpenWebViewParams } from '../plugins/gui/scenes/FiatPluginWebView'

export interface OpenWebViewOptions {
  url: string
  onClose?: () => void
}

export interface OpenEdgeWebViewOptions extends FiatPluginOpenWebViewParams {
  navigation: NavigationProp<any>
}

/**
 * Opens a URL in an in-app browser (SafariView on iOS, Custom Tabs on Android)
 * with optional close detection.
 *
 * @param options.url - The URL to open
 * @param options.onClose - Optional callback when the webview is closed
 * @returns Promise that resolves when the webview is opened (not when closed)
 */
export async function openWebView(options: OpenWebViewOptions): Promise<void> {
  const { url, onClose } = options

  let appStateRef = AppState.currentState
  let webViewOpened = false
  let appStateSubscription: any = null

  const handleAppStateChange = (nextState: AppStateStatus) => {
    // Detect resume: background/inactive -> active
    if (
      (appStateRef === 'background' || appStateRef === 'inactive') &&
      nextState === 'active' &&
      webViewOpened
    ) {
      // Webview was closed
      webViewOpened = false
      if (appStateSubscription) {
        appStateSubscription.remove()
        appStateSubscription = null
      }
      onClose?.()
    }
    appStateRef = nextState
  }

  try {
    if (Platform.OS === 'ios') {
      // iOS: SafariView has native onDismiss support
      await SafariView.isAvailable()

      if (onClose) {
        // Set up dismiss listener before showing
        const dismissListener = SafariView.addEventListener('onDismiss', () => {
          webViewOpened = false
          dismissListener.remove()
          onClose()
        })
      }

      await SafariView.show({ url })
    } else {
      // Android: Use AppState to detect Custom Tab closure
      if (onClose) {
        appStateSubscription = AppState.addEventListener(
          'change',
          handleAppStateChange
        )
      }
      webViewOpened = true
      await CustomTabs.openURL(url)
    }
  } catch (error) {
    // If launch failed, clean up
    webViewOpened = false
    if (appStateSubscription) {
      appStateSubscription.remove()
      appStateSubscription = null
    }
    throw error
  }
}

/**
 * Simple wrapper for opening a webview without close detection.
 * Maintains backward compatibility with existing code.
 */
export async function openSimpleWebView(url: string): Promise<void> {
  await openWebView({ url })
}

/**
 * Opens an Edge webview using the FiatPluginWebView scene with full control
 * over JavaScript injection, message handling, and URL changes.
 *
 * @param options.navigation - React Navigation navigation prop
 * @param options.url - The URL to open
 * @param options.injectedJs - Optional JavaScript to inject before content loads
 * @param options.onClose - Optional callback that can prevent close by returning false
 * @param options.onMessage - Optional handler for messages from the webview
 * @param options.onUrlChange - Optional handler for URL navigation changes
 */
export function openEdgeWebView(options: OpenEdgeWebViewOptions): void {
  const { navigation, ...webViewParams } = options
  navigation.navigate('guiPluginWebView', webViewParams)
}
