// @flow

import React, { Component } from 'react'
import { Image, View } from 'react-native'

import ReceivedIcon from '../../../../assets/images/transactions/transaction-details-received.png'
import SentIcon from '../../../../assets/images/transactions/transaction-details-sent.png'
import styles from './style'

export type Props = {
  thumbnailPath: string,
  direction: string
}
export class PayeeIcon extends Component<Props> {
  render () {
    return <View style={[styles.modalHeaderIconWrapBottom]}>{this.renderIcon()}</View>
  }

  renderIcon () {
    if (this.props.thumbnailPath) {
      return <Image source={{ uri: this.props.thumbnailPath }} style={styles.payeeIcon} />
    } else {
      if (this.props.direction === 'receive') {
        return <Image source={ReceivedIcon} style={styles.payeeIcon} />
      } else {
        return <Image source={SentIcon} style={styles.payeeIcon} />
      }
    }
  }
}

export default PayeeIcon
