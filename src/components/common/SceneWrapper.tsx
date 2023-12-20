import { getDefaultHeaderHeight } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Animated, ScrollView, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { EdgeInsets, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { maybeComponent } from '../hoc/maybeComponent'
import { NotificationView } from '../notification/NotificationView'
import { useTheme } from '../services/ThemeContext'
import { KeyboardTracker } from './KeyboardTracker'

type BackgroundOptions =
  | 'theme' // Whatever the current theme specifies (default)
  | 'none' // Do not render any background elements

interface SceneWrapperProps {
  // The children can either be normal React elements,
  // or a function that accepts the current gap and returns an element.
  // The function will be called on each render, allowing the scene to react
  // to changes in the gap.
  children: React.ReactNode | ((gap: EdgeInsets, notificationHeight: number) => React.ReactNode)

  // Settings for when using ScrollView
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'

  // True if this scene should shrink to avoid the keyboard:
  avoidKeyboard?: boolean

  // Background options:
  background?: BackgroundOptions

  // True if this scene has a header (with back button & such):
  hasHeader?: boolean

  // This enables notifications in the scene
  hasNotifications?: boolean

  // True if this scene has a bottom tab bar:
  hasTabs?: boolean

  // Padding to add inside the scene border:
  padding?: number

  // True to make the scene scrolling (if avoidKeyboard is false):
  scroll?: boolean
}

/**
 * Wraps a normal stacked scene, creating a perfectly-sized box
 * that avoids the header, tab bar, and notifications (if any).
 *
 * Also draws a common gradient background under the scene.
 */
export function SceneWrapper(props: SceneWrapperProps): JSX.Element {
  const {
    avoidKeyboard = false,
    background = 'theme',
    children,
    hasHeader = true,
    hasNotifications = false,
    hasTabs = false,
    keyboardShouldPersistTaps,
    padding = 0,
    scroll = false
  } = props

  const accountId = useSelector(state => state.core.account.id)
  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = accountId != null && activeUsername == null

  const navigation = useNavigation<NavigationBase>()
  const theme = useTheme()
  const notificationHeight = isLightAccount ? theme.rem(4) : 0

  // Subscribe to the window size:
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

  const renderScene = (gap: EdgeInsets, keyboardAnimation: Animated.Value | undefined, keyboardHeight: number): JSX.Element => {
    // If function children, the caller handles the insets and overscroll
    const hasKeyboardAnimation = keyboardAnimation != null
    const isFuncChildren = typeof children === 'function'

    return (
      <MaybeLinearGradient
        when={background === 'theme'}
        colors={theme.backgroundGradientColors}
        end={theme.backgroundGradientEnd}
        start={theme.backgroundGradientStart}
        style={styles.gradient}
      >
        <MaybeAnimatedView when={hasKeyboardAnimation} style={[styles.scene, { ...gap, maxHeight: keyboardAnimation, padding }]}>
          <MaybeScrollView
            when={scroll && !hasKeyboardAnimation}
            style={{ position: 'absolute', padding, ...gap }}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            contentContainerStyle={{ paddingBottom: notificationHeight }}
          >
            <MaybeView
              when={!scroll && !hasKeyboardAnimation}
              style={[styles.scene, { ...gap, padding, paddingBottom: isFuncChildren ? undefined : notificationHeight }]}
            >
              {isFuncChildren ? children({ ...gap, bottom: keyboardHeight }, notificationHeight) : children}
              {hasNotifications ? <NotificationView navigation={navigation} /> : null}
            </MaybeView>
          </MaybeScrollView>
        </MaybeAnimatedView>
      </MaybeLinearGradient>
    )
  }

  const gap: EdgeInsets = {
    ...insets,
    bottom: hasTabs ? 0 : insets.bottom,
    top: insets.top + (hasHeader ? getDefaultHeaderHeight(frame, false, 0) : 0)
  }
  const downValue = frame.height - gap.top
  const upValue = (keyboardHeight: number) => downValue - keyboardHeight

  return avoidKeyboard ? (
    <KeyboardTracker downValue={downValue} upValue={upValue}>
      {(keyboardAnimation, keyboardLayout) => renderScene(gap, keyboardAnimation, downValue - keyboardLayout)}
    </KeyboardTracker>
  ) : (
    renderScene(gap, undefined, 0)
  )
}

const styles = StyleSheet.create({
  gradient: {
    // Layout:
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0
  },

  scene: {
    // Layout:
    position: 'absolute',

    // Children:
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  }
})

const MaybeAnimatedView = maybeComponent(Animated.View)
const MaybeLinearGradient = maybeComponent(LinearGradient)
const MaybeScrollView = maybeComponent(ScrollView)
const MaybeView = maybeComponent(View)
