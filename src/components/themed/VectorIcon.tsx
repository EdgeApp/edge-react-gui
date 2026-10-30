// @flow
import * as React from 'react'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Entypo from 'react-native-vector-icons/Entypo'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import Feather from 'react-native-vector-icons/Feather'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Fontisto from 'react-native-vector-icons/Fontisto'
import Foundation from 'react-native-vector-icons/Foundation'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Octicons from 'react-native-vector-icons/Octicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import Zocial from 'react-native-vector-icons/Zocial'

import type { MapObject } from '../../types/types'
import { UnscaledText } from '../text/UnscaledText'

// The library names each font by family on iOS but by file on Android,
// so accept either name on either platform:
const iconFonts: MapObject<typeof AntDesign> = {
  'Material Design Icons': MaterialCommunityIcons,
  MaterialCommunityIcons,
  anticon: AntDesign,
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  Fontisto,
  fontcustom: Foundation,
  Foundation,
  Ionicons,
  'Material Icons': MaterialIcons,
  MaterialIcons,
  Octicons,
  'simple-line-icons': SimpleLineIcons,
  SimpleLineIcons,
  zocial: Zocial,
  Zocial
}

interface Props {
  name: string
  font: string
  size: number
  color: string
  style?: any
}

export const VectorIcon: React.FC<Props> = props => {
  const { name, font, size, color, style, ...props2 } = props

  const icon = iconFonts[font]
  const glyph = getStringForIcon(icon, name)

  const styleDefaults = {
    fontSize: size,
    color
  }

  const styleOverrides = {
    // Render with the name the current platform uses:
    fontFamily: icon == null ? font : icon.getFontFamily(),
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

const getStringForIcon = (
  icon: typeof AntDesign | undefined,
  iconName: string
): string => {
  if (icon == null) return ''
  const glyphMap = icon.getRawGlyphMap()
  if (iconName === '') return ''
  const glyph = glyphMap[iconName] ?? '?'
  return typeof glyph === 'number' ? String.fromCodePoint(glyph) : glyph
}
