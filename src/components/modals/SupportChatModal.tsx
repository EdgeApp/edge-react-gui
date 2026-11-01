import * as React from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions,
  View
} from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import type {
  ShouldStartLoadRequest,
  WebViewOpenWindowEvent
} from 'react-native-webview/lib/WebViewTypes'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { openBrowserUri } from '../../util/WebUtils'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeModal } from './EdgeModal'

// Share of the window the chat takes up, leaving the app visible above it:
const CHAT_HEIGHT_RATIO = 0.8

// Links in a support conversation can only leave the app through these
// schemes, so a message cannot trigger the app's own deep links:
const EXTERNAL_LINK_REGEX = /^(https?|mailto|tel):/i

/**
 * Show the Intercom Messenger in a modal.
 *
 * @param appId The public Intercom workspace id.
 * @param siteUri The support site. The Messenger loads under this origin, and
 * it is where the user lands if the Messenger cannot load.
 */
export async function showSupportChatModal(
  appId: string,
  siteUri: string
): Promise<void> {
  await Airship.show(bridge => (
    <SupportChatModal bridge={bridge} appId={appId} siteUri={siteUri} />
  ))
}

interface Props {
  bridge: AirshipBridge<void>
  appId: string
  siteUri: string
}

export const SupportChatModal: React.FC<Props> = props => {
  const { bridge, appId, siteUri } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { height: windowHeight } = useWindowDimensions()
  const [isChatVisible, setIsChatVisible] = React.useState(false)

  const containerHeight = React.useMemo(
    () => ({ height: windowHeight * CHAT_HEIGHT_RATIO }),
    [windowHeight]
  )

  const source = React.useMemo(
    () => ({
      baseUrl: siteUri,
      html: getSupportChatHtml(appId, getAppAttributes())
    }),
    [appId, siteUri]
  )

  const handleClose = useHandler(() => {
    bridge.resolve()
  })

  const openExternalLink = useHandler((url: string) => {
    if (!EXTERNAL_LINK_REGEX.test(url)) return
    Linking.openURL(url).catch((error: unknown) => {
      showError(error)
    })
  })

  const handleLoadFailure = useHandler(() => {
    bridge.resolve()
    openBrowserUri(siteUri).catch((error: unknown) => {
      showError(error)
    })
  })

  const handleMessage = useHandler((event: WebViewMessageEvent) => {
    switch (event.nativeEvent.data) {
      case 'error':
        handleLoadFailure()
        break
      case 'hide':
        bridge.resolve()
        break
      case 'show':
        setIsChatVisible(true)
        break
    }
  })

  const handleOpenWindow = useHandler((event: WebViewOpenWindowEvent) => {
    openExternalLink(event.nativeEvent.targetUrl)
  })

  // The Messenger runs in frames of its own, which navigate freely. Only the
  // page itself leaving the Messenger counts as following a link:
  const handleShouldStartLoad = useHandler(
    (event: ShouldStartLoadRequest): boolean => {
      const { isTopFrame, url } = event
      if (!isTopFrame || url === siteUri || url.startsWith('about:')) {
        return true
      }
      openExternalLink(url)
      return false
    }
  )

  return (
    <EdgeModal
      bridge={bridge}
      onCancel={handleClose}
      title={lstrings.help_live_chat}
    >
      <View style={[styles.container, containerHeight]}>
        <WebView
          allowsInlineMediaPlayback
          originWhitelist={['*']}
          // The Messenger scrolls its own frames. Without this, iOS scrolls the
          // page itself to reveal the composer, leaving the conversation
          // off-screen while the modal already sits above the keyboard:
          scrollEnabled={false}
          source={source}
          style={styles.webView}
          onError={handleLoadFailure}
          onMessage={handleMessage}
          onOpenWindow={handleOpenWindow}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
        />
        {isChatVisible ? null : (
          <View style={styles.spinner} pointerEvents="none">
            <ActivityIndicator color={theme.iconTappable} size="large" />
          </View>
        )}
      </View>
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexShrink: 1,
    marginTop: theme.rem(0.5)
  },
  spinner: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  webView: {
    backgroundColor: 'transparent'
  }
}))

/**
 * Facts about the running app that go to support with the conversation, so the
 * user doesn't need to look them up. These identify the build, not the user.
 */
function getAppAttributes(): Record<string, string> {
  return {
    edge_app_version: getVersion(),
    edge_app_build: getBuildNumber(),
    edge_platform: Platform.OS,
    edge_os_version: String(Platform.Version)
  }
}

/**
 * Builds the page that boots the Messenger. Intercom treats settings it doesn't
 * reserve as custom attributes on the visitor.
 */
export function getSupportChatHtml(
  appId: string,
  attributes: Record<string, string>
): string {
  const settings = {
    ...attributes,
    api_base: 'https://api-iam.intercom.io',
    app_id: appId,
    hide_default_launcher: true
  }

  // Stops a value from closing the script tag early:
  const settingsJson = JSON.stringify(settings).replace(/</g, '\\u003c')
  const widgetUri = `https://widget.intercom.io/widget/${encodeURIComponent(
    appId
  )}`

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  </head>
  <body>
    <script>
      function post(message) {
        window.ReactNativeWebView.postMessage(message)
      }
      window.intercomSettings = ${settingsJson}
      var Intercom = function () {
        Intercom.q.push(arguments)
      }
      Intercom.q = []
      window.Intercom = Intercom
      Intercom('onShow', function () { post('show') })
      Intercom('onHide', function () { post('hide') })
      // Starts on a new message, unless a conversation is still open, in which
      // case the Messenger goes back to that:
      Intercom('showNewMessage')
      var script = document.createElement('script')
      script.async = true
      script.src = ${JSON.stringify(widgetUri)}
      script.onerror = function () { post('error') }
      document.head.appendChild(script)
    </script>
  </body>
</html>`
}
