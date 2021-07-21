// @flow
/* eslint "react/jsx-sort-props": ["error", { "callbacksLast": true }] */

import * as React from 'react'
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { useState } from '../../types/reactHooks.js'
import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides.js'
import { type Theme, useTheme } from '../services/ThemeContext.js'

type Props = {|
  children?: React.Node,

  // Called when the user presses the button.
  // If the callback returns a promise, the button will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>,

  // Whether to center the button or stretch to fill the screen.
  // Defaults to 'auto', letting the parent component be in charge:
  alignSelf?: 'auto' | 'stretch' | 'center',

  // True to dim the button & prevent interactions:
  disabled?: boolean,

  // If this is set, the component will insert a text node before the other children:
  label?: string,

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number,

  // Which visual style to use. Defaults to solid (false):
  outlined?: boolean,

  // The gap inside the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `padding` property. Defaults to 0.5.
  paddingRem?: number[] | number,

  // True to show a spinner after the contents:
  spinner?: boolean
|}

/**
 * A stand-alone button to perform the primary action in a modal or scene.
 */
export function PrimaryButton(props: Props) {
  const { alignSelf = 'auto', children, disabled = false, label, marginRem, onPress, outlined = false, paddingRem, spinner = false } = props

  // Styles:
  const theme = useTheme()
  const styles = getStyles(theme)

  // `onPress` promise logic:
  const [pending, setPending] = useState(false)
  const handlePress = () => {
    if (onPress == null || pending) return
    const out = onPress()
    if (out != null && typeof out.then === 'function') {
      setPending(true)
      const onDone = () => setPending(false)
      out.then(onDone, onDone)
    }
  }

  const touchableStyle = outlined ? styles.outlinedButton : styles.solidButton
  const textStyle = outlined ? styles.outlinedText : styles.solidText
  const spinnerColor = outlined ? theme.secondaryButtonText : theme.primaryButtonText
  const dynamicStyles = {
    alignSelf,
    opacity: disabled || pending ? 0.7 : 1,
    ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
    ...sidesToPadding(mapSides(fixSides(paddingRem, 0.5), theme.rem))
  }
  return (
    <TouchableOpacity disabled={disabled || pending} style={[touchableStyle, dynamicStyles]} onPress={handlePress}>
      {label != null && !pending ? <Text style={textStyle}>{label}</Text> : null}
      {!pending ? children : null}
      {spinner || pending ? <ActivityIndicator color={spinnerColor} style={styles.spinner} /> : null}
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonButton = {
    alignItems: 'center',
    borderRadius: theme.rem(0.25),
    borderWidth: theme.rem(0.1),
    flexDirection: 'row',
    justifyContent: 'center',
    minWidth: theme.rem(9)
  }
  const commonText = {
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1),
    lineHeight: theme.rem(2),
    marginHorizontal: theme.rem(0.5)
  }

  return {
    solidButton: {
      ...commonButton,
      backgroundColor: theme.primaryButton,
      borderColor: theme.primaryButtonOutline
    },
    solidText: {
      ...commonText,
      color: theme.primaryButtonText
    },

    outlinedButton: {
      ...commonButton,
      backgroundColor: theme.secondaryButton,
      borderColor: theme.secondaryButtonOutline
    },
    outlinedText: {
      ...commonText,
      color: theme.secondaryButtonText
    },

    // Common styles:
    disabled: {
      opacity: 0.7
    },
    spinner: {
      height: theme.rem(2),
      marginHorizontal: theme.rem(0.5)
    }
  }
})
