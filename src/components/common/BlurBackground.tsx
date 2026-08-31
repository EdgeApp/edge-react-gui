import { BlurTargetView, BlurView as ExpoBlurView } from 'expo-blur'
import React from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { BlurView } from 'rn-id-blurview'

import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

export { BlurTargetView }

const isAndroid = Platform.OS === 'android'

// Android below 12 (API 31) has no working blur under the new architecture:
// RenderScript cannot snapshot Fabric-rendered content, and painting the
// content behind a modal is impossible there. Hosts paint a solid background
// instead (see getBlurFallbackStyle).
export const isBlurDisabled = isAndroid && Number(Platform.Version) < 31

/**
 * Solid background for containers whose BlurBackground cannot render (see
 * isBlurDisabled). Spread into a style object: it contributes nothing at all
 * on capable devices, leaving their styles untouched.
 */
export const getBlurFallbackStyle = (
  theme: Theme
): { backgroundColor: string } | null =>
  isBlurDisabled
    ? { backgroundColor: theme.isDark ? '#161616' : '#f6f6f6' }
    : null

/**
 * The content the app's blur surfaces sample from. On Android 12+ the blur
 * implementation (Dimezis BlurView 3, via expo-blur) can only blur content
 * wrapped in an explicit target view - "snapshot the whole window" no longer
 * exists, and the old whole-window path silently renders nothing under the
 * new architecture. On iOS this wrapper is an ordinary View.
 */
const BlurTargetContext =
  React.createContext<React.RefObject<View | null> | null>(null)

/** Owns the blur-target ref. Mount above both the target and the Airship
 * layer whose modals sample it. */
export function BlurTargetProvider(props: {
  children: React.ReactNode
}): React.ReactElement {
  const ref = React.useRef<View>(null)
  return (
    <BlurTargetContext.Provider value={ref}>
      {props.children}
    </BlurTargetContext.Provider>
  )
}

/** Marks its children as the content blur surfaces sample. Wrap the app's
 * scene tree, NOT the modal layer - a modal must not sample itself. */
export function BlurTarget(props: {
  children: React.ReactNode
}): React.ReactElement {
  const ref = React.useContext(BlurTargetContext)
  return (
    <BlurTargetView
      ref={ref ?? undefined}
      collapsable={false}
      style={styles.blurTarget}
    >
      {props.children}
    </BlurTargetView>
  )
}

export const useBlurTarget = (): React.RefObject<View | null> | undefined =>
  React.useContext(BlurTargetContext) ?? undefined

//
// Focused-scene blur target: the chrome overlaying a scene (header, footer,
// tab bar, notification cards) blurs THAT scene's content. Chrome cannot use
// the app-level target above because chrome lives inside it, and a blur view
// must never sample a tree containing itself. Each SceneWrapper publishes its
// content view here while focused; chrome subscribes to the current one.
//

const sceneBlurRegistry: {
  ref: React.RefObject<View | null> | null
  listeners: Set<() => void>
} = { ref: null, listeners: new Set() }

const emitSceneBlur = (): void => {
  sceneBlurRegistry.listeners.forEach(listener => {
    listener()
  })
}
const subscribeSceneBlur = (listener: () => void): (() => void) => {
  sceneBlurRegistry.listeners.add(listener)
  return () => sceneBlurRegistry.listeners.delete(listener)
}
const getFocusedSceneBlurTarget = (): React.RefObject<View | null> | null =>
  sceneBlurRegistry.ref

/**
 * For SceneWrapper: returns a ref to attach to the scene's BlurTargetView,
 * published as the focused scene's blur target while `active`.
 */
export function useSceneBlurTarget(
  active: boolean
): React.RefObject<View | null> {
  const ref = React.useRef<View>(null)
  React.useEffect(() => {
    if (!active) return
    sceneBlurRegistry.ref = ref
    emitSceneBlur()
    return () => {
      if (sceneBlurRegistry.ref === ref) {
        sceneBlurRegistry.ref = null
        emitSceneBlur()
      }
    }
  }, [active])
  return ref
}

interface AndroidBlurProps {
  rounded?: boolean
  /** iOS-style blur tint. Defaults to the theme's mode. */
  reverseTint?: boolean
  /** Sample this target instead of the app-level one. */
  targetRef?: React.RefObject<View | null>
}

/** The Android 12+ blur: expo-blur's Dimezis 3 backend, which works under
 * the new architecture but needs the BlurTarget above. Falls back to a plain
 * tint when no target is mounted (e.g. tests). */
const AndroidBlur = (props: AndroidBlurProps): React.ReactElement => {
  const { rounded = false, reverseTint = false, targetRef } = props
  const theme = useTheme()
  const stylesLocal = getStyles(theme)
  const appTarget = useBlurTarget()
  const blurTarget = targetRef ?? appTarget
  const dark = reverseTint ? !theme.isDark : theme.isDark
  return (
    <ExpoBlurView
      blurMethod="dimezisBlurViewSdk31Plus"
      blurTarget={blurTarget}
      tint={dark ? 'dark' : 'light'}
      intensity={100}
      style={[
        StyleSheet.absoluteFill,
        stylesLocal.clip,
        rounded ? stylesLocal.roundCorner : null
      ]}
    />
  )
}

/**
 * A blur background WITH rounded corners, for content living INSIDE the
 * blur target (cards, chrome). On Android this renders the tint only: these
 * surfaces sit inside the BlurTarget, and a blur view must never sample a
 * tree containing itself - that recursion overflows the renderer's stack.
 * Per-surface targets are the future fix; the tint is today's shipped look.
 */
export const BlurBackground: React.FC = () => {
  const theme = useTheme()
  const stylesLocal = getStyles(theme)

  if (isBlurDisabled) return null
  if (isAndroid) {
    return <View style={[stylesLocal.blurView, stylesLocal.roundCorner]} />
  }
  return (
    <BlurView
      blurType={theme.isDark ? 'dark' : 'light'}
      style={[stylesLocal.blurView, stylesLocal.roundCorner]}
      overlayColor="rgba(0, 0, 0, 0)"
    />
  )
}

/** A blur background WITHOUT rounded corners. For the scene header/footer,
 * which also live inside the blur target - see BlurBackground. */
export const BlurBackgroundNoRoundedCorners: React.FC = () => {
  const theme = useTheme()
  const stylesLocal = getStyles(theme)

  if (isBlurDisabled) return null
  if (isAndroid) return <View style={stylesLocal.blurView} />
  return (
    <BlurView
      blurType={theme.isDark ? 'dark' : 'light'}
      style={stylesLocal.blurView}
      overlayColor="rgba(0, 0, 0, 0)"
    />
  )
}

/** The blur behind chrome overlaying the focused scene: the header, scene
 * footer, tab bar, and notification cards. These live inside the app-level
 * target, so on Android they sample the focused scene's own target instead,
 * falling back to their long-standing tint when no scene publishes one
 * (login, scenes without a wrapped content view). */
export const ChromeBlurBackground: React.FC<{ rounded?: boolean }> = props => {
  const { rounded = false } = props
  const theme = useTheme()
  const stylesLocal = getStyles(theme)
  const sceneTarget = React.useSyncExternalStore(
    subscribeSceneBlur,
    getFocusedSceneBlurTarget
  )

  if (isBlurDisabled) return null
  if (isAndroid) {
    if (sceneTarget == null) {
      return (
        <View
          style={[
            stylesLocal.blurView,
            rounded ? stylesLocal.roundCorner : null
          ]}
        />
      )
    }
    return <AndroidBlur rounded={rounded} targetRef={sceneTarget} />
  }
  return (
    <BlurView
      blurType={theme.isDark ? 'dark' : 'light'}
      style={[stylesLocal.blurView, rounded ? stylesLocal.roundCorner : null]}
      overlayColor="rgba(0, 0, 0, 0)"
    />
  )
}

/** The blur behind modal sheets. Modals mount in the Airship layer, outside
 * the BlurTarget, so on Android 12+ they can sample it for real blur. */
export const ModalBlurBackground: React.FC = () => {
  const theme = useTheme()
  const stylesLocal = getStyles(theme)

  if (isBlurDisabled) return null
  if (isAndroid) return <AndroidBlur rounded />
  return (
    <BlurView
      blurType={theme.isDark ? 'dark' : 'light'}
      style={[stylesLocal.blurView, stylesLocal.roundCorner]}
      overlayColor="rgba(0, 0, 0, 0)"
    />
  )
}

/** Full-screen blur with the tint flipped against the theme, for standing out
 * over content rather than blending in (the QR modal's underlay). */
export const BlurUnderlayReversed: React.FC = () => {
  const theme = useTheme()

  if (isBlurDisabled) return null
  if (isAndroid) return <AndroidBlur reverseTint />
  return (
    <BlurView
      blurType={theme.isDark ? 'light' : 'dark'}
      style={StyleSheet.absoluteFill}
    />
  )
}

const styles = StyleSheet.create({
  blurTarget: { flex: 1 }
})

const getStyles = cacheStyles((theme: Theme) => ({
  blurView: {
    ...StyleSheet.absoluteFill,
    // We need this backgroundColor because Android applies an overlay to the
    // entire screen for the BlurView by default. We change this default
    // behavior with the transparent overlayColor, so we add this background
    // color to compensate and to match iOS colors/shades.
    backgroundColor: isAndroid
      ? theme.isDark
        ? '#161616aa'
        : '#ffffff55'
      : undefined
  },
  clip: {
    overflow: 'hidden'
  },
  roundCorner: {
    // Weird quirk: iOS needs rounding at this component level to properly round
    // corners, even if the parent has round corners. Parents can't hide
    // overflows for this component.
    // Android behaves as expected when a parent with rounded corners holds
    // `BlurBackground,` properly hiding overflows.
    borderRadius: theme.cardBorderRadius
  }
}))
