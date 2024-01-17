import * as React from 'react'
import { BackHandler, Dimensions, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { BlurView } from 'rn-id-blurview'

import { useHandler } from '../../hooks/useHandler'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { maybeComponent } from '../hoc/maybeComponent'
import { Theme, useTheme } from '../services/ThemeContext'

const BACKGROUND_ALPHA = 0.7
export interface ModalPropsUi4<T = unknown> {
  bridge: AirshipBridge<T>
  children?: React.ReactNode

  // Internal padding to place inside the component.
  paddingRem?: number[] | number

  // Include a scroll area:
  scroll?: boolean

  // Gives the box a border:
  warning?: boolean

  // Called when the user taps outside the modal or clicks the back button.
  // If this is missing, the modal will not be closable.
  onCancel?: () => void
}

const safeAreaGap = 64 // Overkill to avoid bottom of screen
const duration = 300

/**
 * A modal that slides a modal up from the bottom of the screen
 * and dims the rest of the app.
 */
export function ModalUi4<T>(props: ModalPropsUi4<T>): JSX.Element {
  const { bridge, children, paddingRem, scroll = false, warning = false, onCancel } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Use margin instead of padding to give children the ability to bypass the
  // default "padding," if necessary
  const childrenMargin = sidesToMargin(mapSides(fixSides(paddingRem, 0.5), theme.rem))
  const closeThreshold = theme.rem(6)
  const dragSlop = theme.rem(1)

  //
  // Shared state
  //

  const opacity = useSharedValue(0)
  const offset = useSharedValue(Dimensions.get('window').height)

  const handleCancel = useHandler(() => {
    if (onCancel != null) onCancel()
  })

  //
  // Effects
  //

  React.useEffect(() => bridge.on('clear', handleCancel), [bridge, handleCancel])

  React.useEffect(() => {
    // Animate in:
    opacity.value = withTiming(BACKGROUND_ALPHA, { duration })
    offset.value = withTiming(0, { duration })

    // Animate out:
    bridge.on('result', () => {
      opacity.value = withTiming(0, { duration })
      offset.value = withTiming(Dimensions.get('window').height, { duration }, () => runOnJS(bridge.remove)())
    })
  }, [bridge, opacity, offset])

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel()
      return true
    })
    return () => backHandler.remove()
  }, [handleCancel])

  const gesture = Gesture.Pan()
    .onUpdate(e => {
      offset.value = e.translationY
    })
    .onEnd(() => {
      if (offset.value > closeThreshold) {
        runOnJS(handleCancel)()
      }
      offset.value = withTiming(0, { duration })
    })

  //
  // Dynamic styles
  //

  const underlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value
  }))

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(-dragSlop, offset.value) }]
  }))

  const bodyLayout = {
    borderColor: warning ? theme.warningText : theme.modalBorderColor,
    borderWidth: warning ? 4 : theme.modalBorderWidth,
    marginBottom: -safeAreaGap - dragSlop,
    paddingBottom: safeAreaGap + dragSlop
  }

  return (
    <>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View style={[styles.underlay, underlayStyle]} />
      </TouchableWithoutFeedback>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.body, bodyStyle, bodyLayout]}>
          {/* Need another Biew here because BlurView doesn't accept rounded corners in its styling */}
          <View style={styles.blurContainer}>
            <BlurView blurType={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} overlayColor={theme.modalAndroidBlurColor} />
          </View>

          <View style={styles.dragBarContainer}>
            <View style={styles.dragBar} />
          </View>
          {scroll ? (
            <MaybeScrollView when={scroll} style={childrenMargin}>
              {children}
            </MaybeScrollView>
          ) : (
            <View style={childrenMargin}>{children}</View>
          )}

          {onCancel == null ? null : (
            <TouchableOpacity style={styles.closeIcon} onPress={onCancel}>
              <AntDesignIcon name="close" color={theme.deactivatedText} size={theme.rem(1)} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </GestureDetector>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  underlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: theme.modalSceneOverlayColor
  },
  body: {
    alignSelf: 'flex-end',
    backgroundColor: theme.modalBackgroundUi4,
    borderTopLeftRadius: theme.rem(1),
    borderTopRightRadius: theme.rem(1),
    flexShrink: 1,
    width: theme.rem(30) // This works as a maxWidth because flexShrink is set
  },

  blurContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderTopLeftRadius: theme.rem(1),
    borderTopRightRadius: theme.rem(1),
    overflow: 'hidden'
  },
  dragBarContainer: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  dragBar: {
    backgroundColor: theme.modalDragbarColor,
    borderRadius: theme.rem(0.125),
    height: theme.rem(0.25),
    marginTop: theme.rem(0.5),
    width: theme.rem(3)
  },
  closeIcon: {
    alignItems: 'center',
    height: theme.rem(2),
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: theme.rem(2)
  }
}))

const MaybeScrollView = maybeComponent(ScrollView)
