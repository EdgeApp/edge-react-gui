import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import { Container, Content } from 'native-base'
import { dev } from '../../../utils.js'

const styles = {
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white'
  },
  alert: {
    color: 'red'
  }
}

const RequestStatus = (props) => {
  const amountRequestedInCrypto = props.amountSatoshi
  const amountReceivedInCrypto = props.amountSatoshi
  const amountRequestedInFiat = props.amountFiat
  const { publicAddress } = props

  hasReceivedPartialPayment = () => {
    const hasReceivedPartialPayment =
      (hasReceivedPayment() && !isPaymentSufficient())

    return hasReceivedPartialPayment
  }

  hasReceivedPayment = () => {
    const hasReceivedPayment = !!amountReceivedInCrypto

    return hasReceivedPayment
  }

  isPaymentSufficient = () => {
    const isPaymentSufficient =
      amountReceivedInCrypto >= amountRequestedInCrypto

    return isPaymentSufficient
  }

  getOutstandingDebtInCrypto = () => {
    const outstandingDebtInCrypto =
      (amountRequestedInCrypto - amountReceivedInCrypto)

    return outstandingDebtInCrypto
  }

  getDisplayRequestStatus = () => {
    const waitingForPayment =
      <View style={styles.view}>
        <Text style={styles.text}>
          Waiting for payment...
        </Text>

        <Text style={styles.text}>
          {publicAddress}
        </Text>
      </View>

    const partialPaymentReceived =
      <View style={styles.view}>
        <Text style={styles.text}>
          {amountReceivedInCrypto} received
        </Text>

        <Text style={styles.text}>
          {getOutstandingDebtInCrypto()} remaining...
        </Text>

        <Text style={styles.text}>
          {publicAddress}
        </Text>
      </View>

    const displayStatus =
      hasReceivedPartialPayment()
      ? partialPaymentReceived
      : waitingForPayment

    return displayStatus
  }

  return (
    <View style={styles.view}>
      {getDisplayRequestStatus()}
    </View>
  )
}

export default connect(state => ({

  request: state.request

}))(RequestStatus)
