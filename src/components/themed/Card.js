// @flow

import * as React from 'react'
import { View } from 'react-native'

import { unpackEdges } from '../../util/edges'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  children: React.Node,
  warning?: boolean,
  marginRem?: number[] | number
}

class CardComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { children, warning, theme } = this.props
    const styles = getStyles(theme)

    return <View style={[styles.container, warning ? styles.warning : null, marginRem(this.props, theme)]}>{children}</View>
  }
}

function marginRem(props: Props, theme: Theme) {
  const marginRem = unpackEdges(props.marginRem || [0, 1])

  return {
    marginBottom: theme.rem(marginRem.bottom),
    marginLeft: theme.rem(marginRem.left),
    marginRight: theme.rem(marginRem.right),
    marginTop: theme.rem(marginRem.top)
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(1),
    borderWidth: theme.cardBorder,
    borderColor: theme.cardBorderColor,
    borderRadius: theme.cardBorderRadius
  },
  warning: {
    borderColor: theme.warningIcon
  }
}))

export const Card = withTheme(CardComponent)
