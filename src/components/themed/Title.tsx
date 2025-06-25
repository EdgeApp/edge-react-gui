import * as React from 'react'
import { View } from 'react-native'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  styleLeftIcon?: any
  styleRightIcon?: any
  text: string
}

export function Title(props: Props) {
  const { leftIcon, text, rightIcon, styleLeftIcon, styleRightIcon } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.row}>
      {leftIcon ? (
        <View style={[styles.leftIcon, styleLeftIcon]}>{leftIcon}</View>
      ) : null}
      <EdgeText style={styles.text}>{text}</EdgeText>
      {rightIcon ? <View style={styleRightIcon}>{rightIcon}</View> : null}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    minHeight: theme.rem(1.75),
    marginBottom: theme.rem(0.7),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },

  leftIcon: {
    marginRight: theme.rem(0.75)
  },

  text: {
    flexShrink: 1,
    flexGrow: 1,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    textAlign: 'left',
    color: theme.primaryText
  }
}))
