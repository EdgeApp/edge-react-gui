/**
 * IMPORTANT: Changes in this file MUST be synced with edge-react-gui!
 */

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

  // Still uses 'type', but makes it shorter (2 rem vs 3 rem)
  mini?: boolean

  /** @deprecated - Shouldn't use this post-UI4 transition */
  marginRem?: number[] | number

  /** @deprecated - Shouldn't use this post-UI4 transition */
  paddingRem?: number[] | number

  testID?: string
}

/**
 * A stylized button with 0 outside margins by default.
 * - Typically to be used as a child of ButtonsViewUi4.
 * - NOT meant to be used on its own outside of ButtonsViewUi4 unless layout='solo'
 */
export function ButtonUi4(props: Props) {
  const {
    layout = 'solo',
    alignSelf = 'auto',
    children,
    disabled = false,
    label,
    onPress,
    type = 'primary',
    spinner = false,
    mini = false,
    marginRem,
    paddingRem,
    testID
  } = props

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

  // Show a spinner if waiting on the onPress promise OR if the spinner prop is
  // manually enabled.
  const hideContent = pending || spinner

  const dynamicGradientStyles = React.useMemo(
    () => ({
      alignSelf,
      opacity: disabled ? 0.3 : hideContent ? 0.7 : 1
    }),
    [alignSelf, disabled, hideContent]
  )

  const maybeText =
    label == null ? null : (
      <EdgeText numberOfLines={1} style={[textStyle, children == null ? null : styles.leftMarginedText]}>
        {label}
      </EdgeText>
    )

  const containerStyle = React.useMemo(() => {
    const retStyle: ViewStyle[] = [styles.containerCommon]
    if (layout === 'column') retStyle.push(styles.containerColumn)
    if (layout === 'row') retStyle.push(styles.containerRow)
    if (layout === 'solo') retStyle.push(styles.containerSolo)

    if (type === 'tertiary') retStyle.push(styles.containerTertiary)
    return retStyle
  }, [layout, styles.containerColumn, styles.containerCommon, styles.containerRow, styles.containerSolo, styles.containerTertiary, type])

  const customMargin = marginRem == null ? undefined : sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
  const customPadding = paddingRem == null ? undefined : sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))
  const finalContainerCommon = React.useMemo(
    () => [styles.containerCommon, containerStyle, customMargin, customPadding],
    [containerStyle, customMargin, customPadding, styles.containerCommon]
  )

  return (
    <TouchableOpacity disabled={disabled || pending || spinner} style={finalContainerCommon} onPress={handlePress} testID={testID}>
      <LinearGradient
        {...gradientProps}
        style={[styles.contentCommon, dynamicGradientStyles, mini ? styles.contentSizeMini : styles.contentSizeDefault, ...finalContainerCommon]}
      >
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
      height: theme.rem(2)
    },
    containerCommon: {
      borderRadius: theme.rem(theme.buttonBorderRadiusRem),
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center'
    },
    contentCommon: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center'
    },

    // Other styles:
    contentSizeDefault: {
      paddingHorizontal: theme.rem(2),
      height: theme.rem(3)
    },
    contentSizeMini: {
      paddingHorizontal: theme.rem(1.5),
      height: theme.rem(2)
    },
    containerColumn: {
      alignSelf: 'stretch'
    },
    containerSolo: {
      alignSelf: 'center'
    },
    containerRow: {
      flex: 1
    },
    containerTertiary: {
      // Reduce the bounds of a tertiary button so it doesn't appear to be too
      // far from other buttons
      alignSelf: 'center',
      paddingHorizontal: 0,
      paddingVertical: 0,
      height: undefined
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
    },
    leftMarginedText: {
      marginLeft: theme.rem(0.5)
    }
  }
})
