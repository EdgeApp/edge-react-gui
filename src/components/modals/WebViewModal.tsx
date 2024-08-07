import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { WebView } from 'react-native-webview'

import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeModal } from './EdgeModal'

export async function showWebViewModal(title: string, uri: string): Promise<void> {
  await Airship.show(bridge => <WebViewModal bridge={bridge} title={title} uri={uri} />)
}

interface Props {
  bridge: AirshipBridge<void>
  title: string
  uri: string
}

export const WebViewModal = (props: Props) => {
  const { bridge, title, uri } = props
  const webviewRef = React.useRef<WebView>(null)
  const theme = useTheme()

  const handleClose = () => {
    props.bridge.resolve()
  }

  return (
    <EdgeModal bridge={bridge} onCancel={handleClose} title={title}>
      <WebView ref={webviewRef} allowsInlineMediaPlayback source={{ uri }} style={{ marginTop: theme.rem(0.5) }} />
    </EdgeModal>
  )
}
