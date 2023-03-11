import { useRoute } from '@react-navigation/native'
import * as React from 'react'
import { View } from 'react-native'

import { RouteProp } from '../../types/routerTypes'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export function TransactionDetailsTitle() {
  const route = useRoute<RouteProp<'transactionDetails'>>()
  const { edgeTransaction } = route.params
  const styles = getStyles(useTheme())

  if (edgeTransaction == null) return null // Should never happen!?
  if (!('dateString' in edgeTransaction)) return null
  const { dateString, time } = edgeTransaction

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
