// @flow

import * as React from 'react'
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { usePendingPress } from '../../hooks/usePendingPress.js'
import { fixSides, mapSides, sidesToPadding } from '../../util/sides.js'
import { type Theme, useTheme } from '../services/ThemeContext.js'

type Props = {|
  children?: React.Node,

  // Whether to center the button or stretch to fill the screen.
  // Defaults to 'auto', letting the parent component be in charge:
  alignSelf?: 'auto' | 'stretch' | 'center',

  // True to dim the button & prevent interactions:
  disabled?: boolean,

  // If this is set, the component will insert a text node after its children:
  label?: string,

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number,

  // Called when the user presses the button.
  // If the callback returns a promise, the button will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
|}

/**
 * A stand-alone clickable text component to perform the general actions in a modal or scene.
 */
export function ClickableText(props: Props) {
  const { alignSelf = 'auto', children, disabled = false, label, marginRem, onPress } = props

  // `onPress` promise logic:
  const [pending, handlePress] = usePendingPress(onPress)

  // Styles:
  const theme = useTheme()
  const styles = getStyles(theme)
  const dynamicStyles = {
    alignSelf,
    opacity: disabled || pending ? 0.7 : 1,
    // We turn margins into padding to get more tappable area:
    ...sidesToPadding(mapSides(fixSides(marginRem, 0), theme.rem))
  }
  const textStyle = {
    marginLeft: children == null ? 0 : theme.rem(0.5)
  }

  return (
    <TouchableOpacity disabled={disabled || pending} style={[styles.container, dynamicStyles]} onPress={handlePress}>
      {pending ? null : children}
      {pending || label == null ? null : <Text style={[styles.text, textStyle]}>{label}</Text>}
      {!pending ? null : <ActivityIndicator color={theme.textLink} style={styles.spinner} />}
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  text: {
    color: theme.textLink,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false,
    textAlignVertical: 'center'
  },
  spinner: {
    marginHorizontal: theme.rem(0.5)
  }
}))
