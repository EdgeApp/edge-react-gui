import * as React from 'react'
import { Platform, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface Props {
  /** Text that goes below the button */
  label: string

  /** React node that gets rendered within the circular container area */
  children?: React.ReactNode

  /** Text to render on top of a primary gradient container in the top right */
  superscriptLabel?: string

  /** Specific size for the circular container, defaults to 3 if not specified */
  sizeRem?: number

  testID?: string
  onPress: () => void | Promise<void>
}

/**
 * Renders the child in a circular container, with the text label below.
 * Renders the superScriptLabel in the top right in a primary button style
 * container, if given.
 */
export const IconButton = (props: Props) => {
  const { children, superscriptLabel, label, sizeRem = 3, testID, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const size = theme.rem(sizeRem)

  const iconContainerStyle = React.useMemo(
    () => ({
      ...styles.iconContainer,
      height: size,
      width: size,
      borderRadius: size / 2
    }),
    [styles.iconContainer, size]
  )

  return (
    <EdgeTouchableOpacity accessible={false} style={styles.tappableArea} onPress={onPress} testID={testID}>
      <View style={styles.topContainer}>
        <View style={iconContainerStyle}>{children}</View>
        {superscriptLabel == null ? null : (
          <LinearGradient
            colors={theme.primaryButton}
            start={theme.primaryButtonColorStart}
            end={theme.primaryButtonColorEnd}
            style={styles.superScriptContainer}
          >
            <EdgeText style={[styles.superscriptLabel, Platform.OS === 'android' ? styles.androidAdjust : null]} disableFontScaling>
              {superscriptLabel}
            </EdgeText>
          </LinearGradient>
        )}
      </View>
      <EdgeText style={styles.label}>{label}</EdgeText>
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tappableArea: {
    flexShrink: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.rem(0.5),
    marginHorizontal: -theme.rem(1),
    paddingHorizontal: theme.rem(1)
  },
  topContainer: {
    flexShrink: 1,
    alignItems: 'center',
    paddingTop: theme.rem(0.5),
    marginBottom: theme.rem(0.25),
    justifyContent: 'center'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBaseColor
  },
  superScriptContainer: {
    position: 'absolute',
    top: 0,
    height: theme.rem(1.25),
    borderRadius: theme.rem(1.25 / 2),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    transform: [{ translateX: theme.rem(1) }],
    paddingLeft: theme.rem(0.5),
    paddingRight: theme.rem(0.5) - 2
  },
  label: {
    textAlign: 'center',
    marginBottom: theme.rem(0.5)
  },
  superscriptLabel: {
    fontSize: theme.rem(0.75)
  },
  androidAdjust: {
    marginTop: 1
  }
}))
