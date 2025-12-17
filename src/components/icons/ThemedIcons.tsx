import React from 'react'
import Animated, {
  type SharedValue,
  useAnimatedStyle
} from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import type { Icon } from 'react-native-vector-icons/Icon'
import Ionicons from 'react-native-vector-icons/Ionicons'

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

type IconStyle = React.ComponentProps<typeof AntDesignIcon>['style']

export interface IconProps {
  accessible?: boolean
  color?: string
  size?: number
  style?: IconStyle
}
export type IconComponent = React.FunctionComponent<IconProps>

//
// Inner components
//

interface IconChoice {
  IconComponent: typeof Icon
  name: string
}

function AnimatedFontIcon(
  props: AnimatedIconProps & IconChoice
): React.ReactElement {
  const { accessible, color, IconComponent, name, size } = props
  const theme = useTheme()
  const defaultColor = theme.icon
  const defaultSize = theme.rem(1)

  const fontFamily = IconComponent.getFontFamily()
  const glyphMap = IconComponent.getRawGlyphMap()
  const glyph = String.fromCodePoint(glyphMap[name])

  const style = useAnimatedStyle(() => ({
    color: color?.value ?? defaultColor,
    fontFamily,
    fontSize: size?.value ?? defaultSize,
    fontStyle: 'normal',
    fontWeight: 'normal'
  }))

  // We use a raw `Animated.Text` here to avoid conflicts between
  // the icon library & the reanimated library:
  return (
    <Animated.Text
      allowFontScaling={false}
      accessible={accessible}
      style={style}
    >
      {glyph}
    </Animated.Text>
  )
}

function ThemedFontIcon(props: IconProps & IconChoice): React.ReactElement {
  const theme = useTheme()
  const {
    accessible,
    color = theme.icon,
    IconComponent,
    name,
    size = theme.rem(1),
    style
  } = props

  const baseStyle = {
    color,
    fontSize: size
  }

  return (
    <IconComponent
      accessible={accessible}
      name={name}
      adjustsFontSizeToFit
      style={[baseStyle, style]}
    />
  )
}

//
// HOC's
//

function makeAnimatedFontIcon(
  IconComponent: typeof Icon,
  name: string
): AnimatedIconComponent {
  return props => AnimatedFontIcon({ ...props, IconComponent, name })
}

function makeFontIcon(IconComponent: typeof Icon, name: string): IconComponent {
  return props => ThemedFontIcon({ ...props, IconComponent, name })
}

//
// Font Icons
//

export function EyeIconAnimated(
  props: AnimatedIconProps & { off: boolean }
): React.ReactElement {
  const { off, ...rest } = props

  // Swapping between two icons causes rendering glitches,
  // so we recycle the same component with different props:
  return AnimatedFontIcon({
    ...rest,
    IconComponent: Ionicons,
    name: off ? 'eye-off-outline' : 'eye-outline'
  })
}

export const ChevronLeftAnimated = makeAnimatedFontIcon(Feather, 'chevron-left')

export const ChevronUpIcon = makeFontIcon(Feather, 'chevron-up')
export const ChevronDownIcon = makeFontIcon(Feather, 'chevron-down')
export const ChevronLeftIcon = makeFontIcon(Feather, 'chevron-left')
export const ChevronRightIcon = makeFontIcon(Feather, 'chevron-right')

export const CloseIcon = makeFontIcon(AntDesignIcon, 'close')
export const CloseIconAnimated = makeAnimatedFontIcon(AntDesignIcon, 'close')

export const FlipIcon = makeFontIcon(Fontello, 'exchange')
export const FlipIconAnimated = makeAnimatedFontIcon(Fontello, 'exchange')

export const SwapVerticalIcon = makeFontIcon(Ionicons, 'swap-vertical')

export const SearchIcon = makeFontIcon(AntDesignIcon, 'search1')
export const SearchIconAnimated = makeAnimatedFontIcon(AntDesignIcon, 'search1')

export const GridIcon = makeFontIcon(Ionicons, 'grid-outline')
export const ListIcon = makeFontIcon(Ionicons, 'list')

export const InformationCircleIcon = makeFontIcon(
  Ionicons,
  'information-circle-outline'
)
