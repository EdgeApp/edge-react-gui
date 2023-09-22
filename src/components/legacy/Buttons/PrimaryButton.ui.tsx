import * as React from 'react'
import { StyleSheet, Text as RNText, TextStyle, TouchableHighlight, TouchableHighlightProps, View } from 'react-native'

import { THEME } from '../../../theme/variables/airbitz'
import { scale } from '../../../util/scaling'

interface TextProps {
  children: React.ReactNode
  style?: TextStyle
}
class Text extends React.Component<TextProps> {
  render() {
    const { children, style, ...props } = this.props
    return (
      <RNText numberOfLines={1} ellipsizeMode="middle" style={[styles.buttonText, styles.primaryButtonText, style]} {...props}>
        {children}
      </RNText>
    )
  }
}

interface Props extends TouchableHighlightProps {
  children: React.ReactNode
  style?: TextStyle
  onPress?: () => unknown
}

export class PrimaryButton extends React.Component<Props> {
  static Text = Text
  render() {
    const { children, style, ...props } = this.props
    return (
      <TouchableHighlight underlayColor={primaryButtonUnderlay.color} style={[styles.button, styles.primaryButton, style]} {...props}>
        <View>{children}</View>
      </TouchableHighlight>
    )
  }
}

const primaryButtonUnderlay = { color: THEME.COLORS.PRIMARY }

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flex: -1
  },
  buttonText: {
    fontFamily: THEME.FONTS.DEFAULT,
    fontSize: scale(18),
    lineHeight: scale(18),
    position: 'relative',
    top: 1
  },
  // PRIMARY BUTTON
  primaryButton: {
    backgroundColor: THEME.COLORS.SECONDARY
  },
  primaryButtonText: {
    color: THEME.COLORS.WHITE
  }
})
