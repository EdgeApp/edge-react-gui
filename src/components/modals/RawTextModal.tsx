import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { lstrings } from '../../locales/strings'
import { showToast } from '../services/AirshipInstance'
import { MainButton } from '../themed/MainButton'
import { ModalMessage } from '../themed/ModalParts'
import { ModalUi4 } from '../ui4/ModalUi4'

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
    <ModalUi4 bridge={bridge} title={title} onCancel={handleCancel}>
      <ScrollView scrollIndicatorInsets={{ right: 1 }}>
        <ModalMessage>{body}</ModalMessage>
      </ScrollView>
      {disableCopy ? null : (
        <MainButton alignSelf="center" label={lstrings.fragment_request_copy_title} marginRem={0.5} onPress={handleCopy} type="secondary" />
      )}
    </ModalUi4>
  )
}
