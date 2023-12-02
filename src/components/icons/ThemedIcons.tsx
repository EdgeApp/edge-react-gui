import React from 'react'
import Animated, { AnimatedProps, SharedValue, useAnimatedStyle } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { IconProps as VectorIconProps } from 'react-native-vector-icons/Icon'

//
// Types

//

export interface AnimatedIconProps {
  color: SharedValue<string>
  size?: SharedValue<number>
}
export type AnimatedIconComponent = React.FunctionComponent<AnimatedIconProps>

export interface IconProps {
  color: string
  size?: number
}
export type IconComponent = React.FunctionComponent<IconProps>

//
// HOCs
//

function makeAnimatedFontIcon(IconComponent: React.ComponentType<AnimatedProps<VectorIconProps>>, name: string): AnimatedIconComponent {
  return (props: AnimatedIconProps) => {
    const { color, size } = props
    const style = useAnimatedStyle(() => ({
      color: color.value,
      fontSize: size?.value
    }))
    return <IconComponent name={name} adjustsFontSizeToFit style={style} />
  }
}

function makeFontIcon(IconComponent: React.ComponentType<VectorIconProps>, name: string): IconComponent {
  return (props: IconProps) => {
    const { color, size } = props
    const style = {
      color: color,
      fontSize: size
    }
    return <IconComponent name={name} adjustsFontSizeToFit style={style} />
  }
}

//
// Icons
//

const AnimatedAntDesignIcon = Animated.createAnimatedComponent(AntDesignIcon)

export const CloseIcon = makeFontIcon(AntDesignIcon, 'close')
export const CloseIconAnimated = makeAnimatedFontIcon(AnimatedAntDesignIcon, 'close')

export const SearchIcon = makeFontIcon(AntDesignIcon, 'search1')
export const SearchIconAnimated = makeAnimatedFontIcon(AnimatedAntDesignIcon, 'search1')
