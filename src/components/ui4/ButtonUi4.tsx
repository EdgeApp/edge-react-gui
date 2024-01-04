import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { cacheStyles } from 'react-native-patina'

import { usePendingPress } from '../../hooks/usePendingPress'
import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export type ButtonTypeUi4 = 'primary' | 'secondary' | 'tertiary'

interface Props {
  children?: React.ReactNode

  // Called when the user presses the button.
  // If the callback returns a promise, the button will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>

  // Whether to center the button or stretch to fill the screen.
  // Defaults to 'auto', letting the parent component be in charge:
  alignSelf?: 'auto' | 'stretch' | 'center' // TODO: Maybe also remove this once column layout is restyled for UI4

  // True to dim the button & prevent interactions:
  disabled?: boolean

  // If this is set, the component will insert a text node after its children:
  label?: string

  // Parent container layout
  layout?: 'row' | 'column' | 'solo'

  // True to show a spinner after the contents:
  spinner?: boolean

  // Which visual style to use. Defaults to primary (solid):
  type?: ButtonTypeUi4

  /** @deprecated - Shouldn't use this post-UI4 transition */
  marginRem?: number[] | number

  /** @deprecated - Shouldn't use this post-UI4 transition */
  paddingRem?: number[] | number
}

/**
 * A stand-alone button to perform the primary action in a modal or scene.
 */
export function ButtonUi4(props: Props) {
  const { layout = 'solo', alignSelf = 'auto', children, disabled = false, label, onPress, type = 'primary', spinner = false, marginRem, paddingRem } = props

  // `onPress` promise logic:
  const [pending, handlePress] = usePendingPress(onPress)

  // Styles:
  const theme = useTheme()
  const styles = getStyles(theme)

  const buttonProps = {
    primary: {
      textStyle: styles.primaryText,
      spinnerColor: theme.primaryButtonText,
      gradientProps: {
        colors: theme.primaryButton,
        end: theme.primaryButtonColorEnd,
        start: theme.primaryButtonColorStart
      }
    },
    secondary: {
      textStyle: styles.secondaryText,
      spinnerColor: theme.secondaryButtonText,
      gradientProps: {
        colors: theme.secondaryButton,
        end: theme.secondaryButtonColorEnd,
        start: theme.secondaryButtonColorStart
      }
    },
    tertiary: {
      textStyle: styles.tertiaryText,
      spinnerColor: theme.escapeButtonText,
      gradientProps: {
        colors: theme.escapeButton,
        end: theme.escapeButtonColorEnd,
        start: theme.escapeButtonColorStart
      }
    }
  }

  const { spinnerColor, textStyle, gradientProps } = buttonProps[type]

  const dynamicGradientStyles = {
    alignSelf,
    opacity: disabled ? 0.3 : pending ? 0.7 : 1
  }

  // Show a spinner if waiting on the onPress promise OR if the spinner prop is
  // manually enabled.
  const hideContent = pending || spinner

  const maybeText =
    label == null ? null : (
      <EdgeText numberOfLines={1} disableFontScaling style={textStyle}>
        {label}
      </EdgeText>
    )

  const containerStyle: ViewStyle[] = [
    styles.containerCommon,
    marginRem == null ? {} : sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem)),
    paddingRem == null ? {} : sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))
  ]
  if (layout === 'column') containerStyle.push(styles.containerColumn)
  if (layout === 'row') containerStyle.push(styles.containerRow)
  if (layout === 'solo') containerStyle.push(styles.containerSolo)

  const finalContainerCommon = [styles.containerCommon, containerStyle]

  return (
    <TouchableOpacity disabled={disabled || pending} style={finalContainerCommon} onPress={handlePress}>
      <LinearGradient {...gradientProps} style={[styles.gradientLayoutCommon, dynamicGradientStyles, ...finalContainerCommon]}>
        {hideContent ? null : children}
        {hideContent ? null : maybeText}
        {!hideContent ? null : <ActivityIndicator color={spinnerColor} style={styles.spinnerCommon} />}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    // Common styles:
    spinnerCommon: {
      height: theme.rem(2),
      marginLeft: theme.rem(0.5)
    },
    containerCommon: {
      borderRadius: theme.rem(theme.buttonBorderRadiusRem),
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center'
    },
    gradientLayoutCommon: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      height: theme.rem(3),
      paddingHorizontal: theme.rem(2)
    },

    // Other styles:
    containerColumn: {
      alignSelf: 'stretch'
    },
    containerSolo: {
      alignSelf: 'center'
    },
    containerRow: {
      flex: 1
    },
    primaryText: {
      fontFamily: theme.primaryButtonFont,
      fontSize: theme.rem(theme.primaryButtonFontSizeRem),
      color: theme.primaryButtonText
    },
    secondaryText: {
      fontFamily: theme.secondaryButtonFont,
      fontSize: theme.rem(theme.secondaryButtonFontSizeRem),
      color: theme.secondaryButtonText
    },
    tertiaryText: {
      fontFamily: theme.escapeButtonFont,
      fontSize: theme.rem(theme.escapeButtonFontSizeRem),
      color: theme.escapeButtonText
    }
  }
})
