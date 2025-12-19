import * as React from 'react'
import { Linking } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { WebView, type WebViewNavigation } from 'react-native-webview'

import { useHandler } from '../../hooks/useHandler'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeModal } from './EdgeModal'

export async function showWebViewModal(
  title: string,
  uri: string
): Promise<void> {
  await Airship.show(bridge => (
    <WebViewModal bridge={bridge} title={title} uri={uri} />
  ))
}

/** Show a modal with HTML content rendered in a WebView */
export async function showHtmlModal(
  title: string,
  html: string
): Promise<void> {
  await Airship.show(bridge => (
    <WebViewModal bridge={bridge} title={title} html={html} />
  ))
}

interface Props {
  bridge: AirshipBridge<void>
  title: string
  uri?: string
  html?: string
}

export const WebViewModal: React.FC<Props> = props => {
  const { bridge, title, uri, html } = props
  const webviewRef = React.useRef<WebView>(null)
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleClose = (): void => {
    props.bridge.resolve()
  }

  // Open external links in the device browser
  const handleShouldStartLoad = useHandler(
    (event: WebViewNavigation): boolean => {
      const { url } = event
      // Allow initial load and about:blank, but open http(s) links externally
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // For HTML content, the initial load uses a data URI or about:blank
        // so any http(s) navigation is a link click
        if (html != null) {
          Linking.openURL(url).catch(() => {})
          return false
        }
      }
      return true
    }
  )

  // Build source - either URI or HTML with dark theme styling
  const source = React.useMemo(() => {
    if (uri != null) {
      return { uri }
    }
    if (html != null) {
      const styledHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                background-color: transparent;
                color: ${theme.primaryText};
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                padding: 8px;
                margin: 0;
              }
              a {
                color: ${theme.iconTappable};
              }
              p {
                margin: 0 0 12px 0;
              }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `
      return { html: styledHtml }
    }
    return { html: '' }
  }, [uri, html, theme])

  return (
    <EdgeModal bridge={bridge} onCancel={handleClose} title={title}>
      <WebView
        ref={webviewRef}
        allowsInlineMediaPlayback
        source={source}
        style={styles.webView}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  webView: {
    marginTop: theme.rem(0.5),
    backgroundColor: 'transparent'
  }
}))
