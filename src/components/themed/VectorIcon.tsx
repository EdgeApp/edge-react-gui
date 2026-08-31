// @flow
import AntDesign from '@expo/vector-icons/AntDesign'
import Entypo from '@expo/vector-icons/Entypo'
import EvilIcons from '@expo/vector-icons/EvilIcons'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Fontisto from '@expo/vector-icons/Fontisto'
import Foundation from '@expo/vector-icons/Foundation'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Octicons from '@expo/vector-icons/Octicons'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import Zocial from '@expo/vector-icons/Zocial'
import * as React from 'react'

import type { MapObject } from '../../types/types'
import { UnscaledText } from '../text/UnscaledText'

// Vector icons font family name reference

// Material Design Icons
// anticon
// Entypo
// EvilIcons
// Feather
// FontAwesome
// Fontisto
// fontcustom
// Ionicons
// Material Icons
// Octicons
// simple-line-icons
// zocial

type GlyphIcon = {
  getFontFamily: () => string
  getRawGlyphMap: () => Record<string, string | number>
}

const iconFamily: GlyphIcon[] = [
  MaterialCommunityIcons,
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial
]

const fontMap: MapObject<{ icon: GlyphIcon }> = {}

for (const icon of iconFamily) {
  const fontFamily = icon.getFontFamily()
  fontMap[fontFamily] = { icon }
}

interface Props {
  name: string
  font: string
  size: number
  color: string
  style?: any
}

export function VectorIcon(props: Props) {
  const { name, font, size, color, style, ...props2 } = props

  const glyph = getStringForIcon(font, name)

  const styleDefaults = {
    fontSize: size,
    color
  }

  const styleOverrides = {
    fontFamily: font,
    fontWeight: 'normal',
    fontStyle: 'normal'
  }

  const otherProps: any = props2 // FlowHack
  otherProps.style = [styleDefaults, style, styleOverrides]

  return (
    <UnscaledText selectable={false} {...otherProps}>
      {glyph}
    </UnscaledText>
  )
}

const getStringForIcon = (fontFamily: string, iconName: string): string => {
  const iconObj = fontMap[fontFamily]
  if (iconObj == null) return ''
  const glyphMap = iconObj.icon.getRawGlyphMap()
  let glyph = iconName ? glyphMap[iconName] || '?' : ''
  if (typeof glyph === 'number') {
    glyph = String.fromCodePoint(glyph)
  }
  return glyph
}
