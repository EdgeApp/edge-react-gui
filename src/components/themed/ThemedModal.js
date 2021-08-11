// @flow

import { BlurView } from '@react-native-community/blur'
import * as React from 'react'
import { type ViewStyle, StyleSheet } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'

import { packEdges, unpackEdges } from '../../util/edges.js'
import { useTheme } from '../services/ThemeContext.js'

// Sneak the BlurView over to the login UI:
global.ReactNativeBlurView = BlurView

type Props<T> = {
  bridge: AirshipBridge<T>,
  children?: React.Node,
  onCancel: () => void,

  // Use this to create space at the top for an icon circle:
  iconRem?: number,

  // Control over the content area:
  flexDirection?: $PropertyType<ViewStyle, 'flexDirection'>,
  justifyContent?: $PropertyType<ViewStyle, 'justifyContent'>,
  paddingRem?: number[] | number,
  position?: 'center' | 'bottom',
  maxWidth?: number
}

/**
 * The Airship modal, but connected to our theming system.
 */
export function ThemedModal<T>(props: Props<T>) {
  const { bridge, children = null, flexDirection, iconRem = 0, justifyContent, onCancel, position, maxWidth } = props
  const paddingRem = unpackEdges(props.paddingRem ?? 1)
  const theme = useTheme()

  let margin = [theme.rem(iconRem / 2), 0, 0]
  paddingRem.top += iconRem / 2
  let padding = packEdges(paddingRem).map(theme.rem)
  const isModalCentered = position === 'center'

  if (isModalCentered) {
    margin = 0
    padding = 0
  }

  return (
    <AirshipModal
      bridge={bridge}
      backgroundColor={theme.modal}
      borderRadius={theme.rem(1)}
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      margin={margin}
      onCancel={onCancel}
      center={isModalCentered}
      maxWidth={maxWidth}
      padding={padding}
      underlay={<BlurView blurType={theme.modalBlurType} style={StyleSheet.absoluteFill} />}
    >
      {children}
    </AirshipModal>
  )
}
