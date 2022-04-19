// @flow

import * as React from 'react'
import { TouchableHighlight, TouchableOpacity, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { unpackEdges } from '../../util/edges'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  onPress: () => void | (() => Promise<void>),
  onLongPress?: () => void | (() => Promise<void>),
  highlight?: boolean,
  gradient?: boolean,
  autoHeight?: boolean,
  children?: React.Node,
  underline?: boolean,

  // eslint-disable-next-line react/no-unused-prop-types
  marginRem?: number[] | number,
  // eslint-disable-next-line react/no-unused-prop-types
  paddingRem?: number[] | number
}

export class ClickableRowComponent extends React.PureComponent<Props & ThemeProps> {
  renderContent() {
    const { gradient, children, underline, autoHeight, theme } = this.props
    const styles = getStyles(theme)
    const containerStyles = [styles.rowContainer, spacingStyles(this.props, theme), underline ? styles.underline : null, autoHeight ? styles.autoHeight : null]
    if (gradient) {
      return <Gradient style={containerStyles}>{children}</Gradient>
    }

    return <View style={containerStyles}>{children}</View>
  }

  render() {
    const { onPress, onLongPress, highlight, theme } = this.props

    if (highlight) {
      return (
        <TouchableHighlight onPress={onPress} onLongPress={onLongPress} underlayColor={theme.backgroundGradientColors[0]}>
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

function spacingStyles(props: Props, theme: Theme) {
  const marginRem = unpackEdges(props.marginRem || 0)
  const paddingRem = unpackEdges(props.paddingRem ?? [0, 1])

  return {
    marginBottom: theme.rem(marginRem.bottom),
    marginLeft: theme.rem(marginRem.left),
    marginRight: theme.rem(marginRem.right),
    marginTop: theme.rem(marginRem.top),
    paddingBottom: theme.rem(paddingRem.bottom),
    paddingLeft: theme.rem(paddingRem.left),
    paddingRight: theme.rem(paddingRem.right),
    paddingTop: theme.rem(paddingRem.top)
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
