import * as React from 'react'
import { StyleSheet, ViewStyle } from 'react-native'
import { AirshipBridge, AirshipModal } from 'react-native-airship'
import { BlurView } from 'rn-id-blurview'

import { fixSides } from '../../util/sides'
import { useTheme } from '../services/ThemeContext'
import { ModalFooter, ModalScrollArea } from './ModalParts'

interface Props<T> {
  bridge: AirshipBridge<T>
  children?: React.ReactNode
  onCancel: () => void

  // Control over the content area:
  closeButton?: boolean
  flexDirection?: ViewStyle['flexDirection']
  justifyContent?: ViewStyle['justifyContent']
  paddingRem?: number[] | number

  // Scroll area with a fade
  scroll?: boolean

  // Gives the box a border:
  warning?: boolean
}

/**
 * The Airship modal, but connected to our theming system.
 */
export function ThemedModal<T>(props: Props<T>) {
  const { bridge, closeButton = true, children, flexDirection, justifyContent, warning = false, scroll = false, onCancel } = props
  const paddingRem = fixSides(props.paddingRem, 1)
  const theme = useTheme()

  // TODO: The warning styles are incorrectly hard-coded:
  const borderColor = warning ? theme.warningText : theme.modalBorderColor
  const borderWidth = warning ? 4 : theme.modalBorderWidth

  return (
    <AirshipModal
      bridge={bridge}
      backgroundColor={theme.modal}
      borderRadius={theme.rem(theme.modalBorderRadiusRem)}
      borderColor={borderColor}
      borderWidth={borderWidth}
      flexDirection={flexDirection}
      justifyContent={justifyContent}
      onCancel={onCancel}
      padding={paddingRem.map(theme.rem)}
      underlay={<BlurView blurType={theme.isDark ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />}
    >
      <>
        {scroll ? <ModalScrollArea>{children}</ModalScrollArea> : children}
        {closeButton ? <ModalFooter onPress={onCancel} /> : null}
      </>
    </AirshipModal>
  )
}
