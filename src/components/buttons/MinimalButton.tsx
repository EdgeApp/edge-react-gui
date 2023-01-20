import * as React from 'react'
import { ActivityIndicator, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { usePendingPress } from '../../hooks/usePendingPress'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { Theme, useTheme } from '../services/ThemeContext'

interface Props {
  // True to dim the button & prevent interactions:
  disabled?: boolean

  // Outlined border
  highlighted?: boolean

  // The text to show inside the button:
  label: string

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number

  // Called when the user presses the button.
  // If the callback returns a promise, the button will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

/**
 * A toggle-able button in 'minimalist' style
 */
const MinimalButtonComponent = (props: Props) => {
  const { highlighted, disabled = false, label, marginRem, onPress } = props

  const [pending, handlePress] = usePendingPress(onPress)

  const theme = useTheme()
  const styles = getStyles(theme)

  const memoizedStyle = React.useMemo(
    () => [
      highlighted === true ? styles.buttonSelected : styles.button,
      {
        opacity: disabled || pending ? 0.7 : 1,
        ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
      }
    ],
    [disabled, highlighted, marginRem, pending, styles, theme.rem]
  )

  return (
    <TouchableOpacity disabled={disabled || pending} style={memoizedStyle} onPress={handlePress}>
      {pending ? null : (
        <Text adjustsFontSizeToFit minimumFontScale={0.25} numberOfLines={1} style={highlighted ? styles.labelSelected : styles.label}>
          {label}
        </Text>
      )}
      {!pending ? null : <ActivityIndicator color={theme.secondaryButtonText} style={styles.spinner} />}
    </TouchableOpacity>
  )
}

// Use the secondary button styles, but scale them:
const miniScale = 5 / 8

const getStyles = cacheStyles((theme: Theme) => {
  const buttonCommon: ViewStyle = {
    alignItems: 'center',
    borderRadius: theme.rem(0.25 * miniScale),
    borderWidth: theme.rem(0.1 * miniScale),
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.rem(0.5 * miniScale)
  }
  const labelCommon: TextStyle = {
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1 * miniScale),
    marginHorizontal: theme.rem(0.5 * miniScale)
  }

  return {
    button: {
      ...buttonCommon,
      backgroundColor: theme.tileBackground,
      borderColor: theme.tileBackground
    },
    buttonSelected: {
      ...buttonCommon,
      backgroundColor: theme.secondaryButtonOutline,
      borderColor: theme.secondaryButtonOutline
    },
    label: {
      ...labelCommon,
      color: theme.secondaryButtonText
    },
    labelSelected: {
      ...labelCommon,
      color: theme.backgroundGradientColors[0]
    },
    labelDisabled: {
      ...labelCommon,
      color: theme.deactivatedText
    },
    spinner: {
      height: theme.rem(2 * miniScale),
      marginHorizontal: theme.rem(0.5 * miniScale)
    }
  }
})

export const MinimalButton = React.memo(MinimalButtonComponent)
