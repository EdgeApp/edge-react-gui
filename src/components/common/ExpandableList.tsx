import * as React from 'react'
import { Platform, ScrollView, View, ViewStyle } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { ShadowedView } from 'react-native-fast-shadow'
import { cacheStyles } from 'react-native-patina'
import Animated, { Easing, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { GradientFadeOut } from '../modals/GradientFadeout'
import { Airship } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'

interface Props {
  isExpanded: boolean
  items: React.ReactNode[]
  /** Defaults to 4.75 */
  maxDisplayedItems?: number
  /** If not provided, defaults to full screen width. Whether set or not, 0.5rem
   * margins are applied. */
  widthRem?: number
}

export const ExpandableList = (props: Props) => {
  const { isExpanded, items, maxDisplayedItems = 4.75, widthRem } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const [localBridge, setLocalBridge] = React.useState<AirshipBridge<undefined>>()
  const [itemHeight, setItemHeight] = React.useState(0)
  const [dropdownLayoutStyle, setDropdownLayoutStyle] = React.useState<ViewStyle | null>()

  /** To measure the positioning and width of the anchor view */
  const anchorViewRef = React.useRef<View>(null)

  const sAnimationMult = useSharedValue(0)

  const dFinalHeight = useDerivedValue(() => {
    return itemHeight * Math.min(items.length, maxDisplayedItems)
  })

  const aContainerHeightStyle = useAnimatedStyle(() => ({
    height: withTiming(isExpanded ? dFinalHeight.value : 0, {
      duration: 250,
      easing: Easing.inOut(Easing.circle)
    }),
    opacity: isExpanded && items.length > 0 ? sAnimationMult.value : withTiming(0, { duration: 500 })
  }))

  const aFadeoutStyle = useAnimatedStyle(() => {
    const isShowFade = items.length > maxDisplayedItems && isExpanded
    return {
      opacity: isShowFade ? withTiming(1, { duration: 500 }) : withTiming(0, { duration: 250 }),
      height: isShowFade ? withTiming(48, { duration: 500 }) : withTiming(0, { duration: 250 })
    }
  })

  useAsyncEffect(
    async () => {
      if (dropdownLayoutStyle == null || itemHeight === 0) return

      sAnimationMult.value = withTiming(isExpanded ? 1 : 0, {
        duration: 500,
        easing: Easing.inOut(Easing.circle)
      })

      if (isExpanded && items.length > 0) {
        if (localBridge != null) {
          localBridge.resolve(undefined)
        }

        await Airship.show<undefined>(bridge => {
          setLocalBridge(bridge)

          return (
            <Animated.View style={[styles.dropdownContainer, aContainerHeightStyle, dropdownLayoutStyle]}>
              <ShadowedView style={[styles.shadowViewStyle, Platform.OS === 'android' && styles.shadowViewStyleAndroidAdjust]}>
                <ScrollView keyboardShouldPersistTaps="always" style={styles.scrollContainer} scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
                  {items}
                </ScrollView>
                {!isExpanded ? null : (
                  <Animated.View style={[styles.fadeoutContainer, aFadeoutStyle]}>
                    <GradientFadeOut />
                  </Animated.View>
                )}
              </ShadowedView>
            </Animated.View>
          )
        })
      } else {
        localBridge?.resolve(undefined)
      }

      // Cleanup
      return () => {
        localBridge?.resolve(undefined)
      }
    },
    [sAnimationMult, isExpanded, items, dropdownLayoutStyle, itemHeight],
    'ExpandableList'
  )

  // Measure the anchor view position and width
  React.useEffect(() => {
    if (anchorViewRef.current != null) {
      anchorViewRef.current.measureInWindow((x, y, width, height) => {
        // iOS and Android return various garbage values initially.
        // We expect positive nonzero values. We can always safely omit 0 values
        // because we guarantee some amount of margin under correct UI design
        if (x <= 0 || y <= 0 || width <= 0) return

        setDropdownLayoutStyle({ left: x, top: Platform.OS === 'android' ? y + 25 : y, width: widthRem == null ? width : theme.rem(widthRem) })
      })
    }
  }, [dropdownLayoutStyle, anchorViewRef, theme, isExpanded, widthRem])

  const handleRowLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    if (event != null && itemHeight === 0) {
      const { height } = event.nativeEvent.layout
      setItemHeight(height)
    }
  }

  return (
    <View ref={anchorViewRef} style={styles.anchorContainer} collapsable={false}>
      {items.length === 0 ? null : (
        <View style={styles.dummyMeasureContainer} onLayout={handleRowLayout}>
          {items[0]}
        </View>
      )}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  anchorContainer: {
    marginHorizontal: theme.rem(0.5)
  },
  dropdownContainer: {
    position: 'absolute',
    borderRadius: theme.rem(0.5)
  },
  dummyMeasureContainer: {
    position: 'absolute',
    opacity: 0
  },
  fadeoutContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    borderBottomLeftRadius: theme.rem(0.5),
    borderBottomRightRadius: theme.rem(0.5),
    overflow: 'hidden'
  },
  scrollContainer: {
    flexGrow: 1
  },
  shadowViewStyle: {
    borderRadius: theme.rem(0.5),
    backgroundColor: theme.modal,
    ...theme.dropdownListShadow
  },
  shadowViewStyleAndroidAdjust: {
    shadowOpacity: 0.1
  }
}))
