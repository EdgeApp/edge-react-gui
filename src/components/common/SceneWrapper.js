// @flow

import React, { type ChildrenArray, type Node } from 'react'
import { Dimensions, Platform, StatusBar, StyleSheet, View } from 'react-native'
// $FlowFixMe See https://github.com/react-native-community/react-native-safe-area-view/pull/77
import { getInset } from 'react-native-safe-area-view'
import { connect } from 'react-redux'

import { type State } from '../../modules/ReduxTypes.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'

/**
 * Describes the gap between the edge of the content area and
 * the edge of the visible area.
 *
 * This gap includes things like the status bar, header bar, hardware sensors,
 * and other areas the scene can't use, but might want to paint a background
 * behind.
 */
export type SceneGap = {
  bottom: number,
  left: number,
  right: number,
  top: number
}

type BackgroundOptions =
  | 'header' // Header area covers the screen (default)
  | 'body' // Seprate header and content areas
  | 'none' // Do not render any background elements
  | 'drawer' // Reverse gradient for the drawer

type Props = {
  // The children can either be normal React elements,
  // or a function that accepts the current gap and returns an element.
  // The function will be called on each render, allowing the scene to react
  // to changes in the gap.
  children: ChildrenArray<Node> | ((gap: SceneGap) => ChildrenArray<Node>),

  // True if this scene should shrink to avoid the keyboard:
  avoidKeyboard?: boolean,

  // Background options:
  background?: BackgroundOptions,

  // Extra header area to insert above the body background:
  bodySplit?: number,

  // True if this scene has a header (with back button & such):
  hasHeader?: boolean,

  // True if this scene has a bottom tab bar:
  hasTabs?: boolean
}

type StateProps = {
  keyboardHeight: number
}

/**
 * Wraps a normal stacked scene, creating a perfectly-sized box
 * that avoids the header and tab bar (if any).
 *
 * Also draws a common gradient background under the scene.
 */
function SceneWrapperComponent (props: Props & StateProps) {
  const { children, avoidKeyboard = false, background = 'header', bodySplit = 0, hasHeader = true, hasTabs = true, keyboardHeight } = props

  // In the future, ReactNative itself will expose the safe area dimensions:
  // https://github.com/facebook/react-native/pull/20999
  //
  // For now, we need to use the community react-native-safe-area-view,
  // which exposes these dimensions with a bit of work.
  const { width, height } = Dimensions.get('window')
  const landscape = width > height
  const hardwareGap = {
    bottom: isIos ? getInset('bottom', landscape) : 0,
    left: isIos ? getInset('left', landscape) : 0,
    right: isIos ? getInset('right', landscape) : 0,
    top: isIos ? getInset('top', landscape) : StatusBar.currentHeight
  }

  // Next, compensate for various react-navigation components:
  const gap = {
    bottom: avoidKeyboard && keyboardHeight > 0 ? keyboardHeight : hasTabs ? 0 : hardwareGap.bottom,
    left: hardwareGap.left,
    right: hardwareGap.right,
    top: hardwareGap.top + (hasHeader ? getHeaderHeight() : 0)
  }

  // Pass the gap to our children, if they want it:
  const finalChildren = typeof children === 'function' ? children(gap) : children

  // Use a height-based layout to avoid the tab bar when the keyboard is up:
  const sceneLayout = { ...gap }
  if (avoidKeyboard && keyboardHeight > 0 && hasTabs) {
    sceneLayout.bottom = void 0
    sceneLayout.height = height - gap.top - keyboardHeight
  }

  const scene = <View style={[styles.scene, sceneLayout]}>{finalChildren}</View>

  // Finally, render a gradient under everything:
  if (background === 'none') return scene
  return (
    <Gradient reverse={background === 'drawer'} style={styles.gradient}>
      {background === 'body' && <View style={[styles.body, { top: gap.top + bodySplit }]} />}
      {scene}
    </Gradient>
  )
}

export const SceneWrapper = connect(
  (state: State) => ({ keyboardHeight: state.ui.scenes.dimensions.keyboardHeight }),
  dispatch => ({})
)(SceneWrapperComponent)

const isIos = Platform.OS === 'ios'

/**
 * Calculates the height of the header (where the back button lives).
 */
function getHeaderHeight () {
  if (isIos) {
    const majorVersionIOS = parseInt(Platform.Version, 10)
    if (majorVersionIOS > 9 && majorVersionIOS < 11) {
      return 62
    } else {
      return 44
    }
  }
  return 56
}

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0
  },
  scene: {
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    position: 'absolute'
  },
  body: {
    backgroundColor: THEME.COLORS.GRAY_4,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  }
})
