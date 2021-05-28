// @flow

import * as React from 'react'
import {
  type AirshipBridge,
  AirshipToast as RawToast
} from 'react-native-airship'

import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'

type Props = {
  bridge: AirshipBridge<void>,
  children?: React.Node,

  // The message to show in the toast, before any other children:
  message: string
}

/**
 * A semi-transparent message overlay.
 */
export function AirshipToast(props: Props) {
  const { bridge, children, message } = props

  return (
    <RawToast
      bridge={bridge}
      autoHideMs={3000}
      backgroundColor={THEME.COLORS.GRAY_3}
      borderRadius={(3 / 2) * toastUnit}
      fontFamily={THEME.FONTS.DEFAULT}
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
