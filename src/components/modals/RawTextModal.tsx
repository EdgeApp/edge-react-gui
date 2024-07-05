import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { lstrings } from '../../locales/strings'
import { showToast } from '../services/AirshipInstance'
import { Paragraph } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { EdgeModal } from './EdgeModal'

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
    <EdgeModal bridge={bridge} title={title} onCancel={handleCancel}>
      <ScrollView scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        <Paragraph>{body}</Paragraph>
      </ScrollView>
      {disableCopy ? null : <MainButton label={lstrings.fragment_request_copy_title} marginRem={1} onPress={handleCopy} type="secondary" />}
    </EdgeModal>
  )
}
