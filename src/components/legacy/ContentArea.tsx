import * as React from 'react'
import { View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { LadderLayout } from './LadderLayout'

type BackgroundOptions =
  | 'none' // Don't draw any background
  | 'body' // White content
  | 'tray' // Off-white tray area

interface Props {
  children: React.ReactNode
  background?: BackgroundOptions

  // True if we should expand to fill all available space,
  // or false be tight to the content. Defaults to false:
  grow?: boolean

  // Space to put around and between all items. Defaults to 1rem:
  padding?: number | 'wide'

  // True to use a horizontal layout. Defaults to false:
  horizontal?: boolean
}

export function ContentArea(props: Props) {
  const { children, grow = false, horizontal = false } = props
  const padding = parsePadding(props.padding)
  const backgroundColor = parseBackground(props.background)

  const style: any = {
    // Layout:
    padding,
    flexGrow: grow ? 1 : 0,

    // Visuals:
    backgroundColor,

    // Children:
    alignItems: 'stretch',
    flexDirection: horizontal ? 'row' : 'column',
    justifyContent: 'flex-start'
  }

  return <View style={style}>{LadderLayout({ children, horizontal, padding })}</View>
}

function parsePadding(padding?: number | 'wide'): number {
  if (typeof padding === 'number') return padding
  if (padding === 'wide') return THEME.rem(1.4)
  return THEME.rem(1)
}

function parseBackground(background?: BackgroundOptions): string | undefined {
  if (background === 'body') return THEME.COLORS.WHITE
  if (background === 'tray') return THEME.COLORS.GRAY_4
}
