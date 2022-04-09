// @flow
import { BlurView } from '@react-native-community/blur'
import { useCavy } from 'cavy'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'

import { useWindowSize } from '../../hooks/useWindowSize.js'
import { useTheme } from '../services/ThemeContext.js'
import { QrCode } from '../themed/QrCode.js'

type Props = {
  bridge: AirshipBridge<void>,
  data?: string
}

export function QrModal(props: Props) {
  const { bridge, data } = props
  const theme = useTheme()
  const windowSize = useWindowSize()
  const maxSize = Math.min(windowSize.width, windowSize.height)
  const generateTestHook = useCavy()

  const handleCancel = () => bridge.resolve(undefined)

  return (
    <AirshipModal
      bridge={bridge}
      backgroundColor="transparent"
      center
      maxWidth={maxSize}
      maxHeight={maxSize}
      onCancel={handleCancel}
      underlay={<BlurView blurType={theme.isDark ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />}
    >
      <QrCode data={data} onPress={handleCancel} ref={generateTestHook('QrModal.Close')} />
    </AirshipModal>
  )
}
