import { getDefaultHeaderHeight } from '@react-navigation/elements'
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { useKeyboardHandler, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Reanimated, { runOnJS, useAnimatedStyle } from 'react-native-reanimated'
import { EdgeInsets, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { FooterRender, PortalSceneFooter, useSceneFooterState } from '../../state/SceneFooterState'
import { useSceneScrollHandler } from '../../state/SceneScrollState'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { OverrideDots } from '../../types/Theme'
import { styled } from '../hoc/styled'
import { NotificationView } from '../notification/NotificationView'
import { useTheme } from '../services/ThemeContext'
import { MAX_TAB_BAR_HEIGHT } from '../themed/MenuTabs'
import { AccentColors, DotsBackground } from '../ui4/DotsBackground'

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

  // The necessary height of the footer to include in the insets
  footerHeight?: number

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

  // Renderer for the footer to be rendered in the SceneWrapper or MenuTabs.
  // It should be memoized with useCallback to avoid unnecessary re-renders.
  renderFooter?: FooterRender

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
  const {
    overrideDots,
    accentColors,
    avoidKeyboard = props.scroll ?? false,
    backgroundGradientColors,
    backgroundGradientStart,
    backgroundGradientEnd,
    children,
    footerHeight = 0,
    hasHeader = true,
    hasNotifications = false,
    hasTabs = false,
    padding = 0,
    renderFooter,
    scroll = false
  } = props

  const accountId = useSelector(state => state.core.account.id)
  const activeUsername = useSelector(state => state.core.account.username)
  const isLightAccount = accountId != null && activeUsername == null

  const navigation = useNavigation<NavigationBase>()
  const theme = useTheme()

  // We need to track this state in the JS thread because insets are not shared values
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  useKeyboardHandler({
    onStart(event) {
      'worklet'
      runOnJS(setIsKeyboardOpen)(event.progress === 1)
    }
  })

  // Reset the footer ratio when focused
  // We can do this because multiple calls to resetFooterRatio isn't costly
  // because it just sets snapTo SharedValue to `1`
  const resetFooterRatio = useSceneFooterState(state => state.resetFooterRatio)
  useFocusEffect(() => {
    resetFooterRatio()
  })

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

  // Calculate app insets considering the app's header, tab-bar,
  // notification area, etc:
  const maybeHeaderHeight = hasHeader ? headerBarHeight : 0
  const maybeNotificationHeight = isLightAccount ? notificationHeight : 0
  // Ignore tab bar height when keyboard is open because it is rendered behind it
  const maybeTabBarHeight = hasTabs && !isKeyboardOpen ? MAX_TAB_BAR_HEIGHT : 0
  // Ignore inset bottom when keyboard is open because it is rendered behind it
  const maybeInsetBottom = !isKeyboardOpen ? safeAreaInsets.bottom : 0
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

  const sceneWrapperInfo: SceneWrapperInfo = useMemo(
    () => ({ insets, insetStyle, undoInsetStyle, hasTabs, isKeyboardOpen }),
    [hasTabs, insetStyle, insets, isKeyboardOpen, undoInsetStyle]
  )

  // Animated style for max-height to respond to keyboard
  const { height: keyboardHeightDiff } = useReanimatedKeyboardAnimation()
  const keyboardAwareStyle = useAnimatedStyle(() => {
    const maybeKeyboardHeightDiff = avoidKeyboard ? keyboardHeightDiff.value : 0
    return {
      maxHeight: frameHeight + maybeKeyboardHeightDiff
    }
  }, [avoidKeyboard, frameHeight])

  // If function children, the caller handles the insets and overscroll
  const memoizedChildren = useMemo(() => (typeof children === 'function' ? children(sceneWrapperInfo) : children), [children, sceneWrapperInfo])

  if (scroll) {
    return (
      <>
        <DotsBackground
          accentColors={accentColors}
          overrideDots={overrideDots}
          backgroundGradientColors={backgroundGradientColors}
          backgroundGradientStart={backgroundGradientStart}
          backgroundGradientEnd={backgroundGradientEnd}
        />
        <SceneWrapperScrollView keyboardAwareStyle={keyboardAwareStyle} insetStyle={insetStyle} layoutStyle={layoutStyle} {...props}>
          {memoizedChildren}
        </SceneWrapperScrollView>
        {renderFooter == null ? null : (
          <SceneWrapperFooterContainer footerHeight={footerHeight} hasTabs={hasTabs} renderFooter={renderFooter} sceneWrapperInfo={sceneWrapperInfo} />
        )}
        {hasNotifications ? <NotificationView hasTabs={hasTabs} footerHeight={footerHeight} navigation={navigation} /> : null}
      </>
    )
  }

  if (avoidKeyboard) {
    return (
      <>
        <Reanimated.View style={[styles.sceneContainer, layoutStyle, insetStyle, keyboardAwareStyle, { padding }]}>
          <DotsBackground
            accentColors={accentColors}
            overrideDots={overrideDots}
            backgroundGradientColors={backgroundGradientColors}
            backgroundGradientStart={backgroundGradientStart}
            backgroundGradientEnd={backgroundGradientEnd}
          />

          {memoizedChildren}
          {renderFooter == null ? null : (
            <SceneWrapperFooterContainer footerHeight={footerHeight} hasTabs={hasTabs} renderFooter={renderFooter} sceneWrapperInfo={sceneWrapperInfo} />
          )}
        </Reanimated.View>
        {hasNotifications ? <NotificationView hasTabs={hasTabs} footerHeight={footerHeight} navigation={navigation} /> : null}
      </>
    )
  }

  return (
    <>
      <View style={[styles.sceneContainer, layoutStyle, insetStyle, { padding }]}>
        <DotsBackground
          accentColors={accentColors}
          overrideDots={overrideDots}
          backgroundGradientColors={backgroundGradientColors}
          backgroundGradientStart={backgroundGradientStart}
          backgroundGradientEnd={backgroundGradientEnd}
        />

        {memoizedChildren}
      </View>
      {renderFooter == null ? null : (
        <SceneWrapperFooterContainer footerHeight={footerHeight} hasTabs={hasTabs} renderFooter={renderFooter} sceneWrapperInfo={sceneWrapperInfo} />
      )}
      {hasNotifications ? <NotificationView hasTabs={hasTabs} footerHeight={footerHeight} navigation={navigation} /> : null}
    </>
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

interface SceneWrapperScrollViewProps extends Pick<SceneWrapperProps, 'keyboardShouldPersistTaps' | 'padding'> {
  children: React.ReactNode
  keyboardAwareStyle: ViewStyle
  insetStyle: InsetStyle
  layoutStyle: {
    height: number
    width: number
  }
}

function SceneWrapperScrollViewComponent(props: SceneWrapperScrollViewProps) {
  const { children, keyboardAwareStyle, insetStyle, layoutStyle } = props
  const { keyboardShouldPersistTaps, padding = 0 } = props

  // If the scene has scroll, this will be required for tabs and/or header animation
  const handleScroll = useSceneScrollHandler()

  return (
    <Reanimated.ScrollView
      style={[layoutStyle, keyboardAwareStyle, { padding }]}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      contentContainerStyle={insetStyle}
      onScroll={handleScroll}
      // Fixes middle-floating scrollbar issue
      scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
    >
      {children}
    </Reanimated.ScrollView>
  )
}
const SceneWrapperScrollView = React.memo(SceneWrapperScrollViewComponent)

interface SceneWrapperFooterContainerProps extends Required<Pick<SceneWrapperProps, 'footerHeight' | 'hasTabs' | 'renderFooter'>> {
  sceneWrapperInfo: SceneWrapperInfo
}

function SceneWrapperFooterContainerComponent(props: SceneWrapperFooterContainerProps) {
  const { footerHeight, hasTabs, sceneWrapperInfo, renderFooter } = props

  // Set the global shared value for the footerHeight so that way the
  // background in the MenuTabs can translate accordingly
  const footerHeightShared = useSceneFooterState(state => state.footerHeight)
  const isFocused = useIsFocused()
  useEffect(() => {
    if (isFocused) {
      footerHeightShared.value = footerHeight
      return () => {
        footerHeightShared.value = 0
      }
    }
  }, [footerHeight, footerHeightShared, isFocused])

  // Portal the render function to the SceneFooterState
  if (hasTabs) {
    return <PortalSceneFooter>{renderFooter}</PortalSceneFooter>
  }

  return <SceneFooter>{renderFooter(sceneWrapperInfo)}</SceneFooter>
}
const SceneWrapperFooterContainer = React.memo(SceneWrapperFooterContainerComponent)

const SceneFooter = styled(View)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0
})
