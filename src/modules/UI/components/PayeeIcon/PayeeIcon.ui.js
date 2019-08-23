// @flow

import React from 'react'
import { Image, StyleSheet } from 'react-native'

import ReceivedIcon from '../../../../assets/images/transactions/transaction-details-received.png'
import SentIcon from '../../../../assets/images/transactions/transaction-details-sent.png'
import { THEME } from '../../../../theme/variables/airbitz.js'
import { scale } from '../../../../util/scaling.js'

export type Props = {
  thumbnailPath: string,
  direction: string
}
export function PayeeIcon (props: Props) {
  if (props.thumbnailPath) {
    return <Image source={{ uri: props.thumbnailPath }} style={styles.payeeIcon} />
  }

  const source = props.direction === 'receive' ? ReceivedIcon : SentIcon
  return <Image source={source} style={styles.payeeIcon} />
}

const styles = StyleSheet.create({
  payeeIcon: {
    alignSelf: 'center',
    position: 'absolute',
    top: scale(-24),
    backgroundColor: THEME.COLORS.WHITE,
    borderRadius: scale(24),
    height: scale(48),
    width: scale(48)
  }
})
