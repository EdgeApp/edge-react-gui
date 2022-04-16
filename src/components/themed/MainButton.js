// @flow

import * as React from 'react'
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { cacheStyles } from 'react-native-patina'

import { usePendingPress } from '../../hooks/usePendingPress.js'
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

  // If this is set, the component will insert a text node after its children:
  label?: string,

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number,

  // The gap inside the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `padding` property. Defaults to 0.5.
  paddingRem?: number[] | number,

  // True to show a spinner after the contents:
  spinner?: boolean,

  // Which visual style to use. Defaults to primary (solid):
  type?: 'primary' | 'secondary' | 'escape'
|}

/**
 * A stand-alone button to perform the primary action in a modal or scene.
 */
export function MainButton(props: Props) {
  const { alignSelf = 'auto', children, disabled = false, label, marginRem, onPress, type = 'primary', paddingRem, spinner = false } = props

  // `onPress` promise logic:
  const [pending, handlePress] = usePendingPress(onPress)

  // Styles:
  const theme = useTheme()
  const styles = getStyles(theme)

  let touchableStyle, textStyle, spinnerColor, colors, start, end
  if (type === 'primary') {
    touchableStyle = styles.primaryButton
    textStyle = styles.primaryText
    spinnerColor = theme.primaryButtonText
    colors = theme.primaryButton
    start = theme.primaryButtonColorStart
    end = theme.primaryButtonColorEnd
  } else if (type === 'secondary') {
    touchableStyle = styles.secondaryButton
    textStyle = styles.secondaryText
    spinnerColor = theme.secondaryButtonText
    colors = theme.secondaryButton
    start = theme.secondaryButtonColorStart
    end = theme.secondaryButtonColorEnd
  } else {
    touchableStyle = styles.escapeButton
    textStyle = styles.escapeText
    spinnerColor = theme.escapeButtonText
    colors = theme.escapeButton
    start = theme.escapeButtonColorStart
    end = theme.escapeButtonColorEnd
  }
  const dynamicStyles = {
    alignSelf,
    opacity: disabled ? 0.3 : pending ? 0.7 : 1,
    ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
    ...sidesToPadding(mapSides(fixSides(paddingRem, 0.5), theme.rem))
  }

  return (
    <TouchableOpacity disabled={disabled || pending} onPress={handlePress}>
      <LinearGradient colors={colors} start={start} end={end} style={[touchableStyle, dynamicStyles, styles.linearGradient]}>
        {pending ? null : children}
        {pending || label == null ? null : (
          <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={textStyle}>
            {label}
          </Text>
        )}
        {!pending && !spinner ? null : <ActivityIndicator color={spinnerColor} style={styles.spinner} />}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonButton = {
    alignItems: 'center',
    borderRadius: theme.rem(theme.buttonBorderRadiusRem),
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(3),
    minWidth: theme.rem(9)
  }
  const commonText = {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    marginHorizontal: theme.rem(0.5)
  }

  return {
    linearGradient: {
      // flex: 1,
      paddingLeft: 0,
      paddingRight: 0,
      borderRadius: theme.rem(theme.buttonBorderRadiusRem)
    },

    primaryButton: {
      ...commonButton,
      borderColor: theme.primaryButtonOutline,
      borderWidth: theme.primaryButtonOutlineWidth
    },

    primaryText: {
      ...commonText,
      color: theme.primaryButtonText
    },

    secondaryButton: {
      ...commonButton,
      borderColor: theme.secondaryButtonOutline,
      borderWidth: theme.secondaryButtonOutlineWidth
    },

    secondaryText: {
      ...commonText,
      color: theme.secondaryButtonText
    },

    escapeButton: {
      ...commonButton,
      borderColor: theme.escapeButtonOutline,
      borderWidth: theme.escapeButtonOutlineWidth
    },

    escapeText: {
      ...commonText,
      color: theme.escapeButtonText
    },

    // Common styles:
    spinner: {
      height: theme.rem(2),
      marginHorizontal: theme.rem(0.5)
    }
  }
})
