import * as React from 'react'
import { ActivityIndicator, Platform, TouchableOpacity, ViewStyle } from 'react-native'
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

  let spinnerColor, textStyle, gradientProps
  if (type === 'primary') {
    textStyle = styles.primaryText
    spinnerColor = theme.buttonPrimaryUi4.spinnerColor
    gradientProps = theme.buttonPrimaryUi4.gradientProps
  } else if (type === 'secondary') {
    textStyle = styles.secondaryText
    spinnerColor = theme.buttonSecondaryUi4.spinnerColor
    gradientProps = theme.buttonSecondaryUi4.gradientProps
  } else {
    // (type === 'tertiary')
    textStyle = styles.tertiaryText
    spinnerColor = theme.buttonTertiaryUi4.spinnerColor
    gradientProps = theme.buttonTertiaryUi4.gradientProps
  }

  const dynamicGradientStyles = {
    alignSelf,
    opacity: disabled ? 0.3 : pending ? 0.7 : 1,
    ...(marginRem == null ? {} : sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))),
    ...(paddingRem == null ? {} : sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem)))
  }

  const textShadow = Platform.OS === 'ios' ? theme.shadowTextIosUi4 : theme.shadowTextAndroidUi4

  // Show a spinner if waiting on the onPress promise OR if the spinner prop is
  // manually enabled.
  const hideContent = pending || spinner

  const maybeText =
    label == null ? null : (
      <EdgeText numberOfLines={1} disableFontScaling style={[textStyle, textShadow]}>
        {label}
      </EdgeText>
    )

  const containerStyle: ViewStyle[] = [styles.containerCommon]
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
  const commonTextViewStyle: ViewStyle = {
    marginHorizontal: theme.rem(0),
    paddingVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(1.5)
  }

  return {
    containerColumn: {
      alignSelf: 'center',
      marginVertical: theme.rem(0.25)
    },
    containerSolo: {
      alignSelf: 'center'
    },
    containerRow: {
      flex: 1
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
    containerCommon: {
      borderRadius: theme.rem(theme.buttonBorderRadiusRemUi4),
      alignSelf: 'stretch'
    },
    gradientLayoutCommon: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      height: theme.rem(2.5),
      marginHorizontal: theme.rem(0.5)
    }
  }
})
