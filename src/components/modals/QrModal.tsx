import * as React from 'react'
import { StyleSheet } from 'react-native'
import { AirshipBridge, AirshipModal } from 'react-native-airship'
// @ts-expect-error
import { BlurView } from 'rn-id-blurview'

import { useWindowSize } from '../../hooks/useWindowSize'
import { useTheme } from '../services/ThemeContext'
import { QrCode } from '../themed/QrCode'

type Props = {
  bridge: AirshipBridge<void>
  data?: string
}

export function QrModal(props: Props) {
  const { bridge, data } = props
  const theme = useTheme()
  const windowSize = useWindowSize()
  const maxSize = Math.min(windowSize.width, windowSize.height)

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
      <QrCode data={data} onPress={handleCancel} />
    </AirshipModal>
  )
}
