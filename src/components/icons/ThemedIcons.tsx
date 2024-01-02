import React from 'react'
import Animated, { AnimatedProps, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { IconProps as VectorIconProps } from 'react-native-vector-icons/Icon'
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
// HOCs
//

function makeAnimatedFontIcon(IconComponent: React.ComponentType<AnimatedProps<VectorIconProps>>, name: string): AnimatedIconComponent {
  return (props: AnimatedIconProps) => {
    const { accessible, color, size } = props
    const { icon, rem } = useTheme()
    const oneRem = rem(1)

    const style = useAnimatedStyle(() => ({
      color: color?.value ?? icon,
      fontSize: size?.value ?? oneRem
    }))

    return <IconComponent accessible={accessible} name={name} adjustsFontSizeToFit style={style} />
  }
}

function makeFontIcon(IconComponent: React.ComponentType<VectorIconProps>, name: string): IconComponent {
  return (props: IconProps) => {
    const { icon, rem } = useTheme()
    const { accessible, color = icon, size = rem(1) } = props

    const style = {
      color: color,
      fontSize: size
    }
    return <IconComponent accessible={accessible} name={name} adjustsFontSizeToFit style={style} />
  }
}

//
// Font Icons
//

const AnimatedAntDesignIcon = Animated.createAnimatedComponent(AntDesignIcon)
const AnimatedFontello = Animated.createAnimatedComponent(Fontello)
const AnimatedIonIcon = Animated.createAnimatedComponent(IonIcon)

export const CloseIcon = makeFontIcon(AntDesignIcon, 'close')
export const CloseIconAnimated = makeAnimatedFontIcon(AnimatedAntDesignIcon, 'close')

export const EyeIcon = makeFontIcon(IonIcon, 'eye-outline')
export const EyeIconAnimated = makeAnimatedFontIcon(AnimatedIonIcon, 'eye-outline')

export const EyeOffIcon = makeFontIcon(IonIcon, 'eye-off-outline')
export const EyeOffIconAnimated = makeAnimatedFontIcon(AnimatedIonIcon, 'eye-off-outline')

export const FlipIcon = makeFontIcon(Fontello, 'exchange')
export const FlipIconAnimated = makeAnimatedFontIcon(AnimatedFontello, 'exchange')

export const SearchIcon = makeFontIcon(AntDesignIcon, 'search1')
export const SearchIconAnimated = makeAnimatedFontIcon(AnimatedAntDesignIcon, 'search1')
