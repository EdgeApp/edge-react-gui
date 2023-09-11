import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { WebView } from 'react-native-webview'

import { Airship } from '../services/AirshipInstance'
import { ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

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
    <ThemedModal bridge={bridge} onCancel={handleClose} paddingRem={[1, 0]}>
      <ModalTitle center paddingRem={[0, 1, 1]}>
        {title}
      </ModalTitle>
      <WebView ref={webviewRef} source={{ uri }} />
    </ThemedModal>
  )
}
