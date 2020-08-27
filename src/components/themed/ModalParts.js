// @flow

import * as React from 'react'
import { Text } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { type Theme, useTheme } from '../services/ThemeContext.js'

export function ModalTitle(props: { children: React.Node }) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return <Text style={styles.titleText}>{props.children}</Text>
}

export function ModalMessage(props: { children: React.Node }) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return <Text style={styles.messageText}>{props.children}</Text>
}

const getStyles = cacheStyles((theme: Theme) => ({
  titleText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.25),
    margin: theme.rem(0.5),
    textAlign: 'center'
  },
  messageText: {
    alignSelf: 'center',
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5),
    textAlign: 'left'
  }
}))
