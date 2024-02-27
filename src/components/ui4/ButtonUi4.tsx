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
  const { layout = 'solo', children, disabled = false, label, onPress, type = 'primary', spinner = false, mini = false, marginRem, paddingRem, testID } = props

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

  const maybeText =
    label == null ? null : (
      <EdgeText numberOfLines={1} style={[textStyle, children == null ? null : styles.leftMarginedText]}>
        {label}
      </EdgeText>
    )

  const touchContainerStyle = React.useMemo(() => {
    const retStyle: ViewStyle[] = [styles.touchContainerCommon]

    if (layout === 'column') retStyle.push(styles.touchContainerColumn)
    if (layout === 'row') retStyle.push(styles.touchContainerRow)
    if (layout === 'solo') retStyle.push(styles.touchContainerSolo)

    const customMargin = marginRem == null ? undefined : sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
    retStyle.push(
      customMargin != null
        ? {
            // Use margin as padding to increase tappable area
            paddingLeft: customMargin.marginLeft,
            paddingRight: customMargin.marginRight,
            paddingTop: customMargin.marginTop,
            paddingBottom: customMargin.marginBottom
          }
        : styles.touchContainerSpacing
    )

    return retStyle
  }, [layout, marginRem, styles, theme])

  const visibleContainerStyle = React.useMemo(() => {
    const retStyle: ViewStyle[] = [styles.visibleContainerCommon]

    if (layout === 'column') retStyle.push(styles.visibleContainerColumn)
    if (layout === 'row') retStyle.push(styles.visibleContainerRow)
    if (layout === 'solo') retStyle.push(styles.visibleContainerSolo)
    if (type === 'tertiary') retStyle.push(styles.visibleContainerTertiary)

    retStyle.push(mini ? styles.visibleSizeMini : type === 'tertiary' ? styles.visibleSizeTertiary : styles.visibleSizeDefault)

    if (paddingRem != null) {
      retStyle.push(sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem)))
    }

    retStyle.push({
      opacity: disabled ? 0.3 : hideContent ? 0.7 : 1
    })

    return retStyle
  }, [disabled, hideContent, layout, mini, paddingRem, styles, theme, type])

  return (
    <TouchableOpacity disabled={disabled || pending || spinner} style={touchContainerStyle} onPress={handlePress} testID={testID}>
      <LinearGradient {...gradientProps} style={visibleContainerStyle}>
        {hideContent ? null : children}
        {hideContent ? null : maybeText}
        {!hideContent ? null : <ActivityIndicator color={spinnerColor} style={styles.spinner} />}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    // Invisible Touchable Container Styles:
    touchContainerCommon: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    touchContainerSpacing: {
      // Combination of negative margin and positive padding to increase
      // invisible tappable area outside of the bounds of the visible button
      margin: -theme.rem(0.5),
      padding: theme.rem(0.5)
    },
    touchContainerRow: {
      alignSelf: 'stretch',
      flex: 1 // Size equally against other buttons in the row
    },
    touchContainerColumn: {
      alignSelf: 'stretch',
      flexBasis: 'auto',
      flexGrow: 0,
      flexShrink: 0
    },
    touchContainerSolo: {
      alignSelf: 'center',
      flexBasis: 'auto',
      flexGrow: 0,
      flexShrink: 0
    },
    // Visible Container Styles
    visibleContainerCommon: {
      borderRadius: theme.rem(theme.buttonBorderRadiusRem),
      flexGrow: 0,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row'
    },
    visibleSizeDefault: {
      paddingHorizontal: theme.rem(1.5),
      height: theme.rem(3)
    },
    visibleSizeMini: {
      alignSelf: 'center',
      paddingHorizontal: theme.rem(1.25),
      height: theme.rem(2)
    },
    visibleSizeTertiary: {
      // Reduce the bounds of a tertiary button so it doesn't appear to be too
      // far from other buttons
      padding: 0,
      height: undefined
    },
    visibleContainerColumn: {
      alignSelf: 'stretch'
    },
    visibleContainerRow: {
      alignSelf: 'stretch'
    },
    visibleContainerSolo: {
      alignSelf: 'center'
    },
    visibleContainerTertiary: {
      alignSelf: 'center'
    },

    // Content
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
    },
    spinner: {
      height: theme.rem(2)
    }
  }
})
