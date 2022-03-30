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

export const HIDDEN_MENU_BUTTONS_WIDTH = 6.25

export class HiddenMenuButtonsComponent extends React.PureComponent<Props & ThemeProps> {
  renderButton(button?: ButtonProps, fullWidth?: boolean) {
    if (!button || (!button.label && !button.children)) return null

    const styles = getStyles(this.props.theme)
    const { label, color, onPress, children } = button
    return (
      <View style={[styles.button, fullWidth && styles.buttonFullWidth]}>
        <SquareButton label={label} color={color} onPress={onPress}>
          {children}
        </SquareButton>
      </View>
    )
  }

  render() {
    const { rightSwipable, leftSwipable, left, right, isSwipingRight, isSwipingLeft, swipeDirection = null, theme } = this.props
    const styles = getStyles(theme)
    const leftBgColorStyle = leftSwipable && leftSwipable.color ? `${leftSwipable.color}Bg` : null
    const rightBgColorStyle = rightSwipable && rightSwipable.color ? `${rightSwipable.color}Bg` : null

    return (
      <View style={styles.swipeContainer}>
        {(isSwipingRight || swipeDirection === null) && (
          <View style={styles.swipeRowContainer}>
            {this.renderButton(left)}
            <View style={[styles.swipeButton, leftBgColorStyle && styles[leftBgColorStyle]]}>{this.renderButton(leftSwipable, !left)}</View>
          </View>
        )}
        {(isSwipingLeft || swipeDirection === null) && (
          <View style={styles.swipeRowContainer}>
            <View style={[styles.swipeButton, styles.swipeButtonRight, rightBgColorStyle && styles[rightBgColorStyle]]}>
              {this.renderButton(rightSwipable, !right)}
            </View>
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
    justifyContent: 'space-between'
  },
  swipeRowContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%'
  },
  swipeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: '100%'
  },
  swipeButtonRight: {
    alignItems: 'flex-end'
  },
  button: {
    height: '100%',
    width: theme.rem(HIDDEN_MENU_BUTTONS_WIDTH / 2)
  },
  buttonFullWidth: {
    width: theme.rem(HIDDEN_MENU_BUTTONS_WIDTH)
  },
  dangerBg: {
    backgroundColor: theme.sliderTabSend
  },
  successBg: {
    backgroundColor: theme.sliderTabRequest
  },
  defaultBg: {
    backgroundColor: theme.sliderTabMore
  }
}))

export const HiddenMenuButtons = withTheme(HiddenMenuButtonsComponent)
