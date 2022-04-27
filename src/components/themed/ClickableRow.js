// @flow

import * as React from 'react'
import { TouchableHighlight, TouchableOpacity, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  onPress: () => void | (() => Promise<void>),
  onLongPress?: () => void | (() => Promise<void>),
  highlight?: boolean,
  gradient?: boolean,
  autoHeight?: boolean,
  children?: React.Node,
  underline?: boolean,

  marginRem?: number[] | number,
  paddingRem?: number[] | number
}

export class ClickableRowComponent extends React.PureComponent<Props & ThemeProps> {
  renderContent() {
    const { gradient, children, marginRem, paddingRem, underline, autoHeight, theme } = this.props
    const styles = getStyles(theme)
    const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
    const padding = sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))
    const containerStyles = [styles.rowContainer, margin, padding, underline ? styles.underline : null, autoHeight ? styles.autoHeight : null]
    if (gradient) {
      return <Gradient style={containerStyles}>{children}</Gradient>
    }

    return <View style={containerStyles}>{children}</View>
  }

  render() {
    const { onPress, onLongPress, highlight, theme } = this.props

    if (highlight) {
      return (
        <TouchableHighlight onPress={onPress} onLongPress={onLongPress} underlayColor={theme.backgroundGradientLeft}>
          {this.renderContent()}
        </TouchableHighlight>
      )
    }

    return (
      <TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
        {this.renderContent()}
      </TouchableOpacity>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: theme.rem(4.25),
    paddingHorizontal: theme.rem(1)
  },
  underline: {
    borderBottomWidth: theme.thinLineWidth,
    borderBottomColor: theme.lineDivider
  },
  autoHeight: {
    height: 'auto'
  }
}))

export const ClickableRow = withTheme(ClickableRowComponent)
