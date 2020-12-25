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
  durations?: number,
  [x: string]: any
}

export const ThemedTicker = ({ children, style, duration, ...props }: Props) => {
  const theme = useTheme()

  // TODO: The nature of the Ticker compoenent does not apply textProps to the string as a whole so these propds dont work.
  // May not be able to have the text automatically adjust to fit with this ticker. If this is needed, may need more creative solution.
  const iosTextProps = { numberOfLines: props.numberOfLines || 1, adjustsFontSizeToFit: true }
  const androidTextProps = { numberOfLines: props.numberOfLines || 1, ellipsizeMode: props.ellipsizeMode || 'middle' }
  const textProps = Platform.OS === 'ios' ? iosTextProps : androidTextProps

  const defaultTickerStyle = {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1)
  }

  return (
    <Ticker {...props} textProps={textProps} textStyle={[defaultTickerStyle, style]} duration={duration || 500}>
      {children}
    </Ticker>
  )
}
