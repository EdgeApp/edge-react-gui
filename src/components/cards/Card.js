// @flow

import * as React from 'react'
import { View } from 'react-native'

import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  children: React.Node,
  warning?: boolean,
  marginRem?: number[] | number,
  paddingRem?: number[] | number
}

export class CardComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { children, marginRem, paddingRem, warning, theme } = this.props
    const styles = getStyles(theme)
    const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
    const padding = sidesToPadding(mapSides(fixSides(paddingRem, 1), theme.rem))

    return (
      <View style={styles.wrapper}>
        <View style={[styles.container, warning ? styles.warning : null, margin, padding]}>{children}</View>
      </View>
    )
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
