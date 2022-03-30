// @flow

import * as React from 'react'
import { View } from 'react-native'

import { unpackEdges } from '../../util/edges'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  children: React.Node,
  warning?: boolean,
  // eslint-disable-next-line react/no-unused-prop-types
  marginRem?: number[] | number,
  // eslint-disable-next-line react/no-unused-prop-types
  paddingRem?: number[] | number
}

export class CardComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { children, warning, theme } = this.props
    const styles = getStyles(theme)

    return (
      <View style={styles.wrapper}>
        <View style={[styles.container, warning ? styles.warning : null, spacingStyles(this.props, theme)]}>{children}</View>
      </View>
    )
  }
}

function spacingStyles(props: Props, theme: Theme) {
  const marginRem = unpackEdges(props.marginRem ?? [0, 1])
  const paddingRem = unpackEdges(props.paddingRem ?? 1)

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
  wrapper: {
    width: '100%'
  },
  container: {
    borderWidth: theme.cardBorder,
    borderColor: theme.cardBorderColor,
    borderRadius: theme.cardBorderRadius
  },
  warning: {
    borderColor: theme.warningIcon
  }
}))

export const Card = withTheme(CardComponent)
