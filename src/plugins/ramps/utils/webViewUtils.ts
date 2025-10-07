import type { NavigationProp } from '@react-navigation/native'
import {
  AppState,
  type AppStateStatus,
  Linking,
  type NativeEventSubscription,
  Platform
} from 'react-native'
import { CustomTabs } from 'react-native-custom-tabs'
import SafariView from 'react-native-safari-view'

import { datelog } from '../../../util/utils'
import type { FiatPluginOpenWebViewParams } from '../../gui/scenes/FiatPluginWebView'
import {
  rampDeeplinkManager,
  type RampLinkHandler
} from '../rampDeeplinkHandler'

export interface OpenExternalWebViewParams {
  /** The URL to open */
  url: string

  /**
   * Use a webview that is fully external to the app instead of any semi integrated
   * webview like a SafariWebView. If set, this will not kill the app but only
   * redirect to the external webview.
   */
  redirectExternal?: boolean

  /**
   * If provided, the deeplink will be registered with the rampDeeplinkManager
   * and the handler will be called when the deeplink is triggered.
   *
   * The direction and providerId are used to match the deeplink to the correct
   * handler.
   */
  deeplink?: {
    /** The direction of the deeplink */
    direction: 'buy' | 'sell'
    /** The handler to call when the deeplink is triggered */
    handler: RampLinkHandler
    /** The provider ID of the deeplink */
    providerId: string
  }
}

/**
 * Opens a URL in an external webview.
 *
 * @param params.url - The URL to open
 * @param params.redirectExternal - Whether to redirect to the external webview
 * @param params.deeplink - The deeplink listener parameters to register
 * @returns Promise that resolves when the webview is opened
 */
export async function openExternalWebView(
  params: OpenExternalWebViewParams
): Promise<void> {
  const { deeplink, redirectExternal, url } = params
  datelog(`**** openExternalWebView ${url}`)
  if (deeplink != null) {
    if (deeplink.providerId == null)
      throw new Error('providerId is required for deeplinkHandler')
    rampDeeplinkManager.register(
      deeplink.direction,
      deeplink.providerId,
      deeplink.handler
    )
  }
  if (redirectExternal === true) {
    await Linking.openURL(url)
    return
  }
  if (Platform.OS === 'ios') await SafariView.show({ url })
  else await CustomTabs.openURL(url)
}

export interface OpenWebViewOptions {
  url: string
  onClose?: () => void
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
  let appStateSubscription: NativeEventSubscription | null = null

  const handleAppStateChange = (nextState: AppStateStatus): void => {
    // Detect resume: background/inactive -> active
    if (
      (appStateRef === 'background' || appStateRef === 'inactive') &&
      nextState === 'active' &&
      webViewOpened
    ) {
      // Webview was closed
      webViewOpened = false
      if (appStateSubscription != null) {
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

      if (onClose != null) {
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
      if (onClose != null) {
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
    if (appStateSubscription != null) {
      appStateSubscription.remove()
      appStateSubscription = null
    }
    throw error
  }
}

export interface OpenEdgeWebViewOptions extends FiatPluginOpenWebViewParams {
  navigation: NavigationProp<any>
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
