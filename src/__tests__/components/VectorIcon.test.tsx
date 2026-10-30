import { afterEach, describe, expect, it, jest } from '@jest/globals'
import type * as TestingLibrary from '@testing-library/react-native/pure'
import type * as ReactType from 'react'
import type * as ReactNative from 'react-native'

import type { VectorIcon as VectorIconType } from '../../components/themed/VectorIcon'

type PlatformName = 'ios' | 'android'

interface RenderedText {
  type: string
  children: string[] | null
  props: { style: ReactNative.TextStyle }
}

// The icon sets pick their font names with `Platform.select` at import time,
// so each platform needs its own fresh copy of the module graph:
const renderIcon = (
  platform: PlatformName,
  font: ReactType.ComponentProps<typeof VectorIconType>['font'],
  name: string
): { glyph?: string; fontFamily?: string } => {
  jest.resetModules()
  const React = require('react') as typeof ReactType
  const { Platform, StyleSheet } = require('react-native') as typeof ReactNative
  const { render } =
    require('@testing-library/react-native/pure') as typeof TestingLibrary

  jest
    .spyOn(Platform, 'select')
    .mockImplementation(
      (spec: Record<string, unknown>) => spec[platform] ?? spec.default
    )

  const { VectorIcon } = require('../../components/themed/VectorIcon') as {
    VectorIcon: typeof VectorIconType
  }

  const rendered = render(
    <VectorIcon color="white" font={font} name={name} size={16} />
  )
  const json = rendered.toJSON() as RenderedText
  const out = {
    glyph: json.children?.[0],
    fontFamily: StyleSheet.flatten(json.props.style).fontFamily
  }
  rendered.unmount()
  return out
}

describe('VectorIcon', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  const lockGlyph = String.fromCodePoint(
    jest.requireActual<Record<string, number>>(
      'react-native-vector-icons/glyphmaps/AntDesign.json'
    ).lock
  )

  const cases: Array<[PlatformName, string]> = [
    ['ios', 'anticon'],
    ['android', 'AntDesign']
  ]

  it.each(cases)(
    'on %s, font "AntDesign" draws the glyph with font family "%s"',
    (platform, expectedFamily) => {
      const { glyph, fontFamily } = renderIcon(platform, 'AntDesign', 'lock')
      expect(glyph).toBe(lockGlyph)
      expect(fontFamily).toBe(expectedFamily)
    }
  )
})
