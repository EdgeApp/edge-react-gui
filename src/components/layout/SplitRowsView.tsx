import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { Theme, useTheme } from '../services/ThemeContext'

interface Props {
  children: SplitRow[] | SplitRow

  /** @deprecated Only to be used during the UI4 transition */
  marginRem?: number[] | number
}

interface SplitRow {
  left: React.ReactNode
  right: React.ReactNode
}

/**
 * A view representing rows of data split on the left and right edges of the
 * line
 **/
export const SplitRowsView = (props: Props) => {
  const { children, marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))

  const getSplitRow = (row: SplitRow, key?: string) => (
    <View key={key} style={styles.row}>
      <View style={styles.leftColumn}>{row.left}</View>
      <View style={styles.rightColumn}>{row.right}</View>
    </View>
  )

  return (
    <View style={[styles.container, margin]}>
      {Array.isArray(children) ? children.map((row: SplitRow, index: number) => getSplitRow(row, index.toString())) : getSplitRow(children)}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  leftColumn: {
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  rightColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexGrow: 1,
    flexShrink: 1
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  }
}))
