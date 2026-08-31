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

interface IconSetProps {
  name: string
  size: number
  color: string
  allowFontScaling: boolean
  style?: any
}

/**
 * Icon families addressable by name. Each family types its `name` prop as a
 * union of its own glyph names, but we look glyphs up at runtime, so this
 * widens them to a common shape.
 */
const iconSets: MapObject<React.ComponentType<IconSetProps>> = {
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
} as any

interface Props {
  name: string
  font: string
  size: number
  color: string
  style?: any
}

export const VectorIcon: React.FC<Props> = props => {
  const { name, font, size, color, style, ...rest } = props

  const IconSet = iconSets[font]
  if (IconSet == null) return null

  return (
    <IconSet
      {...rest}
      allowFontScaling={false}
      name={name}
      size={size}
      color={color}
      style={style}
    />
  )
}
