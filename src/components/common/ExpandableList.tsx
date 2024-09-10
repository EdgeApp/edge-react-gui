/**
 * IMPORTANT: Changes in this file MUST be synced between edge-react-gui and
 * edge-login-ui-rn!
 */

import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import Animated, { Easing, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { GradientFadeOut } from '../modals/GradientFadeout'
import { Theme, useTheme } from '../services/ThemeContext'

interface Props {
  isExpanded: boolean
  items: React.ReactNode[]
  itemHeight: number
  /** Defaults to 4.75. */
  maxDisplayedItems?: number
  /** Defaults to full scene width. If specified, is left-justified with
   * built-in 0.5rem margins on the specified width. */
  widthRem?: number
}

export const ExpandableList = ({ isExpanded, items, itemHeight, maxDisplayedItems = 4.75, widthRem }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const [isAnimateItemsNumChange, setIsAnimateItemsNumChange] = React.useState(false)

  const widthStyle = React.useMemo(
    () =>
      widthRem != null
        ? {
            width: theme.rem(widthRem)
          }
        : undefined,
    [theme, widthRem]
  )

  const sAnimationMult = useSharedValue(0)

  const dFinalHeight = useDerivedValue(() => {
    return itemHeight * Math.min(items.length, maxDisplayedItems)
  })

  const aContainerStyle = useAnimatedStyle(() => ({
    height: withTiming(dFinalHeight.value * sAnimationMult.value, {
      duration: isAnimateItemsNumChange ? 250 : 0,
      easing: Easing.inOut(Easing.circle)
    }),
    opacity: isExpanded && items.length > 0 ? sAnimationMult.value : withTiming(0, { duration: 500 })
  }))

  React.useEffect(() => {
    sAnimationMult.value = withTiming(isExpanded ? 1 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.circle)
    })
  }, [sAnimationMult, isExpanded])

  React.useEffect(() => {
    setIsAnimateItemsNumChange(isExpanded)
  }, [items, isExpanded])

  return (
    <View style={styles.relativeContainer}>
      <Animated.View style={[styles.dropdownContainer, widthStyle, aContainerStyle]}>
        <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
          {items}
        </ScrollView>
        <GradientFadeOut />
      </Animated.View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  relativeContainer: {
    position: 'relative',
    zIndex: 1
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    backgroundColor: theme.modal,
    borderRadius: theme.rem(0.5),
    left: theme.rem(0.5),
    right: theme.rem(0.5)
  }
}))
