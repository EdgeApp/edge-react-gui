import React from 'react'
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { type Icon } from 'react-native-vector-icons/Icon'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector'
import { useTheme } from '../services/ThemeContext'

//
// Types
//

export interface AnimatedIconProps {
  accessible?: boolean
  color?: SharedValue<string>
  size?: SharedValue<number>
}
export type AnimatedIconComponent = React.FunctionComponent<AnimatedIconProps>

export interface IconProps {
  accessible?: boolean
  color?: string
  size?: number
}
export type IconComponent = React.FunctionComponent<IconProps>

//
// Inner components
//

interface IconChoice {
  IconComponent: typeof Icon
  name: string
}

function AnimatedFontIcon(props: AnimatedIconProps & IconChoice): JSX.Element {
  const { accessible, color, IconComponent, name, size } = props
  const theme = useTheme()
  const defaultColor = theme.icon
  const defaultSize = theme.rem(1)

  const fontFamily = IconComponent.getFontFamily()
  const glyphMap = IconComponent.getRawGlyphMap()

  const style = useAnimatedStyle(() => ({
    color: color?.value ?? defaultColor,
    fontFamily,
    fontSize: size?.value ?? defaultSize,
    fontStyle: 'normal',
    fontWeight: 'normal'
  }))

  // We use a raw `Animated.Text` here to avoid conflicts between
  // react-native-reanimated's `createAnimatedComponent` and the
  // react-native-vector-icon's wrapper component.
  return (
    <Animated.Text accessible={accessible} style={style}>
      {String.fromCodePoint(glyphMap[name])}
    </Animated.Text>
  )
}

function ThemedFontIcon(props: IconProps & IconChoice): JSX.Element {
  const theme = useTheme()
  const { accessible, color = theme.icon, IconComponent, name, size = theme.rem(1) } = props

  const style = {
    color: color,
    fontSize: size
  }
  return <IconComponent accessible={accessible} name={name} adjustsFontSizeToFit style={style} />
}

//
// HOC's
//

function makeAnimatedFontIcon(IconComponent: typeof Icon, name: string): AnimatedIconComponent {
  return props => AnimatedFontIcon({ ...props, IconComponent, name })
}

function makeFontIcon(IconComponent: typeof Icon, name: string): IconComponent {
  return props => ThemedFontIcon({ ...props, IconComponent, name })
}

//
// Font Icons
//

export function EyeIconAnimated(props: AnimatedIconProps & { off: boolean }): JSX.Element {
  const { off, ...rest } = props

  // Swapping between two icons causes rendering glitches,
  // so we recycle the same component with different props:
  return AnimatedFontIcon({
    ...rest,
    IconComponent: IonIcon,
    name: off ? 'eye-off-outline' : 'eye-outline'
  })
}

export const CloseIcon = makeFontIcon(AntDesignIcon, 'close')
export const CloseIconAnimated = makeAnimatedFontIcon(AntDesignIcon, 'close')

export const FlipIcon = makeFontIcon(Fontello, 'exchange')
export const FlipIconAnimated = makeAnimatedFontIcon(Fontello, 'exchange')

export const SearchIcon = makeFontIcon(AntDesignIcon, 'search1')
export const SearchIconAnimated = makeAnimatedFontIcon(AntDesignIcon, 'search1')
