import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { showToast } from '../services/AirshipInstance'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

interface Props {
  bridge: AirshipBridge<void>
  body: string
  title?: string
  disableCopy?: boolean
}

export function RawTextModal(props: Props) {
  const { bridge, body, title, disableCopy = false } = props

  const handleCancel = () => bridge.resolve(undefined)
  const handleCopy = () => {
    Clipboard.setString(body)
    showToast(lstrings.fragment_copied)
    bridge.resolve()
  }

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      <ScrollView>
        <ModalMessage>{body}</ModalMessage>
      </ScrollView>
      {disableCopy ? null : (
        <MainButton alignSelf="center" label={lstrings.fragment_request_copy_title} marginRem={0.5} onPress={handleCopy} type="secondary" />
      )}
    </ThemedModal>
  )
}
