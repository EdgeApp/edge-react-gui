// @flow

import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import s from '../../locales/strings.js'
import { showToast } from '../services/AirshipInstance.js'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type Props = {|
  bridge: AirshipBridge<void>,
  body: string,
  title?: string,
  disableCopy?: boolean
|}

export function RawTextModal(props: Props) {
  const { bridge, body, title, disableCopy = false } = props

  const handleCancel = () => bridge.resolve(undefined)
  const handleCopy = () => {
    Clipboard.setString(body)
    showToast(s.strings.fragment_copied)
    bridge.resolve()
  }

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      <ScrollView>
        <ModalMessage>{body}</ModalMessage>
      </ScrollView>
      {disableCopy ? null : (
        <MainButton alignSelf="center" label={s.strings.fragment_request_copy_title} marginRem={0.5} onPress={handleCopy} type="secondary" />
      )}
      <ModalCloseArrow onPress={handleCancel} />
    </ThemedModal>
  )
}
