import * as React from 'react'
import { View } from 'react-native'

import { TransactionListTx } from '../../types/types'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props {
  edgeTransaction: TransactionListTx
}

export function TransactionDetailsTitle(props: Props) {
  const styles = getStyles(useTheme())

  if (props.edgeTransaction == null) return null // Should never happen!?
  const { dateString, time } = props.edgeTransaction

  return (
    <View style={styles.container}>
      <EdgeText style={styles.date}>{dateString}</EdgeText>
      <EdgeText style={styles.time}>{time}</EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: theme.rem(1.5)
  },
  date: {
    fontFamily: theme.fontFaceMedium
  },
  time: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
