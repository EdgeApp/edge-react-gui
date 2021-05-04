// @flow

import * as React from 'react'
import { View } from 'react-native'

import { unpackEdges } from '../../util/edges'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'

type Props = {
  image?: React.Node,
  label: React.Node,
  value: React.Node,
  marginRem?: number[] | number
}

class DataRowComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { label, value, theme } = this.props
    const styles = getStyles(theme)

    return (
      <View style={[styles.row, marginRem(this.props, theme)]}>
        <View style={styles.label}>{label}</View>
        <View style={styles.value}>{value}</View>
      </View>
    )
  }
}

function marginRem(props: Props, theme: Theme) {
  const marginRem = unpackEdges(props.marginRem || 0)

  return {
    marginBottom: theme.rem(marginRem.bottom),
    marginLeft: theme.rem(marginRem.left),
    marginRight: theme.rem(marginRem.right),
    marginTop: theme.rem(marginRem.top)
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  label: {
    flex: 1,
    marginRight: theme.rem(0.75)
  },
  value: {
    marginLeft: theme.rem(0.5),
    textAlign: 'right'
  }
}))

export const DataRow = withTheme(DataRowComponent)
