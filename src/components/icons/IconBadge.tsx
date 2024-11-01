import * as React from 'react'
import { Platform, StyleProp, View, ViewStyle } from 'react-native'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

const SCALE = 0.9

export interface Props {
  children: React.ReactNode
  sizeRem: number
  onPress: () => void | Promise<void>
  /**
   * - If undefined, renders only the children, without a badge.
   * - If 0, renders a red dot with a white circle inside.
   * - All other cases: renders a red dot with a white number inside.
   */
  number?: number
  testID?: string
}

/**
 * Maybe renders a red dot badge on top of the supplied `children,` with a white
 * number or dot inside. Visibility of the red dot depends on the `number` prop.
 */
export const IconBadge = (props: Props) => {
  const { number, children, sizeRem, testID, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const size = theme.rem(sizeRem)
  const containerStyle: StyleProp<ViewStyle> = React.useMemo(
    () => ({
      // ...styles.tappableArea,
      height: size,
      width: size,
      alignItems: 'center',
      justifyContent: 'center'
    }),
    [size]
  )

  return (
    <EdgeTouchableOpacity accessible={false} style={containerStyle} onPress={onPress} testID={testID}>
      {children}
      {number == null ? null : (
        <View style={styles.badgeContainer}>
          {number === 0 ? (
            <View style={styles.circle} />
          ) : (
            <EdgeText style={[styles.superscriptLabel, Platform.OS === 'android' ? styles.androidAdjust : null]} disableFontScaling>
              {number}
            </EdgeText>
          )}
        </View>
      )}
    </EdgeTouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const badgeSize = theme.rem(0.75) * SCALE

  return {
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    badgeContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      top: 0,
      right: 0,
      height: badgeSize,
      minWidth: badgeSize,
      borderRadius: badgeSize / 2,
      paddingLeft: theme.rem(0.25) / 2,
      paddingRight: theme.rem(0.25) / 2,
      backgroundColor: 'red'
    },
    label: {
      textAlign: 'center',
      marginBottom: theme.rem(0.5)
    },
    superscriptLabel: {
      fontSize: theme.rem(0.5)
    },
    androidAdjust: {
      marginTop: 2,
      marginLeft: 1
    },
    circle: {
      width: theme.rem(0.25),
      height: theme.rem(0.25),
      borderRadius: theme.rem(0.125),
      backgroundColor: 'white',
      alignSelf: 'center'
    }
  }
})
