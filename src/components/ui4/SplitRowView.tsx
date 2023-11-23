import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { Theme, useTheme } from '../services/ThemeContext'

interface Props {
  children: Array<{ left: React.ReactNode; right: React.ReactNode }>
}

/**
 * A view representing rows of data split on the left and right edges of the
 * line. Neither side will exceed 50% of the width of the view.
 **/
export const SplitRowView = (props: Props) => {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={styles.container}>
      {children.map((row, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.leftColumn}>{row.left}</View>
          <View style={styles.rightColumn}>{row.right}</View>
        </View>
      ))}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    flex: 1
  },
  leftColumn: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    flex: 1,
    maxWidth: '50%'
  },
  rightColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: 1,
    maxWidth: '50%'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  }
}))
