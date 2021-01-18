// @flow

import * as React from 'react'
import { TouchableHighlight, TouchableOpacity, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  onPress: () => void | (() => Promise<void>),
  highlight?: boolean,
  gradient?: boolean,
  children?: React.Node
}

class ClickableRowComponent extends React.PureComponent<Props & ThemeProps> {
  renderContent() {
    const { gradient, children, theme } = this.props
    const styles = getStyles(theme)
    if (gradient) {
      return <Gradient style={styles.rowContainer}>{children}</Gradient>
    }

    return <View style={styles.rowContainer}>{children}</View>
  }

  render() {
    const { onPress, highlight, theme } = this.props

    if (highlight) {
      return (
        <TouchableHighlight onPress={onPress} underlayColor={theme.backgroundGradientLeft}>
          {this.renderContent()}
        </TouchableHighlight>
      )
    }

    return <TouchableOpacity onPress={onPress}>{this.renderContent()}</TouchableOpacity>
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: theme.rem(4.25),
    paddingHorizontal: theme.rem(1)
  }
}))

export const ClickableRow = withTheme(ClickableRowComponent)
