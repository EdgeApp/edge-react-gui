// @flow
import * as React from 'react'
import { Platform } from 'react-native'
import Ticker from 'react-native-ticker'

import { useTheme } from '../services/ThemeContext.js'

type Props = {
  children: React.Node,
  style: any,
  numberOfLines?: number,
  ellipsizeMode?: string,
  [x: string]: any
}

export const ThemedTicker = ({ children, style, ...props }: Props) => {
  const theme = useTheme()

  const iosTextProps = { numberOfLines: props.numberOfLines || 1, adjustsFontSizeToFit: true }
  const androidTextProps = { numberOfLines: props.numberOfLines || 1, ellipsizeMode: props.ellipsizeMode || 'middle' }
  const textProps = Platform.OS === 'ios' ? iosTextProps : androidTextProps

  const defaultTickerStyle = {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1)
  }

  return (
    <Ticker {...props} textProps={textProps} textStyle={[defaultTickerStyle, style]}>
      {children}
    </Ticker>
  )
}
