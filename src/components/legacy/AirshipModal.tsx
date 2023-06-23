import * as React from 'react'
import { StyleSheet } from 'react-native'
import { AirshipBridge, AirshipModal as RealAirshipModal } from 'react-native-airship'
import { BlurView } from 'rn-id-blurview'

import { THEME } from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

interface Props<T> {
  bridge: AirshipBridge<T>
  children: React.ReactNode

  // True to have the modal float in the center of the screen,
  // or false for a bottom modal:
  center?: boolean

  // Called when the user taps outside the modal or clicks the back button:
  onCancel: () => void
}

/**
 * A modal that slides a modal up from the bottom of the screen
 * and dims the rest of the app.
 */
export function AirshipModal<T>(props: Props<T>) {
  const { bridge, children, center, onCancel } = props
  return (
    <RealAirshipModal
      backgroundColor={THEME.COLORS.WHITE}
      borderRadius={scale(16)}
      bridge={bridge}
      center={center}
      margin={[THEME.rem(2), 0, 0, 0]}
      onCancel={onCancel}
      underlay={<BlurView blurType="dark" style={StyleSheet.absoluteFill} />}
    >
      {children}
    </RealAirshipModal>
  )
}
