import * as React from 'react'
import { BackHandler, Dimensions, Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import DeviceInfo from 'react-native-device-info'
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { BlurBackground } from '../common/BlurBackground'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

const BACKGROUND_ALPHA = 0.7

export interface EdgeModalProps<T = unknown> {
  bridge: AirshipBridge<T>

  // If a non-string title is provided, it's up to the caller to ensure no close
  // button overlap.
  title?: React.ReactNode

  children?: React.ReactNode

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
export function EdgeModal<T>(props: EdgeModalProps<T>): JSX.Element {
  const { bridge, title, children, scroll = false, warning = false, onCancel } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const isDesktop = Platform.OS === 'windows' || Platform.OS === 'macos' || Platform.OS === 'web' || DeviceInfo.getDeviceType() === 'Desktop'
  const isShowCloseButton = isDesktop && onCancel != null
  const halfRem = theme.rem(0.5)
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

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(-dragSlop, offset.value) }]
  }))

  const bottomGap = safeAreaGap + dragSlop
  const isHeaderless = title == null && onCancel == null
  const isCustomTitle = title != null && typeof title !== 'string'

  const modalLayout = {
    borderColor: warning ? theme.warningText : theme.modalBorderColor,
    borderWidth: warning ? 4 : theme.modalBorderWidth,
    marginBottom: -bottomGap,
    paddingTop: isHeaderless ? halfRem : 0, // If there's a header; either close button or a title, the custom paddingTop will be added to the bottom of the title container.
    paddingBottom: bottomGap + (scroll ? 0 : halfRem) // Ignore padding on bottom for scrollable content so we don't have a cutoff gap when scrolling content
  }

  return (
    <>
      <EdgeTouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View style={[styles.underlay, underlayStyle]} />
      </EdgeTouchableWithoutFeedback>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.modal, modalStyle, modalLayout]}>
          <BlurBackground />

          <View style={styles.dragBarContainer}>
            <View style={styles.dragBar} />
          </View>

          {isHeaderless ? null : (
            <View style={styles.titleContainer}>
              {typeof title === 'string' ? (
                <EdgeText style={styles.titleText} numberOfLines={2}>
                  {title}
                </EdgeText>
              ) : (
                title ?? undefined
              )}
              {!isShowCloseButton ? null : (
                <EdgeTouchableOpacity style={isCustomTitle ? styles.closeIconContainerAbsolute : styles.closeIconContainer} onPress={onCancel}>
                  <AntDesignIcon name="close" color={theme.deactivatedText} size={theme.rem(1.25)} />
                </EdgeTouchableOpacity>
              )}
            </View>
          )}

          {scroll ? (
            <ScrollView style={styles.scroll} keyboardDismissMode="on-drag" scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
              {children}
            </ScrollView>
          ) : (
            children
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
  modal: {
    alignSelf: 'flex-end',
    backgroundColor: theme.modalBackground,
    borderTopLeftRadius: theme.rem(1),
    borderTopRightRadius: theme.rem(1),
    flexShrink: 1,
    overflow: 'hidden',
    width: theme.rem(30), // This works as a maxWidth because flexShrink is set
    paddingLeft: theme.rem(0.5),
    paddingRight: theme.rem(0.5)
  },
  scroll: {
    // Only take up as much space as needed to display the contents
    flexGrow: 0,
    flexShrink: 1
  },
  dragBarContainer: {
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0
  },
  dragBar: {
    backgroundColor: theme.modalDragbarColor,
    borderRadius: theme.rem(0.125),
    height: theme.rem(0.25),
    marginTop: theme.rem(0.25),
    width: theme.rem(3)
  },
  closeIconContainer: {
    // Used when this component is managing the title
    flexGrow: 1, // Push the title to the left
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    // Increase tappable area with padding, while net X with negative margin to visually appear as if X padding
    paddingTop: theme.rem(1.15), // Bake in margins to align with 1 line of text, no matter the number of lines
    paddingRight: theme.rem(1.25), // Less margins because the icon itself comes with whitespace
    paddingBottom: theme.rem(0.75),
    marginTop: -theme.rem(1),
    marginRight: -theme.rem(1),
    marginBottom: -theme.rem(0.75)
  },
  closeIconContainerAbsolute: {
    // Used when the caller passes a special title that may span the entire
    // width. It's up to the caller to ensure there's no overlap with the close button.
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: theme.rem(1), // Bake in margins to align with 1 line of text, no matter the number of lines
    paddingRight: theme.rem(1.25), // Less margins because the icon itself comes with whitespace
    paddingBottom: theme.rem(0.75),
    paddingLeft: theme.rem(1),
    marginTop: -theme.rem(1),
    marginRight: -theme.rem(1),
    marginBottom: -theme.rem(0.75)
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.rem(1.25), // Ensure the top drag bar is not overlapped
    marginBottom: theme.rem(0.5)
  },
  titleText: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.2),
    marginHorizontal: theme.rem(0.5),
    flexShrink: 1
  }
}))
