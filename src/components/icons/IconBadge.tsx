import * as React from 'react'
import { Platform, StyleProp, View, ViewStyle } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface Props {
  children: React.ReactNode
  /** Size of the child icon */
  sizeRem: number

  /** To adjust the position of the dot */
  offsetX?: number
  /** To adjust the position of the dot */
  offsetY?: number
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
  const { number, children, offsetX = 0, offsetY = 0, sizeRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const containerStyle: StyleProp<ViewStyle> = React.useMemo(
    () => ({
      height: theme.rem(sizeRem),
      width: theme.rem(sizeRem),
      alignItems: 'center',
      justifyContent: 'center'
    }),
    [theme, sizeRem]
  )

  const badgeStyle: StyleProp<ViewStyle> = React.useMemo(() => {
    const badgeSize = theme.rem(0.6)
    return {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      top: -badgeSize / 2 + offsetY,
      right: -badgeSize / 2 + offsetX,
      height: badgeSize,
      minWidth: badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: 'red'
    }
  }, [offsetX, offsetY, theme])

  return (
    <View style={containerStyle}>
      {children}
      {number == null ? null : (
        <View style={badgeStyle}>
          {number === 0 ? (
            <View style={styles.priorityCircle} />
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
  return {
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    textIos: {
      fontSize: theme.rem(0.5) - 1,
      fontFamily: theme.fontFaceBold,
      marginLeft: 2,
      marginRight: 1
    },
    textAndroid: {
      fontSize: theme.rem(0.5) - 1,
      fontFamily: theme.fontFaceBold,
      marginTop: 1.5,
      marginHorizontal: 2
    },
    priorityCircle: {
      width: theme.rem(0.15),
      height: theme.rem(0.15),
      borderRadius: theme.rem(0.15 / 2),
      backgroundColor: 'white'
    }
  }
})
