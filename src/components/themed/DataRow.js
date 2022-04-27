// @flow

import * as React from 'react'
import { View } from 'react-native'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  label: React.Node,
  value: React.Node,
  marginRem?: number[] | number
}

export class DataRowComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { label, marginRem, value, theme } = this.props
    const styles = getStyles(theme)

    const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))

    return (
      <View style={[styles.row, margin]}>
        <View style={styles.label}>{label}</View>
        <View style={styles.value}>{value}</View>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  value: {
    marginLeft: theme.rem(0.25),
    textAlign: 'right'
  }
}))

export const DataRow = withTheme(DataRowComponent)
