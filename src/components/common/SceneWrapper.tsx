import { getDefaultHeaderHeight } from '@react-navigation/elements'
import * as React from 'react'
import { Animated, ScrollView, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { EdgeInsets, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'

import { THEME } from '../../theme/variables/airbitz'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { NotificationView } from '../notification/NotificationView'
import { useTheme } from '../services/ThemeContext'
import { KeyboardTracker } from './KeyboardTracker'

type BackgroundOptions =
  | 'theme' // Whatever the current theme specifies (default)
  | 'legacy' // Seprate dark header and white content areas
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

  // Extra header area to insert above the body background:
  bodySplit?: number

  // True if this scene has a header (with back button & such):
  hasHeader?: boolean

  // True if this scene has a bottom tab bar:
  hasTabs?: boolean

  // Padding to add inside the scene border:
  padding?: number

  // True to make the scene scrolling (if avoidKeyboard is false):
  scroll?: boolean
}

interface NotificationSceneWrapperProps extends SceneWrapperProps {
  navigation: NavigationBase
}

/**
 * A SceneWrapper with a possible notification view at the bottom.
 */
export const NotificationSceneWrapper = (props: NotificationSceneWrapperProps): JSX.Element => {
  const {
    avoidKeyboard = false,
    background = 'theme',
    bodySplit = 0,
    children,
    hasHeader = true,
    hasTabs = false,
    keyboardShouldPersistTaps,
    navigation,
    padding = 0,
    scroll = false
  } = props

  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = activeUsername == null

  const theme = useTheme()
  const notificationHeight = isLightAccount ? theme.rem(4) : 0

  // Subscribe to the window size:
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

  const renderScene = (gap: EdgeInsets, keyboardAnimation: Animated.Value | null, keyboardHeight: number): JSX.Element => {
    // Render the scene container:
    // If function children, the caller handles the insets and overscroll
    const isFuncChildren = typeof children === 'function'

    const finalChildren = isFuncChildren ? children({ ...gap, bottom: keyboardHeight }, notificationHeight) : children
    const scene =
      keyboardAnimation != null ? (
        <Animated.View style={[styles.scene, { ...gap, maxHeight: keyboardAnimation, padding }]}>{finalChildren}</Animated.View>
      ) : scroll ? (
        <ScrollView
          style={{ position: 'absolute', ...gap }}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          contentContainerStyle={{ paddingBottom: notificationHeight }}
        >
          {finalChildren}
        </ScrollView>
      ) : (
        <View style={[styles.scene, { ...gap, padding, paddingBottom: isFuncChildren ? undefined : notificationHeight }]}>{finalChildren}</View>
      )

    // Render the notifications:
    const notifications = isLightAccount ? <NotificationView navigation={navigation} /> : null

    // Render the background, if any:
    if (background === 'none')
      return (
        <>
          {scene}
          {notifications}
        </>
      )
    return (
      <LinearGradient colors={theme.backgroundGradientColors} end={theme.backgroundGradientEnd} start={theme.backgroundGradientStart} style={styles.gradient}>
        {background !== 'legacy' ? null : <View style={[styles.legacyBackground, { top: gap.top + bodySplit }]} />}
        {scene}
        {notifications}
      </LinearGradient>
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
    renderScene(gap, null, 0)
  )
}

/**
 * Wraps a normal stacked scene, creating a perfectly-sized box
 * that avoids the header, tab bar, and notifications (if any).
 *
 * Also draws a common gradient background under the scene.
 *
 * TODO: Eventually deprecate this as scenes integrate the
 * NotificationSceneWrapper instead
 */
export function SceneWrapper(props: SceneWrapperProps): JSX.Element {
  const {
    avoidKeyboard = false,
    background = 'theme',
    bodySplit = 0,
    children,
    hasHeader = true,
    hasTabs = false,
    keyboardShouldPersistTaps,
    padding = 0,
    scroll = false
  } = props
  const theme = useTheme()

  // Subscribe to the window size:
  const frame = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

  const renderScene = (gap: EdgeInsets, keyboardAnimation: Animated.Value | null, keyboardHeight: number): JSX.Element => {
    // Render the scene container:
    const finalChildren = typeof children === 'function' ? children({ ...gap, bottom: keyboardHeight }, 0) : children
    const scene =
      keyboardAnimation != null ? (
        <Animated.View style={[styles.scene, { ...gap, maxHeight: keyboardAnimation, padding }]}>{finalChildren}</Animated.View>
      ) : scroll ? (
        <ScrollView style={{ position: 'absolute', ...gap }} keyboardShouldPersistTaps={keyboardShouldPersistTaps} contentContainerStyle={{ padding }}>
          {finalChildren}
        </ScrollView>
      ) : (
        <View style={[styles.scene, { ...gap, padding }]}>{finalChildren}</View>
      )

    // Render the background, if any:
    if (background === 'none') return scene
    return (
      <LinearGradient colors={theme.backgroundGradientColors} end={theme.backgroundGradientEnd} start={theme.backgroundGradientStart} style={styles.gradient}>
        {background !== 'legacy' ? null : <View style={[styles.legacyBackground, { top: gap.top + bodySplit }]} />}
        {scene}
      </LinearGradient>
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
    renderScene(gap, null, 0)
  )
}

const styles = StyleSheet.create({
  legacyBackground: {
    // Layout:
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    // Visuals:
    backgroundColor: THEME.COLORS.GRAY_4
  },

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
