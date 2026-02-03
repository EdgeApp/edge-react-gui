import * as React from 'react'
import { ActivityIndicator, Pressable, Switch, View } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import { lstrings } from '../../locales/strings'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

const AnimatedView = Animated.View

const FADE_IN_DURATION = 200
const FADE_OUT_DURATION = 150

interface Props {
  /** Current switch value (source of truth from parent) */
  value: boolean

  /** Async callback when toggled. Component handles pending state automatically */
  onValueChange: () => Promise<void>

  /** Disable interaction */
  disabled?: boolean
}

/**
 * A switch component that handles async operations with optimistic UI updates
 * and smooth spinner crossfade animations.
 *
 * On tap:
 * - Switch immediately slides to new position (optimistic)
 * - Switch dims while spinner fades in
 *
 * On completion (success or error):
 * - Spinner fades out, switch undims
 * - On error, switch slides back to original position
 */
export const AsyncSwitch: React.FC<Props> = props => {
  const { value, onValueChange, disabled = false } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  // Optimistic local state for immediate switch response
  const [optimisticValue, setOptimisticValue] = React.useState(value)
  // Use state instead of ref so disabled prop updates trigger re-render
  const [isPending, setIsPending] = React.useState(false)

  // Animation value: 0 = idle, 1 = fully pending
  const pendingAnim = useSharedValue(0)

  // Sync with parent value when not pending
  React.useEffect(() => {
    if (!isPending) {
      setOptimisticValue(value)
    }
  }, [isPending, value])

  // Handle tap on the pressable wrapper (fires immediately on tap)
  const handlePress = React.useCallback(() => {
    if (isPending || disabled) return

    // Optimistically update the switch
    setOptimisticValue(v => !v)

    // Start pending state and animation immediately
    setIsPending(true)
    pendingAnim.value = withTiming(1, { duration: FADE_IN_DURATION })

    // Execute the async operation
    onValueChange()
      .catch(() => {
        // On error, sync back to parent value (visual rollback)
        setOptimisticValue(value)
      })
      .finally(() => {
        // Reset pending state and reverse animation
        setIsPending(false)
        pendingAnim.value = withTiming(0, { duration: FADE_OUT_DURATION })
      })
  }, [disabled, isPending, onValueChange, pendingAnim, value])

  // Switch dims while pending
  const switchStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pendingAnim.value, [0, 1], [1, 0.4])
  }))

  // Spinner fades in while pending
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: pendingAnim.value
  }))

  return (
    <Pressable
      disabled={disabled || isPending}
      onPress={handlePress}
      style={styles.container}
    >
      <AnimatedView style={switchStyle}>
        <View pointerEvents="none">
          <Switch
            disabled={disabled}
            ios_backgroundColor={theme.toggleButtonOff}
            trackColor={{
              false: theme.toggleButtonOff,
              true: theme.toggleButton
            }}
            value={optimisticValue}
            accessibilityHint={lstrings.toggle_button_hint}
            accessibilityActions={[
              { name: 'activate', label: lstrings.toggle_button_hint }
            ]}
            accessibilityValue={{
              text: optimisticValue ? lstrings.on_hint : lstrings.off_hint
            }}
          />
        </View>
      </AnimatedView>
      {/* Spinner rendered after switch so it appears on top */}
      <AnimatedView style={[styles.spinnerContainer, spinnerStyle]}>
        <ActivityIndicator
          color={theme.iconTappable}
          accessibilityHint={lstrings.spinner_hint}
        />
      </AnimatedView>
    </Pressable>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  spinnerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    // Fill the container so spinner is centered over the switch
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  }
}))
