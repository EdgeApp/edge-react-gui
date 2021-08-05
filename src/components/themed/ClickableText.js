// @flow

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

  // The gap inside the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `padding` property. Defaults to 0.5.
  paddingRem?: number[] | number,

  // True to show a spinner after the contents:
  spinner?: boolean,

  // Icon to display in the button.
  icon?: React.Node
|}

/**
 * A stand-alone clickable text component to perform the general actions in a modal or scene.
 */
export function ClickableText(props: Props) {
  const { alignSelf = 'auto', children, disabled = false, icon, label, marginRem, onPress, paddingRem, spinner = false } = props

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

  // Styles:
  const theme = useTheme()
  const styles = getStyles(theme)
  const dynamicStyles = {
    alignSelf,
    opacity: disabled || pending ? 0.7 : 1,
    ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
    ...sidesToPadding(mapSides(fixSides(paddingRem, 0.5), theme.rem))
  }

  return (
    <TouchableOpacity disabled={disabled || pending} style={[styles.buttonContainer, dynamicStyles]} onPress={handlePress}>
      {icon != null ? icon : null}
      {label != null && !pending ? <Text style={styles.buttonText}>{label}</Text> : null}
      {!pending ? children : null}
      {spinner || pending ? <ActivityIndicator color={theme.secondaryButtonText} style={styles.spinner} /> : null}
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    buttonContainer: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      minWidth: theme.rem(9),
      backgroundColor: theme.secondaryButton
    },
    buttonText: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(1),
      lineHeight: theme.rem(2),
      margin: theme.rem(0.5),
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
