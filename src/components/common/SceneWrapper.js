// @flow

import React, { Component, type Node } from 'react'
import { Animated, Platform, StyleSheet, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { KeyboardTracker } from './KeyboardTracker.js'
import { LayoutContext, type SafeAreaGap } from './LayoutContext.js'

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
  children: Node | ((gap: SafeAreaGap) => Node),

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

/**
 * Wraps a normal stacked scene, creating a perfectly-sized box
 * that avoids the header and tab bar (if any).
 *
 * Also draws a common gradient background under the scene.
 */
export class SceneWrapper extends Component<Props> {
  render () {
    const { avoidKeyboard = false, hasHeader = true, hasTabs = true } = this.props

    return (
      <LayoutContext>
        {metrics => {
          const { safeAreaInsets } = metrics
          const gap = {
            ...safeAreaInsets,
            bottom: hasTabs ? 0 : safeAreaInsets.bottom,
            top: safeAreaInsets.top + (hasHeader ? getHeaderHeight() : 0)
          }
          const downValue = metrics.layout.height - gap.top
          const upValue = keyboardHeight => downValue - keyboardHeight

          return avoidKeyboard ? (
            <KeyboardTracker downValue={downValue} upValue={upValue}>
              {(keyboardAnimation, keyboardLayout) => this.renderScene(gap, keyboardAnimation, downValue - keyboardLayout)}
            </KeyboardTracker>
          ) : (
            this.renderScene(gap, null, 0)
          )
        }}
      </LayoutContext>
    )
  }

  /**
   * Render the scene wrapper component, given various items from the context.
   */
  renderScene (gap: SafeAreaGap, keyboardAnimation: Animated.Value | null, keyboardHeight: number) {
    const { children, background = 'header', bodySplit = 0 } = this.props

    // Render the scene container:
    const finalChildren = typeof children === 'function' ? children({ ...gap, bottom: keyboardHeight }) : children
    const scene =
      keyboardAnimation != null ? (
        <Animated.View style={[styles.scene, { ...gap, maxHeight: keyboardAnimation }]}>{finalChildren}</Animated.View>
      ) : (
        <View style={[styles.scene, gap]}>{finalChildren}</View>
      )

    // Render the background, if any:
    if (background === 'none') return scene
    return (
      <Gradient reverse={background === 'drawer'} style={styles.gradient}>
        {background === 'body' && <View style={[styles.body, { top: gap.top + bodySplit }]} />}
        {scene}
      </Gradient>
    )
  }
}

const isIos = Platform.OS === 'ios'

/**
 * Calculates the height of the header (where the back button lives).
 */
function getHeaderHeight () {
  if (isIos) {
    const majorVersionIOS = Number(Platform.Version)
    return majorVersionIOS > 9 && majorVersionIOS < 11 ? 62 : 44
  }
  return 56
}

const styles = StyleSheet.create({
  body: {
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
