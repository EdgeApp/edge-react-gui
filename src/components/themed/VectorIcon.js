// @flow
import * as React from 'react'
import { Text } from 'react-native'
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

const iconFamily = [
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

const fontMap = {}

for (const icon of iconFamily) {
  const fontFamily = icon.getFontFamily()
  console.log(`vector icons: ${fontFamily}`)
  fontMap[fontFamily] = { icon }
}

type Props = {
  name: string,
  font: string,
  size: number,
  color: string,
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
    <Text selectable={false} {...otherProps}>
      {glyph}
    </Text>
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
