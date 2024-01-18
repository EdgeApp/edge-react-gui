import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { WebView } from 'react-native-webview'

import { Airship } from '../services/AirshipInstance'
import { ModalUi4 } from '../ui4/ModalUi4'

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

  const handleClose = () => {
    props.bridge.resolve()
  }

  return (
    <ModalUi4 bridge={bridge} onCancel={handleClose} title={title} paddingRem={[1, 0]}>
      <WebView ref={webviewRef} allowsInlineMediaPlayback source={{ uri }} />
    </ModalUi4>
  )
}
