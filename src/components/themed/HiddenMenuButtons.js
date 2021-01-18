// @flow

import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import type { ThemeProps } from '../services/ThemeContext'
import { type Theme, withTheme } from '../services/ThemeContext.js'
import { SquareButton } from './ThemedButtons'

type ButtonProps = {
  label?: string,
  children?: React.Node,
  color: 'success' | 'danger' | 'default',
  onPress: () => void | Promise<void>
}

type Props = {
  rightSwipable?: ButtonProps,
  leftSwipable?: ButtonProps,
  right?: ButtonProps,
  left?: ButtonProps,
  isSwipingRight?: boolean,
  isSwipingLeft?: boolean,
  swipeDirection?: 'left' | 'right' | null
}

export const HIDDEN_MENU_BUTTONS_WIDTH = 5.5

class HiddenMenuButtonsComponent extends React.PureComponent<Props & ThemeProps> {
  renderButton(button?: ButtonProps) {
    if (!button || (!button.label && !button.children)) return null

    const { label, color, onPress, children } = button
    return (
      <SquareButton label={label} color={color} onPress={onPress}>
        {children}
      </SquareButton>
    )
  }

  render() {
    const { rightSwipable, leftSwipable, left, right, isSwipingRight, isSwipingLeft, swipeDirection = null, theme } = this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.swipeContainer}>
        {(isSwipingRight || swipeDirection === null) && (
          <View style={styles.swipeRowContainer}>
            {this.renderButton(left)}
            {this.renderButton(leftSwipable)}
          </View>
        )}
        {(isSwipingLeft || swipeDirection === null) && (
          <View style={styles.swipeRowContainer}>
            {this.renderButton(rightSwipable)}
            {this.renderButton(right)}
          </View>
        )}
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  swipeContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.rem(1 / 16)
  },
  swipeRowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '100%',
    width: theme.rem(HIDDEN_MENU_BUTTONS_WIDTH)
  }
}))

export const HiddenMenuButtons = withTheme(HiddenMenuButtonsComponent)
