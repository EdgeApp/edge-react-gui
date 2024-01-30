import { getDefaultHeaderHeight } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import Reanimated from 'react-native-reanimated'
import { EdgeInsets, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useSceneFooterRenderState, useSceneFooterState } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { OverrideDots } from '../../types/Theme'
import { styled } from '../hoc/styled'
import { NotificationView } from '../notification/NotificationView'
import { useTheme } from '../services/ThemeContext'
import { MAX_TAB_BAR_HEIGHT } from '../themed/MenuTabs'
import { AccentColors, DotsBackground } from '../ui4/DotsBackground'
import { KeyboardTracker } from './KeyboardTracker'

export interface InsetStyle {
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
}

export interface UndoInsetStyle {
  flex: 1
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
}

export interface SceneWrapperInfo {
  // Contains the top, left, right, and bottom app insets (includes header, tab-bar, footer, etc)
  insets: EdgeInsets
  // Convenient padding styles for the insets to be used by scenes (e.g. contentContainerStyles)
  insetStyle: InsetStyle
  // Convenient style with negative margins for each value in the insets.
  // This can be useful to apply to containing views in a scene to expand the scene's
  // edges to the device's edges.
  undoInsetStyle: UndoInsetStyle
  hasTabs: boolean
  isKeyboardOpen: boolean
}

interface SceneWrapperProps {
  // The children can either be normal React elements,
  // or a function that accepts info about the scene outer state and returns an element.
  // The function will be called on each render, allowing the scene to react
  // to changes to the info.
  children: React.ReactNode | ((info: SceneWrapperInfo) => React.ReactNode)

  // Object specifying accent colors to use for DotsBackground
  accentColors?: AccentColors

  // True if this scene should shrink to avoid the keyboard:
  avoidKeyboard?: boolean

  // Optional backgroundGradient overrides
  backgroundGradientColors?: string[]
  backgroundGradientStart?: { x: number; y: number }
  backgroundGradientEnd?: { x: number; y: number }

  // True if this scene has a header (with back button & such):
  hasHeader?: boolean

  // This enables notifications in the scene
  hasNotifications?: boolean

  // True if this scene has a bottom tab bar:
  hasTabs?: boolean

  // Settings for when using ScrollView
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled'

  // Override existing background dots parameters
  overrideDots?: OverrideDots

  // Padding to add inside the scene border:
  padding?: number

  // True to make the scene scrolling (if avoidKeyboard is false):
  scroll?: boolean
}

/**
 * Wraps a scene, creating a perfectly-sized box that avoids app-wide UI
 * elements such as the header, tab bar, notifications (if any), footer, and
 * even keyboard. Also draws a common background component under the scene
 * (defined by the theme). The wrapper will apply padding needed to avoid
 * the safe area inset and header/tab-bar/etc. This is known as the `insets`.
 *
 * If the component is passed a function as a children, it will pass the `inset`
 * as part of an `info` parameter to the function. In addition, the scene wrapper
 * padding will be passed as `insetStyle` and `undoInsetStyle` will include
 * negative margin style rules to be used to offset these insets.
 */
function SceneWrapperComponent(props: SceneWrapperProps): JSX.Element {
  const { avoidKeyboard = false } = props

  // Subscribe to the window size:
  const { height: frameHeight } = useSafeAreaFrame()

  // These represent the distance from the top of the screen to the top of
  // the keyboard depending if the keyboard is down or up.
  const downValue = frameHeight
  const upValue = useCallback((keyboardHeight: number) => downValue - keyboardHeight, [downValue])

  return avoidKeyboard ? (
    <KeyboardTracker downValue={downValue} upValue={upValue}>
      {(keyboardAnimation, trackerValue) => (
        <SceneWrapperInner
          /* Animation between downValue and upValue */
          keyboardAnimation={keyboardAnimation}
          /* downValue or upValue depending on if the keyboard state */
          trackerValue={trackerValue}
          {...props}
        />
      )}
    </KeyboardTracker>
  ) : (
    <SceneWrapperInner
      /* Animation between downValue and upValue */
      keyboardAnimation={undefined}
      /* downValue or upValue depending on if the keyboard state */
      trackerValue={0}
      {...props}
    />
  )
}
export const SceneWrapper = React.memo(SceneWrapperComponent)

const styles = StyleSheet.create({
  sceneContainer: {
    // Children:
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  }
})

interface SceneWrapperInnerProps extends SceneWrapperProps {
  keyboardAnimation: Animated.Value | undefined
  trackerValue: number
}

function SceneWrapperInnerComponent(props: SceneWrapperInnerProps) {
  const { keyboardAnimation, trackerValue } = props
  const {
    overrideDots,
    accentColors,
    avoidKeyboard = false,
    backgroundGradientColors,
    backgroundGradientStart,
    backgroundGradientEnd,
    children,
    hasHeader = true,
    hasNotifications = false,
    hasTabs = false,
    padding = 0,
    scroll = false
  } = props

  const accountId = useSelector(state => state.core.account.id)
  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = accountId != null && activeUsername == null

  const footerHeight = useSceneFooterState(state => state.footerHeight ?? 0)

  const navigation = useNavigation<NavigationBase>()
  const theme = useTheme()

  // Subscribe to the window size:
  const { height: frameHeight, width: frameWidth } = useSafeAreaFrame()
  const safeAreaInsets = useSafeAreaInsets()

  // Get the screen width/height measurements for the scene
  const layoutStyle = useMemo(
    () => ({
      height: frameHeight,
      width: frameWidth
    }),
    [frameHeight, frameWidth]
  )

  const notificationHeight = theme.rem(4)
  const headerBarHeight = getDefaultHeaderHeight({ height: frameHeight, width: frameWidth }, false, 0)

  // Derive the keyboard height by getting the difference between screen height
  // and trackerValue. This value should be from zero to keyboard height
  // depending on the open state of the keyboard
  const keyboardHeight = frameHeight - trackerValue
  const isKeyboardOpen = avoidKeyboard && keyboardHeight !== 0

  // Calculate app insets considering the app's header, tab-bar,
  // notification area, etc:
  const maybeHeaderHeight = hasHeader ? headerBarHeight : 0
  const maybeNotificationHeight = isLightAccount ? notificationHeight : 0
  const maybeTabBarHeight = hasTabs ? MAX_TAB_BAR_HEIGHT : 0
  const maybeInsetBottom = !hasTabs && !isKeyboardOpen ? safeAreaInsets.bottom : 0
  const insets: EdgeInsets = useMemo(
    () => ({
      top: safeAreaInsets.top + maybeHeaderHeight,
      right: safeAreaInsets.right,
      bottom: maybeInsetBottom + maybeNotificationHeight + maybeTabBarHeight + footerHeight,
      left: safeAreaInsets.left
    }),
    [
      footerHeight,
      maybeHeaderHeight,
      maybeInsetBottom,
      maybeNotificationHeight,
      maybeTabBarHeight,
      safeAreaInsets.left,
      safeAreaInsets.right,
      safeAreaInsets.top
    ]
  )

  // This is a convenient styles object which may be applied as
  // contentContainerStyles for child scroll components. It will also be
  // used for the ScrollView component internal to the SceneWrapper.
  const insetStyle: InsetStyle = useMemo(
    () => ({
      paddingTop: insets.top,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left
    }),
    [insets.top, insets.right, insets.bottom, insets.left]
  )

  // This is a convenient styles object which may be applied to scene container
  // components to offset the inset styles applied to the SceneWrapper.
  const undoInsetStyle: UndoInsetStyle = useMemo(
    () => ({
      flex: 1,
      marginTop: -insets.top,
      marginRight: -insets.right,
      marginBottom: -insets.bottom,
      marginLeft: -insets.left
    }),
    [insets.top, insets.right, insets.bottom, insets.left]
  )

  const info: SceneWrapperInfo = useMemo(
    () => ({ insets, insetStyle, undoInsetStyle, hasTabs, isKeyboardOpen }),
    [hasTabs, insetStyle, insets, isKeyboardOpen, undoInsetStyle]
  )

  // If function children, the caller handles the insets and overscroll
  const memoizedChildren = useMemo(() => (typeof children === 'function' ? children(info) : children), [children, info])

  if (avoidKeyboard) {
    return (
      <>
        <Animated.View style={[styles.sceneContainer, layoutStyle, insetStyle, { maxHeight: keyboardAnimation, padding }]}>
          <DotsBackground
            accentColors={accentColors}
            overrideDots={overrideDots}
            backgroundGradientColors={backgroundGradientColors}
            backgroundGradientStart={backgroundGradientStart}
            backgroundGradientEnd={backgroundGradientEnd}
          />

          {memoizedChildren}
          <SceneWrapperFooterContainer hasTabs={hasTabs} sceneWrapperInfo={info} />
        </Animated.View>
        {hasNotifications ? <NotificationView hasTabs={hasTabs} navigation={navigation} /> : null}
      </>
    )
  }

  if (scroll) {
    return (
      <SceneWrapperScrollView insetStyle={insetStyle} layoutStyle={layoutStyle} navigation={navigation} sceneWrapperInfo={info} {...props}>
        {memoizedChildren}
      </SceneWrapperScrollView>
    )
  }

  return (
    <>
      <View style={[styles.sceneContainer, layoutStyle, insetStyle, { padding }]}>{memoizedChildren}</View>
      <SceneWrapperFooterContainer hasTabs={hasTabs} sceneWrapperInfo={info} />
      {hasNotifications ? <NotificationView hasTabs={hasTabs} navigation={navigation} /> : null}
    </>
  )
}
const SceneWrapperInner = React.memo(SceneWrapperInnerComponent)

interface SceneWrapperScrollViewProps extends Pick<SceneWrapperProps, 'hasNotifications' | 'hasTabs' | 'keyboardShouldPersistTaps' | 'padding'> {
  children: React.ReactNode
  insetStyle: InsetStyle
  layoutStyle: {
    height: number
    width: number
  }
  navigation: NavigationBase
  sceneWrapperInfo: SceneWrapperInfo
}

function SceneWrapperScrollViewComponent(props: SceneWrapperScrollViewProps) {
  const { children, insetStyle, layoutStyle, navigation, sceneWrapperInfo } = props
  const { hasNotifications = false, hasTabs = false, keyboardShouldPersistTaps, padding = 0 } = props

  // If the scene has scroll, this will be required for tabs and/or header animation
  const handleScroll = useSceneScrollHandler()

  return (
    <>
      <Reanimated.ScrollView
        style={[layoutStyle, { padding }]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        contentContainerStyle={insetStyle}
        onScroll={handleScroll}
        // Fixes middle-floating scrollbar issue
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        {children}
      </Reanimated.ScrollView>
      <SceneWrapperFooterContainer hasTabs={hasTabs} sceneWrapperInfo={sceneWrapperInfo} />
      {hasNotifications ? <NotificationView hasTabs={hasTabs} navigation={navigation} /> : null}
    </>
  )
}
const SceneWrapperScrollView = React.memo(SceneWrapperScrollViewComponent)

interface SceneWrapperFooterContainerProps {
  hasTabs: boolean
  sceneWrapperInfo: SceneWrapperInfo
}

function SceneWrapperFooterContainerComponent(props: SceneWrapperFooterContainerProps) {
  const { hasTabs, sceneWrapperInfo } = props

  const renderFooter = useSceneFooterRenderState(state => state.renderFooter)

  return renderFooter != null && !hasTabs ? <SceneFooter>{renderFooter(sceneWrapperInfo)}</SceneFooter> : null
}
const SceneWrapperFooterContainer = React.memo(SceneWrapperFooterContainerComponent)

const SceneFooter = styled(View)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0
})
