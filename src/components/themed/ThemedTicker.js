// @flow
import * as React from 'react'
import Ticker from 'react-native-ticker'

import { useTheme } from '../services/ThemeContext.js'

type Props = {
  children: React.Node,
  style: any,
  duration?: number,
  [x: string]: any
}

export const ThemedTicker = ({ children, style, duration, ...props }: Props) => {
  const theme = useTheme()

  const defaultTickerStyle = {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1)
  }

  return (
    <Ticker {...props} textStyle={[defaultTickerStyle, style]} duration={duration || 500}>
      {children}
    </Ticker>
  )
}
