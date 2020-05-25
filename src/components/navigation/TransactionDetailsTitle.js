// @flow

import { type EdgeTransaction } from 'edge-core-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'

import T from '../../modules/UI/components/FormattedText/index.js'
import { THEME } from '../../theme/variables/airbitz.js'

type Props = {
  edgeTransaction: EdgeTransaction
}

export function TransactionDetailsTitle(props: Props) {
  if (props.edgeTransaction == null) return null // Should never happen!?

  const { date } = props.edgeTransaction
  const txDate = new Date(date * 1000)
  const dateString = txDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  const time = txDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })

  return (
    <View style={styles.transactionDetailsDateTimeContainer}>
      <T style={styles.transactionDetailsDate}>{dateString}</T>
      <T style={styles.transactionDetailsTime}>{time}</T>
    </View>
  )
}

const rawStyles = {
  transactionDetailsDateTimeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%'
  },
  transactionDetailsDate: {
    fontSize: THEME.rem(1),
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  transactionDetailsTime: {
    fontSize: THEME.rem(0.6875),
    color: THEME.COLORS.HEADER_TEXT_SECONDARY,
    fontFamily: THEME.FONTS.DEFAULT
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
