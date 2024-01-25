import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { useMemo } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import Reanimated from 'react-native-reanimated'
import { EdgeInsets, useSafeAreaFrame } from 'react-native-safe-area-context'

import { useSceneFooterRenderState } from '../../state/SceneFooterState'
import { NavigationBase } from '../../types/routerTypes'
import { OverrideDots } from '../../types/Theme'
// import { maybeComponent } from '../hoc/maybeComponent'
// import { styled } from '../hoc/styled'
import { NotificationView } from '../notification/NotificationView'
import { AccentColors /* DotsBackground */ } from '../ui4/DotsBackground'
import { KeyboardTracker } from './KeyboardTracker'

const insets: EdgeInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}

// This is a convenient styles object which may be applied as
// contentContainerStyles for child scroll components. It will also be
// used for the ScrollView component internal to the SceneWrapper.
const insetStyle: InsetStyle = {
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0
}

// This is a convenient styles object which may be applied to scene container
// components to offset the inset styles applied to the SceneWrapper.
const undoInsetStyle: UndoInsetStyle = {
  flex: 1,
  marginTop: -0,
  marginRight: -0,
  marginBottom: -0,
  marginLeft: -0
}
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
export function SceneWrapper(props: SceneWrapperProps): JSX.Element {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    overrideDots,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accentColors,
    avoidKeyboard = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    backgroundGradientColors,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    backgroundGradientStart,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    backgroundGradientEnd,
    children,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasHeader = true,
    hasNotifications = false,
    hasTabs = false,
    keyboardShouldPersistTaps,
    padding = 0,
    scroll = false
  } = props

  const navigation = useNavigation<NavigationBase>()

  // Subscribe to the window size:
  const frame = useSafeAreaFrame()

  // Get the screen width/height measurements for the scene
  const layoutStyle = useMemo(
    () => ({
      height: frame.height,
      width: frame.width
    }),
    [frame.height, frame.width]
  )

  const { renderFooter } = useSceneFooterRenderState()

  const info: SceneWrapperInfo = useMemo(() => ({ insets, insetStyle, undoInsetStyle, hasTabs, isKeyboardOpen: true }), [hasTabs])

  const renderScene = React.useCallback(
    (keyboardAnimation: Animated.Value | undefined, trackerValue: number): JSX.Element => {
      // If function children, the caller handles the insets and overscroll
      const isFuncChildren = typeof children === 'function'

      const finalChildren = isFuncChildren ? children(info) : children

      if (avoidKeyboard) {
        return (
          <>
            <Animated.View style={[styles.sceneContainer, layoutStyle, insetStyle, { maxHeight: keyboardAnimation, padding }]}>{finalChildren}</Animated.View>
            {renderFooter != null || hasNotifications ? hasNotifications ? <NotificationView navigation={navigation} /> : null : null}
          </>
        )
      }

      if (scroll) {
        return (
          <>
            <Reanimated.ScrollView
              style={[layoutStyle, { padding }]}
              keyboardShouldPersistTaps={keyboardShouldPersistTaps}
              contentContainerStyle={insetStyle}
              scrollIndicatorInsets={{ right: 1 }}
            >
              {finalChildren}
            </Reanimated.ScrollView>
            {renderFooter != null || hasNotifications ? hasNotifications ? <NotificationView navigation={navigation} /> : null : null}
          </>
        )
      }

      return (
        <>
          <View style={[styles.sceneContainer, layoutStyle, insetStyle, { padding }]}>{finalChildren}</View>
          {renderFooter != null || hasNotifications ? hasNotifications ? <NotificationView navigation={navigation} /> : null : null}
        </>
      )

      // return (
      //   <MaybeAnimatedView when={avoidKeyboard} style={[styles.sceneContainer, layoutStyle, insetStyle, { maxHeight: keyboardAnimation, padding }]}>
      //     {/* <DotsBackground
      //       accentColors={accentColors}
      //       overrideDots={overrideDots}
      //       backgroundGradientColors={backgroundGradientColors}
      //       backgroundGradientStart={backgroundGradientStart}
      //       backgroundGradientEnd={backgroundGradientEnd}
      //     /> */}
      //     <MaybeAnimatedScrollView
      //       when={scroll && !avoidKeyboard}
      //       style={[layoutStyle, { padding }]}
      //       keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      //       contentContainerStyle={insetStyle}
      //       // onScroll={hasTabs || hasHeader ? handleScroll : () => {}}
      //       // Fixes middle-floating scrollbar issue
      //       scrollIndicatorInsets={{ right: 1 }}
      //     >
      //       <MaybeView when={!scroll && !avoidKeyboard} style={[styles.sceneContainer, layoutStyle, insetStyle, { padding }]}>
      //         {finalChildren}
      //       </MaybeView>
      //     </MaybeAnimatedScrollView>
      //     {renderFooter != null || hasNotifications ? (
      //       <>
      //         {hasNotifications ? <NotificationView navigation={navigation} /> : null}
      //         {/* {renderFooter != null && !hasTabs ? <SceneFooter>{renderFooter(info)}</SceneFooter> : null} */}
      //       </>
      //     ) : null}
      //   </MaybeAnimatedView>
      // )
    },
    [avoidKeyboard, children, hasNotifications, info, keyboardShouldPersistTaps, layoutStyle, navigation, padding, renderFooter, scroll]
  )

  // These represent the distance from the top of the screen to the top of
  // the keyboard depending if the keyboard is down or up.
  const downValue = frame.height
  const upValue = (keyboardHeight: number) => downValue - keyboardHeight

  return avoidKeyboard ? (
    <KeyboardTracker downValue={downValue} upValue={upValue}>
      {(keyboardAnimation, trackerValue) =>
        renderScene(keyboardAnimation /* Animation between downValue and upValue */, trackerValue /* downValue or upValue depending on if the keyboard state */)
      }
    </KeyboardTracker>
  ) : (
    renderScene(undefined, 0)
  )
}

const styles = StyleSheet.create({
  sceneContainer: {
    // Children:
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  }
})

// const MaybeAnimatedView = maybeComponent(Animated.View)
// const MaybeAnimatedScrollView = maybeComponent(Reanimated.ScrollView)
// const MaybeView = maybeComponent(View)

// const SceneFooter = styled(View)({
//   position: 'absolute',
//   bottom: 0,
//   left: 0,
//   right: 0
// })
