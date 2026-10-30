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
  font: string,
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

  const cases: Array<[PlatformName, string, string]> = [
    ['ios', 'anticon', 'anticon'],
    ['ios', 'AntDesign', 'anticon'],
    ['android', 'anticon', 'AntDesign'],
    ['android', 'AntDesign', 'AntDesign']
  ]

  it.each(cases)(
    'on %s, font "%s" draws the glyph with font family "%s"',
    (platform, font, expectedFamily) => {
      const { glyph, fontFamily } = renderIcon(platform, font, 'lock')
      expect(glyph).toBe(lockGlyph)
      expect(fontFamily).toBe(expectedFamily)
    }
  )

  it('renders nothing for an unknown font', () => {
    const { glyph, fontFamily } = renderIcon('android', 'NotAFont', 'lock')
    expect(glyph).toBeUndefined()
    expect(fontFamily).toBe('NotAFont')
  })
})
