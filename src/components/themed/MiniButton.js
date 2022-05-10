// @flow

import { wrap } from 'cavy'
import * as React from 'react'
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { usePendingPress } from '../../hooks/usePendingPress.js'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { type Theme, useTheme } from '../services/ThemeContext.js'

type Props = {|
  // The text to show inside the button:
  label: string,

  // Called when the user presses the button.
  // If the callback returns a promise, the button will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>,

  // Whether to center the button or stretch to fill the screen.
  // Defaults to 'auto', letting the parent component be in charge:
  alignSelf?: 'auto' | 'stretch' | 'center',

  // True to dim the button & prevent interactions:
  disabled?: boolean,

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number
|}

/**
 * A small button used for max sends and such.
 * Visually, this happens to look like a 5/8 scale secondary button.
 */
export function MiniButtonComponent(props: Props) {
  const { alignSelf = 'auto', disabled = false, label, marginRem, onPress } = props

  // `onPress` promise logic:
  const [pending, handlePress] = usePendingPress(onPress)

  // Styles:
  const theme = useTheme()
  const styles = getStyles(theme)
  const dynamicStyles = {
    alignSelf,
    opacity: disabled || pending ? 0.7 : 1,
    ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
  }

  return (
    <TouchableOpacity disabled={disabled || pending} style={[styles.button, dynamicStyles]} onPress={handlePress}>
      {pending ? null : (
        <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={styles.label}>
          {label}
        </Text>
      )}
      {!pending ? null : <ActivityIndicator color={theme.secondaryButtonText} style={styles.spinner} />}
    </TouchableOpacity>
  )
}

// Use the secondary button styles, but scale them:
const miniScale = 5 / 8

const getStyles = cacheStyles((theme: Theme) => ({
  button: {
    alignItems: 'center',
    backgroundColor: theme.secondaryButton,
    borderColor: theme.secondaryButtonOutline,
    borderRadius: theme.rem(0.25 * miniScale),
    borderWidth: theme.rem(0.1 * miniScale),
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(3 * miniScale),
    minWidth: theme.rem(9 * miniScale),
    padding: theme.rem(0.5 * miniScale)
  },
  label: {
    color: theme.secondaryButtonText,
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1 * miniScale),
    marginHorizontal: theme.rem(0.5 * miniScale)
  },
  spinner: {
    height: theme.rem(2 * miniScale),
    marginHorizontal: theme.rem(0.5 * miniScale)
  }
}))
export const MiniButton = wrap(MiniButtonComponent)
