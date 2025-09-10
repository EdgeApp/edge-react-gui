import * as React from 'react'
import { Platform, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { cacheStyles } from 'react-native-patina'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

import { useHandler } from '../../hooks/useHandler'
import { getThemedIconUri } from '../../util/CdnUris'
import { BlurBackground } from '../common/BlurBackground'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { styled } from '../hoc/styled'
import { showError } from '../services/AirshipInstance'
import { type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  message: string
  title: string
  type: 'warning' | 'info'
  /** Priority cards should not auto-dismiss */
  isPriority?: boolean
  iconUri?: string
  testID?: string

  onPress: () => void | Promise<void>

  /** If provided, this card can be swiped to dismiss. */
  onDismiss?: () => void | Promise<void>
}

export const NotificationCard: React.FC<Props> = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const {
    title,
    type,
    isPriority = false,
    message,
    testID,
    onDismiss,
    onPress
  } = props
  const {
    iconUri = type === 'warning'
      ? getThemedIconUri(theme, 'notifications/icon-warning')
      : getThemedIconUri(theme, 'notifications/icon-info')
  } = props

  const opacity = useSharedValue(1)
  const pan = useSharedValue(0)
  const panStart = useSharedValue(0)
  const cardWidth = useSharedValue(0)
  const crossedThreshold = useSharedValue(false)

  const animatedStyle = useAnimatedStyle(() => {
    const width = cardWidth.value === 0 ? 1 : cardWidth.value
    const ratio = Math.min(Math.abs(pan.value) / width, 1)
    return {
      transform: [{ translateX: pan.value }],
      // Swipe-driven fade multiplied by programmatic fade value:
      opacity: (1 - ratio) * opacity.value
    }
  })

  const handlePress = useHandler(async () => {
    await onPress()
  })

  const handleDismiss = useHandler(() => {
    // Prevent double-dismiss from swipe + auto timer
    if (dismissedRef.current) return
    dismissedRef.current = true
    const p = onDismiss?.()
    if (p != null)
      p.catch((error: unknown) => {
        showError(error)
      })
  })

  // Swipe-to-dismiss gesture
  const thresholdRatio = 0.25
  const minVelocity = 800
  const panGesture = React.useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-theme.rem(1.5), theme.rem(1.5)])
      .onBegin(() => {
        crossedThreshold.value = false
        panStart.value = pan.value
      })
      .onUpdate(e => {
        const next = panStart.value + e.translationX
        pan.value = next
        const threshold = cardWidth.value * thresholdRatio
        crossedThreshold.value = Math.abs(pan.value) > threshold
      })
      .onEnd(e => {
        const threshold = cardWidth.value * thresholdRatio
        const exceeded = Math.abs(pan.value) > threshold
        const shouldDismiss = exceeded || Math.abs(e.velocityX) > minVelocity
        if (shouldDismiss) {
          const direction = pan.value >= 0 ? 1 : -1
          pan.value = withTiming(
            direction * cardWidth.value,
            { duration: 300 },
            () => {
              runOnJS(handleDismiss)()
            }
          )
        } else {
          pan.value = withTiming(0, { duration: 200 })
        }
      })
  }, [cardWidth, crossedThreshold, handleDismiss, theme, pan, panStart])

  // Auto-dismiss after 5 seconds with a simple fade-out, if this isn't a warning
  const dismissedRef = React.useRef(false)
  React.useEffect(() => {
    if (onDismiss == null || isPriority) return
    const id = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 250 }, () => {
        runOnJS(handleDismiss)()
      })
    }, 5000)
    return () => {
      clearTimeout(id)
    }
  }, [handleDismiss, onDismiss, opacity, isPriority])

  const content = (
    <Animated.View
      style={animatedStyle}
      onLayout={event => {
        cardWidth.value = event.nativeEvent.layout.width
      }}
    >
      <ShadowedView
        style={
          Platform.OS === 'android' ? styles.shadowAndroid : styles.shadowIos
        }
      >
        <BlurBackground />
        <EdgeTouchableOpacity
          style={styles.cardContainer}
          onPress={handlePress}
          testID={testID}
          activeOpacity={0.7}
        >
          <Icon source={{ uri: iconUri }} />
          <TextView>
            {/* Android font scaling is too aggressive.
                Android prioritizes font shrinking much more before trying to add
                newlines, while iOS prioritizes newlines before shrinking text.
                We already use smaller text here so we shouldn't shrink it
                more */}
            <TitleText
              type={type}
              numberOfLines={2}
              disableFontScaling={Platform.OS === 'android'}
            >
              {title}
            </TitleText>
            <MessageText
              type={type}
              numberOfLines={3}
              disableFontScaling={Platform.OS === 'android'}
            >
              {message}
            </MessageText>
          </TextView>
        </EdgeTouchableOpacity>
      </ShadowedView>
    </Animated.View>
  )

  return onDismiss == null ? (
    content
  ) : (
    <GestureDetector gesture={panGesture}>{content}</GestureDetector>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  cardContainer: {
    alignItems: 'center',
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.cardBorderRadius,
    flexDirection: 'row',
    flexShrink: 1,
    justifyContent: 'center',
    padding: theme.rem(0.5)
  },
  shadowIos: {
    borderRadius: theme.cardBorderRadius,
    marginHorizontal: theme.rem(0.5),
    // TODO: Design approval that we don't need to make ios/android specific
    // adjustments here.
    ...theme.notificationCardShadow
  },
  shadowAndroid: {
    overflow: 'hidden',
    borderRadius: theme.cardBorderRadius,
    marginHorizontal: theme.rem(0.5),
    // TODO: Design approval that we don't need to make ios/android specific
    // adjustments here.
    ...theme.notificationCardShadow
  }
}))

const Icon = styled(FastImage)(theme => ({
  height: theme.rem(3.5),
  width: theme.rem(3.5),
  marginRight: theme.rem(0.25)
}))

const TitleText = styled(EdgeText)<{ type: 'warning' | 'info' }>(
  theme => props => ({
    color: props.type === 'warning' ? theme.warningIcon : theme.primaryText,
    marginHorizontal: theme.rem(0.25),
    marginBottom: theme.rem(0.25),
    fontSize: theme.rem(0.75),
    fontFamily: theme.fontFaceBold
  })
)

const MessageText = styled(EdgeText)<{ type: 'warning' | 'info' }>(
  theme => props => ({
    color: props.type === 'warning' ? theme.warningIcon : theme.secondaryText,
    marginHorizontal: theme.rem(0.25),
    fontSize: theme.rem(0.75)
  })
)

const TextView = styled(View)(theme => ({
  flexShrink: 1,
  width: '100%'
}))
