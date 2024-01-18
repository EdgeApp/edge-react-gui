import * as React from 'react'
import { BackHandler, Dimensions, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler'
import { cacheStyles } from 'react-native-patina'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { fixSides, mapSides, sidesToPadding } from '../../util/sides'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { BlurBackground } from './BlurBackground'

const BACKGROUND_ALPHA = 0.7
export interface ModalPropsUi4<T = unknown> {
  bridge: AirshipBridge<T>

  // If a non-string title is provided, it's up to the caller to ensure no close
  // button overlap.
  title?: React.ReactNode

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
  const { bridge, title, children, paddingRem, scroll = false, warning = false, onCancel } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const customPadding = sidesToPadding(mapSides(fixSides(paddingRem, 0.5), theme.rem))
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
    paddingTop: isHeaderless ? customPadding.paddingTop : 0, // If there's a header; either close button or a title, the custom paddingTop will be added to the bottom of the title container.
    paddingBottom: bottomGap + (scroll ? 0 : customPadding.paddingBottom), // Ignore custom padding on bottom for scrollable content so we don't have a cutoff gap when scrolling content

    // No matter if we are scrollling or not, horizontal paddings are fixed
    paddingLeft: customPadding.paddingLeft,
    paddingRight: customPadding.paddingRight
  }

  return (
    <>
      <TouchableWithoutFeedback onPress={handleCancel}>
        <Animated.View style={[styles.underlay, underlayStyle]} />
      </TouchableWithoutFeedback>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.modal, modalStyle, modalLayout]}>
          <BlurBackground />

          <View style={styles.dragBarContainer}>
            <View style={styles.dragBar} />
          </View>

          {isHeaderless ? null : (
            <View style={[styles.titleContainer, { marginBottom: customPadding.paddingTop }]}>
              {typeof title === 'string' ? (
                <EdgeText style={styles.titleText} numberOfLines={2}>
                  {title}
                </EdgeText>
              ) : (
                title ?? undefined
              )}
              {onCancel == null ? null : (
                <TouchableOpacity style={isCustomTitle ? styles.closeIconContainerAbsolute : styles.closeIconContainer} onPress={onCancel}>
                  <AntDesignIcon name="close" color={theme.deactivatedText} size={theme.rem(1.25)} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {scroll ? <ScrollView style={styles.scroll}>{children}</ScrollView> : children}
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
    backgroundColor: theme.modalBackgroundUi4,
    borderTopLeftRadius: theme.rem(1),
    borderTopRightRadius: theme.rem(1),
    flexShrink: 1,
    overflow: 'hidden',
    width: theme.rem(30) // This works as a maxWidth because flexShrink is set
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
    marginTop: theme.rem(0.5),
    width: theme.rem(3)
  },
  closeIconContainer: {
    // Used when this component is managing the title
    flexGrow: 1, // Push the title to the left
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: theme.rem(0.15), // Bake in margins to align with 1 line of text, no matter the number of lines
    marginRight: theme.rem(0.5)
  },
  closeIconContainerAbsolute: {
    // Used when the caller passes a special title that may span the entire
    // width. It's up to the caller to ensure there's no overlap with the close button.
    position: 'absolute',
    top: theme.rem(0.15), // Bake in margins to align with 1 line of text, which is often supplied in custom headers.
    right: theme.rem(0.5)
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: theme.rem(1.25) // Ensure the top drag bar is not overlapped
  },
  titleText: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.2),
    marginHorizontal: theme.rem(0.5)
  }
}))
