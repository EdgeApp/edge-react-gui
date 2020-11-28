// @flow

import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { type Theme, useTheme } from '../services/ThemeContext.js'

type Props = {
  rightSwipable?: React.Node,
  leftSwipable?: React.Node,
  right?: React.Node,
  left?: React.Node
}

export const HIDDEN_MENU_BUTTONS_WIDTH = 5.5

export function HiddenMenuButtons(props: Props) {
  const { rightSwipable, leftSwipable, left, right } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.background}>
      <View style={styles.buttons}>
        {left}
        {leftSwipable}
      </View>
      <View style={styles.buttons}>
        {rightSwipable}
        {right}
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  buttons: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: theme.rem(HIDDEN_MENU_BUTTONS_WIDTH)
  },
  background: {
    alignItems: 'center',
    backgroundColor: theme.secondaryButton,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}))
