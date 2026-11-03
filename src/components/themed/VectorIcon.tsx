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

import { UnscaledText } from '../text/UnscaledText'

const iconFonts = {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial
}

interface Props {
  name: string
  font: keyof typeof iconFonts
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
    fontFamily: icon.getFontFamily(),
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

const getStringForIcon = (icon: typeof AntDesign, iconName: string): string => {
  const glyphMap = icon.getRawGlyphMap()
  if (iconName === '') return ''
  const glyph = glyphMap[iconName] ?? '?'
  return typeof glyph === 'number' ? String.fromCodePoint(glyph) : glyph
}
