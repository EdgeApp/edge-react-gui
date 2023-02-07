import * as React from 'react'
import { AirshipBridge, AirshipToast as RawToast } from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

interface Props {
  bridge: AirshipBridge<void>
  children?: React.ReactNode

  autoHideMs?: number
  // The message to show in the toast, before any other children:
  message: string
}

const DEFAULT_AUTO_HIDE_MS = 3000
/**
 * A semi-transparent message overlay.
 */
export function AirshipToast(props: Props) {
  const { autoHideMs = DEFAULT_AUTO_HIDE_MS, bridge, children, message } = props

  return (
    <RawToast
      bridge={bridge}
      autoHideMs={autoHideMs}
      backgroundColor={THEME.COLORS.GRAY_3}
      borderRadius={(3 / 2) * toastUnit}
      margin={[toastUnit, toastUnit, 4 * toastUnit]}
      maxWidth={32 * toastUnit}
      message={message}
      opacity={0.9}
      padding={toastUnit}
      textColor={THEME.COLORS.BLACK}
      textSize={toastUnit}
    >
      {children}
    </RawToast>
  )
}

export const toastUnit = scale(13)
