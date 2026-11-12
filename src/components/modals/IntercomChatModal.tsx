import * as React from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions,
  View
} from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import {
  getBuildNumber,
  getSystemVersion,
  getVersion
} from 'react-native-device-info'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import type {
  ShouldStartLoadRequest,
  WebViewNavigationEvent,
  WebViewOpenWindowEvent
} from 'react-native-webview/lib/WebViewTypes'
import URL from 'url-parse'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { openBrowserUri } from '../../util/WebUtils'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeModal } from './EdgeModal'

// Share of the window the chat takes up, leaving the app visible above it:
const CHAT_HEIGHT_RATIO = 0.8

// How long the Messenger gets to open before the support site takes over:
const CHAT_LOAD_TIMEOUT_MS = 20000

// The Messenger host for workspaces in the US region:
const DEFAULT_INTERCOM_API_BASE = 'https://api-iam.intercom.io'

// Links in a support conversation can only leave the app through these
// schemes, so a message cannot trigger the app's own deep links:
const EXTERNAL_LINK_REGEX = /^(https?|mailto|tel):/i

// The OS hands web links on these hosts back to the app as deep links
// (Android app links, iOS universal links), so they never leave the chat:
const APP_LINK_HOSTS = ['deep.edge.app', 'dl.edge.app', 'return.edge.app']

function isExternalLink(url: string): boolean {
  if (!EXTERNAL_LINK_REGEX.test(url)) return false
  const hostname = new URL(url).hostname.toLowerCase()
  return !APP_LINK_HOSTS.includes(hostname)
}

export interface IntercomChatOptions {
  /** The public Intercom workspace id. */
  appId: string
  /** The workspace region's Messenger host. */
  apiBase?: string
  /**
   * The support site. The Messenger loads under this origin, and it is where
   * the user lands if the Messenger cannot load.
   */
  siteUri: string
  /**
   * The Lock ID of a device waiting for authorization, sent alongside the app
   * details. Without one, the chat clears any Lock ID an earlier chat left.
   */
  lockId?: string
  /**
   * The user's first message, sent for them once the Messenger opens, so
   * support sees the problem before the user types anything.
   */
  message?: string
}

/**
 * Show the Intercom Messenger in a modal.
 */
export async function showIntercomChatModal(
  options: IntercomChatOptions
): Promise<void> {
  await Airship.show(bridge => (
    <IntercomChatModal bridge={bridge} {...options} />
  ))
}

interface Props extends IntercomChatOptions {
  bridge: AirshipBridge<void>
}

export const IntercomChatModal: React.FC<Props> = props => {
  const {
    bridge,
    appId,
    apiBase = DEFAULT_INTERCOM_API_BASE,
    lockId,
    message,
    siteUri
  } = props
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
      html: getIntercomChatHtml(
        appId,
        apiBase,
        { ...getAppAttributes(), edge_lock_id: lockId ?? null },
        message
      )
    }),
    [apiBase, appId, lockId, message, siteUri]
  )

  // The modal stays mounted through its close animation, so a late load
  // failure must not open the support site after the user closed the chat:
  const isClosed = React.useRef(false)
  const webViewRef = React.useRef<WebView>(null)

  const handleClose = useHandler(() => {
    isClosed.current = true
    bridge.resolve()
  })

  const openExternalLink = useHandler((url: string) => {
    if (!isExternalLink(url)) return
    Linking.openURL(url).catch((error: unknown) => {
      showError(error)
    })
  })

  const handleLoadFailure = useHandler(() => {
    if (isClosed.current) return
    handleClose()
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
        handleClose()
        break
      case 'show':
        setIsChatVisible(true)
        break
    }
  })

  const handleOpenWindow = useHandler((event: WebViewOpenWindowEvent) => {
    openExternalLink(event.nativeEvent.targetUrl)
  })

  // The Messenger may change the page's hash as it goes, which Android
  // reports as a load of its own:
  const isMessengerPage = (url: string): boolean =>
    url.replace(/#.*$/, '') === siteUri || url.startsWith('about:')

  // The Messenger runs in frames of its own, which navigate freely. Only the
  // page itself leaving the Messenger counts as following a link:
  const handleShouldStartLoad = useHandler(
    (event: ShouldStartLoadRequest): boolean => {
      const { isTopFrame, url } = event
      if (!isTopFrame || isMessengerPage(url)) return true
      openExternalLink(url)
      return false
    }
  )

  // Android loads the page anyway when handleShouldStartLoad answers too late
  // (react-native-webview waits 250ms). No other page may keep the
  // microphone, so the chat closes. The late answer still opens the link:
  const handleLoadStart = useHandler((event: WebViewNavigationEvent) => {
    if (isClosed.current || isMessengerPage(event.nativeEvent.url)) return
    webViewRef.current?.stopLoading()
    handleClose()
  })

  // A Messenger that never opens, from a stalled script or an unreachable
  // host, gets the support site in its place:
  React.useEffect(() => {
    if (isChatVisible) return
    const timeoutId = setTimeout(handleLoadFailure, CHAT_LOAD_TIMEOUT_MS)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [handleLoadFailure, isChatVisible])

  return (
    <EdgeModal
      bridge={bridge}
      onCancel={handleClose}
      title={lstrings.help_live_chat}
    >
      <View style={[styles.container, containerHeight]}>
        <WebView
          allowsInlineMediaPlayback
          // Voice notes. Only the support site's own pages get the microphone
          // without a prompt. The app patches Android to honor this, and to
          // give the microphone to no other WebView:
          mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
          // Every URL has to reach handleShouldStartLoad. Outside this list,
          // react-native-webview hands the URL to the OS before asking, and
          // the OS opens edge:// links in the app itself:
          originWhitelist={['*']}
          ref={webViewRef}
          // The Messenger scrolls its own frames. Without this, iOS scrolls the
          // page itself to reveal the composer, leaving the conversation
          // off-screen while the modal already sits above the keyboard:
          scrollEnabled={false}
          source={source}
          style={styles.webView}
          onError={handleLoadFailure}
          onLoadStart={handleLoadStart}
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
    edge_os_version: getSystemVersion()
  }
}

/**
 * Builds the page that boots the Messenger. Intercom treats settings it doesn't
 * reserve as custom attributes on the visitor, and a null clears one.
 *
 * The attributes go out as an update once the Messenger shows, so every chat
 * refreshes them, even for a returning visitor whose boot settings Intercom
 * can ignore. The page boots without them, because Intercom drops an update
 * that matches the boot settings.
 *
 * Intercom's `showNewMessage` ignores its prefill text once Fin answers the
 * workspace, so a message goes in through the composer itself. The Messenger
 * frame shares this page's origin, so the page can reach into it. If Intercom
 * changes that markup, the composer just opens empty.
 */
export function getIntercomChatHtml(
  appId: string,
  apiBase: string,
  attributes: Record<string, string | null>,
  message?: string
): string {
  const settings = {
    api_base: apiBase,
    app_id: appId,
    hide_default_launcher: true
  }

  // Stops a value from closing the script tag early:
  const toScript = (value: unknown): string =>
    JSON.stringify(value).replace(/</g, '\\u003c')
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
      window.intercomSettings = ${toScript(settings)}
      var attributes = ${toScript(attributes)}
      var message = ${toScript(message ?? null)}
      var isShown = false
      function sendMessage(triesLeft) {
        var frame = document.querySelector('iframe[name="intercom-messenger-frame"]')
        var doc = frame == null ? null : frame.contentDocument
        var composer = doc == null ? null : doc.querySelector('[data-testid="rich-text-editor-content"]')
        if (composer == null) {
          if (triesLeft > 0) setTimeout(function () { sendMessage(triesLeft - 1) }, 100)
          return
        }
        composer.focus()
        doc.execCommand('insertText', false, message)
        // The send button enables once the composer sees the text:
        setTimeout(function () {
          var button = doc.querySelector('.intercom-composer-send-button')
          if (button != null) button.click()
        }, 300)
      }
      var Intercom = function () {
        Intercom.q.push(arguments)
      }
      Intercom.q = []
      window.Intercom = Intercom
      Intercom('onShow', function () {
        post('show')
        if (isShown) return
        isShown = true
        Intercom('update', attributes)
        if (message != null) sendMessage(100)
      })
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
