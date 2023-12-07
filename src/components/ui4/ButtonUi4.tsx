import * as React from 'react'
import { ActivityIndicator, Platform, Text, TouchableOpacity, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { cacheStyles } from 'react-native-patina'

import { usePendingPress } from '../../hooks/usePendingPress'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { Theme, useTheme } from '../services/ThemeContext'

export type ButtonTypeUi4 = 'primary' | 'secondary' | 'tertiary'

interface Props {
  children?: React.ReactNode

  // Called when the user presses the button.
  // If the callback returns a promise, the button will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>

  // Whether to center the button or stretch to fill the screen.
  // Defaults to 'auto', letting the parent component be in charge:
  alignSelf?: 'auto' | 'stretch' | 'center'

  // True to dim the button & prevent interactions:
  disabled?: boolean

  // If this is set, the component will insert a text node after its children:
  label?: string

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number

  // True to show a spinner after the contents:
  spinner?: boolean

  // Which visual style to use. Defaults to primary (solid):
  type?: ButtonTypeUi4
}

/**
 * A stand-alone button to perform the primary action in a modal or scene.
 */
export function ButtonUi4(props: Props) {
  const { alignSelf = 'center', children, disabled = false, label, marginRem, onPress, type = 'primary', spinner = false } = props

  // `onPress` promise logic:
  const [pending, handlePress] = usePendingPress(onPress)

  // Styles:
  const theme = useTheme()
  const styles = getStyles(theme)

  let buttonShadow, spinnerColor, textStyle, gradientProps
  if (type === 'primary') {
    textStyle = styles.primaryText
    buttonShadow = styles.primaryShadow

    spinnerColor = theme.buttonPrimaryUi4.spinnerColor
    gradientProps = theme.buttonPrimaryUi4.gradientProps
  } else if (type === 'secondary') {
    textStyle = styles.secondaryText
    buttonShadow = styles.secondaryShadow

    spinnerColor = theme.buttonSecondaryUi4.spinnerColor
    gradientProps = theme.buttonSecondaryUi4.gradientProps
  } else {
    // (type === 'tertiary')
    textStyle = styles.tertiaryText
    buttonShadow = styles.tertiaryShadow

    spinnerColor = theme.buttonTertiaryUi4.spinnerColor
    gradientProps = theme.buttonTertiaryUi4.gradientProps
  }

  const dynamicGradientStyles = {
    alignSelf,
    opacity: disabled ? 0.3 : pending ? 0.7 : 1,
    ...sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
  }

  const androidAdjust = Platform.OS === 'android' ? styles.androidAdjust : null
  const textShadow = Platform.OS === 'ios' ? theme.shadowTextIosUi4 : theme.shadowTextAndroidUi4

  // Show a spinner if waiting on the onPress promise OR if the spinner prop is
  // manually enabled.
  const hideContent = pending || spinner

  const maybeText =
    label == null ? null : (
      <Text adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1} style={[textStyle, textShadow]}>
        {label}
      </Text>
    )

  return (
    <TouchableOpacity disabled={disabled || pending} style={[buttonShadow, styles.borderRadiusCommon]} onPress={handlePress}>
      <LinearGradient {...gradientProps} style={[styles.gradientLayoutCommon, dynamicGradientStyles, styles.borderRadiusCommon, androidAdjust]}>
        {hideContent ? null : children}
        {hideContent ? null : maybeText}
        {!hideContent ? null : <ActivityIndicator color={spinnerColor} style={styles.spinnerCommon} />}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonTextViewStyle: ViewStyle = {
    marginHorizontal: theme.rem(0),
    paddingVertical: theme.rem(0.25),
    paddingHorizontal: theme.rem(0.5)
  }

  return {
    androidAdjust: {
      paddingBottom: 3
    },
    primaryText: {
      ...commonTextViewStyle,
      ...theme.buttonPrimaryUi4.textStyle,
      fontSize: theme.rem(theme.buttonFontSizeRemUi4)
    },
    primaryShadow: {
      ...theme.buttonPrimaryUi4.shadowParams
    },
    primaryContainer: {
      ...theme.buttonPrimaryUi4.containerStyle
    },
    secondaryText: {
      ...commonTextViewStyle,
      ...theme.buttonSecondaryUi4.textStyle,
      fontSize: theme.rem(theme.buttonFontSizeRemUi4)
    },
    secondaryShadow: {
      ...theme.buttonSecondaryUi4.shadowParams
    },
    secondaryContainer: {
      ...theme.buttonSecondaryUi4.containerStyle
    },
    tertiaryText: {
      ...commonTextViewStyle,
      ...theme.buttonTertiaryUi4.textStyle,
      fontSize: theme.rem(theme.buttonFontSizeRemUi4)
    },
    tertiaryShadow: {
      ...theme.buttonTertiaryUi4.shadowParams
    },
    tertiaryContainer: {
      ...theme.buttonTertiaryUi4.containerStyle
    },

    // Common styles:
    spinnerCommon: {
      height: theme.rem(2),
      marginHorizontal: theme.rem(0.5)
    },
    borderRadiusCommon: {
      borderRadius: theme.rem(theme.buttonBorderRadiusRemUi4)
    },
    gradientLayoutCommon: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      minHeight: theme.rem(2),
      minWidth: theme.rem(8)
    }
  }
})
