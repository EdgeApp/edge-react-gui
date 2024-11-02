import * as React from 'react'
import { Platform, StyleProp, View, ViewStyle } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface Props {
  children: React.ReactNode
  sizeRem: number
  /**
   * - If undefined, renders only the children, without a badge.
   * - If 0, renders a red dot with a white circle inside.
   * - All other cases: renders a red dot with a white number inside.
   */
  number?: number
}

/**
 * Maybe renders a red dot badge on top of the supplied `children,` with a white
 * number or dot inside. Visibility of the red dot depends on the `number` prop.
 *
 * For backwards compatibility, takes a style prop and provides no built-in margins.
 */
export const IconBadge = (props: Props) => {
  const { number, children, sizeRem } = props
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
    <View style={containerStyle}>
      {children}
      {number == null ? null : (
        <View style={styles.badgeContainer}>
          {number === 0 ? (
            <View style={styles.circle} />
          ) : (
            <EdgeText style={Platform.OS === 'android' ? styles.textAndroid : styles.textIos} disableFontScaling>
              {number}
            </EdgeText>
          )}
        </View>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const badgeSize = theme.rem(0.75)

  return {
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    badgeContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      top: -badgeSize / 2,
      right: -badgeSize / 2,
      height: badgeSize,
      minWidth: badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: 'red'
    },
    // TODO: Adjust platform-specific styles
    textIos: {
      fontSize: theme.rem(0.5)
    },
    textAndroid: {
      fontSize: theme.rem(0.5),
      marginTop: 2,
      marginLeft: 1,
      marginRight: 1
    },
    circle: {
      width: theme.rem(0.2),
      height: theme.rem(0.2),
      borderRadius: theme.rem(0.1),
      backgroundColor: 'white',
      alignSelf: 'center'
    }
  }
})
