// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import T from '../../modules/UI/components/FormattedText/FormattedText.ui'
import { type Theme, useTheme } from '../services/ThemeContext.js'

type HiddenButtonProps = { text: string | React.Node, onPress: () => Promise<void>, type: 'danger' | 'success' | 'default' }

type Props = {
  rightSwipable?: HiddenButtonProps,
  leftSwipable?: HiddenButtonProps,
  right?: HiddenButtonProps,
  left?: HiddenButtonProps
}

export const HIDDEN_MENU_BUTTONS_WIDTH = 5.5

export function HiddenMenuButtons(props: Props) {
  const { rightSwipable, leftSwipable, left, right } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const rightButtonWidth = !right || !rightSwipable ? styles.fullWidthButton : null
  const leftButtonWidth = !left || !leftSwipable ? styles.fullWidthButton : null

  return (
    <View style={styles.background}>
      <View style={styles.buttons}>
        {left && (
          <TouchableOpacity style={[styles.button, styles[left.type], leftButtonWidth]} onPress={left.onPress}>
            {typeof left.text === 'string' ? <T style={styles.text}>{left.text}</T> : left.text}
          </TouchableOpacity>
        )}
        {leftSwipable && (
          <TouchableOpacity style={[styles.button, styles[leftSwipable.type], leftButtonWidth]} onPress={leftSwipable.onPress}>
            {typeof leftSwipable.text === 'string' ? <T style={styles.text}>{leftSwipable.text}</T> : leftSwipable.text}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.buttons}>
        {rightSwipable && (
          <TouchableOpacity style={[styles.button, styles[rightSwipable.type], rightButtonWidth]} onPress={rightSwipable.onPress}>
            {typeof rightSwipable.text === 'string' ? <T style={styles.text}>{rightSwipable.text}</T> : rightSwipable.text}
          </TouchableOpacity>
        )}
        {right && (
          <TouchableOpacity style={[styles.button, styles[right.type], rightButtonWidth]} onPress={right.onPress}>
            {typeof right.text === 'string' ? <T style={styles.text}>{right.text}</T> : right.text}
          </TouchableOpacity>
        )}
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
  button: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.rem(HIDDEN_MENU_BUTTONS_WIDTH / 2)
  },
  fullWidthButton: {
    width: theme.rem(HIDDEN_MENU_BUTTONS_WIDTH)
  },
  danger: {
    backgroundColor: theme.sliderTabSend
  },
  default: {
    backgroundColor: theme.sliderTabMore
  },
  success: {
    backgroundColor: theme.sliderTabRequest
  },
  text: {
    color: theme.primaryText
  },
  background: {
    alignItems: 'center',
    backgroundColor: theme.secondaryButton,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}))
