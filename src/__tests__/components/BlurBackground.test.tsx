import { describe, expect, it, jest } from '@jest/globals'
import type * as TestingLibrary from '@testing-library/react-native'
import type * as ReactModule from 'react'
import type * as ReactNative from 'react-native'

import type * as BlurBackgroundModule from '../../components/common/BlurBackground'

// BlurBackground picks its platform when it loads, so load a copy of it,
// with its own React and React Native, on an Android 12+ device. The JSX in
// this file renders with that copy of React:
let React: typeof ReactModule
let rtl: typeof TestingLibrary
let blur: typeof BlurBackgroundModule
jest.isolateModules(() => {
  const { Platform } = jest.requireActual<typeof ReactNative>('react-native')
  Platform.OS = 'android'
  Object.defineProperty(Platform, 'Version', { get: () => 34 })
  React = jest.requireActual<typeof ReactModule>('react')
  rtl = jest.requireActual<typeof TestingLibrary>(
    '@testing-library/react-native'
  )
  blur = jest.requireActual<typeof BlurBackgroundModule>(
    '../../components/common/BlurBackground'
  )
})

interface FocusedSceneProps {
  hasWebView: boolean
}

/** A focused scene, publishing itself the way SceneWrapper does. */
const FocusedScene: ReactModule.FC<FocusedSceneProps> = props => {
  blur.useSceneBlurTarget(true, props.hasWebView)
  return null
}

/** The host component type `surface` renders over a focused scene. */
const renderedType = (
  surface: ReactModule.ReactElement,
  scene?: { hasWebView: boolean }
): string => {
  const { toJSON, unmount } = rtl.render(
    <>
      {scene == null ? null : <FocusedScene hasWebView={scene.hasWebView} />}
      {surface}
    </>
  )
  const json = toJSON()
  unmount()
  if (json == null || Array.isArray(json)) throw new Error('no single surface')
  return json.type
}

describe('blur surfaces over a focused WebView scene on Android', () => {
  it('blurs modals over other scenes', () => {
    expect(
      renderedType(<blur.ModalBlurBackground />, { hasWebView: false })
    ).toBe('ExpoBlurView')
    expect(renderedType(<blur.BlurUnderlayReversed />)).toBe('ExpoBlurView')
  })

  it('tints modals over a WebView scene', () => {
    expect(
      renderedType(<blur.ModalBlurBackground />, { hasWebView: true })
    ).toBe('View')
    expect(
      renderedType(<blur.BlurUnderlayReversed />, { hasWebView: true })
    ).toBe('View')
  })

  it('tints the chrome over a WebView scene', () => {
    expect(
      renderedType(<blur.ChromeBlurBackground />, { hasWebView: false })
    ).toBe('ExpoBlurView')
    expect(
      renderedType(<blur.ChromeBlurBackground />, { hasWebView: true })
    ).toBe('View')
  })

  it('blurs modals again once the WebView scene loses focus', () => {
    const { toJSON, rerender, unmount } = rtl.render(
      <>
        <FocusedScene hasWebView />
        <blur.ModalBlurBackground />
      </>
    )
    expect(toJSON()).toMatchObject({ type: 'View' })

    rerender(<blur.ModalBlurBackground />)
    expect(toJSON()).toMatchObject({ type: 'ExpoBlurView' })
    unmount()
  })
})
