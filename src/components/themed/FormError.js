// @flow

import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

type OwnProps = {
  isVisible: boolean,
  children: React.Node,
  style?: StyleSheet.Styles
}

const FormErrorComponent = ({ children, theme, style, isVisible, ...props }: OwnProps & ThemeProps) => {
  const { container, text } = getStyles(theme)

  if (!isVisible) return null

  return (
    <View style={[container, style]}>
      <SimpleLineIcons name="info" size={theme.rem(1.1)} color={theme.dangerText} />
      <EdgeText style={text} {...props}>
        {children}
      </EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    borderWidth: 0.25,
    borderRadius: theme.rem(0.25),
    borderColor: theme.dangerText,
    padding: theme.rem(1),
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  text: {
    flexShrink: 1,
    color: theme.dangerText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    marginLeft: theme.rem(0.75)
  }
}))

export const FormError = withTheme(FormErrorComponent)
