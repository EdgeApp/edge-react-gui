// @flow

import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

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

export function ModalCloseArrow(props: { onPress: () => void }) {
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity onPress={props.onPress} style={styles.closeArrow}>
      <AntDesignIcon name="down" size={theme.rem(1.25)} color={theme.secondaryText} />
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  closeArrow: {
    alignItems: 'center',
    paddingTop: theme.rem(1)
  },
  titleText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1.25),
    margin: theme.rem(0.5),
    textAlign: 'center'
  },
  messageText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5),
    textAlign: 'left'
  }
}))
