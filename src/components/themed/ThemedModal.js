// @flow

import { BlurView } from '@react-native-community/blur'
import * as React from 'react'
import { type ViewStyle, StyleSheet } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'

import { packEdges, unpackEdges } from '../../util/edges.js'
import { useTheme } from '../services/ThemeContext.js'

type Props<T> = {
  bridge: AirshipBridge<T>,
  children?: React.Node,
  onCancel: () => void,

  // Use this to create space at the top for an icon circle:
  iconRem?: number,

  // Control over the content area:
  flexDirection?: $PropertyType<ViewStyle, 'flexDirection'>,
  justifyContent?: $PropertyType<ViewStyle, 'justifyContent'>,
  paddingRem?: number[] | number
}

/**
 * The Airship modal, but connected to our theming system.
 */
export function ThemedModal<T>(props: Props<T>) {
  const { bridge, children = null, flexDirection, iconRem = 0, justifyContent, onCancel } = props
  const paddingRem = unpackEdges(props.paddingRem ?? 1)
  const theme = useTheme()

  paddingRem.top += iconRem / 2

  return (
    <AirshipModal
      bridge={bridge}
      backgroundColor={theme.modal}
      borderRadius={theme.rem(1)}
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      margin={[theme.rem(iconRem / 2), 0, 0]}
      onCancel={onCancel}
      padding={packEdges(paddingRem).map(theme.rem)}
      underlay={<BlurView blurType={theme.isDark ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />}
    >
      {children}
    </AirshipModal>
  )
}
