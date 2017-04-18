import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import { Container, Content } from 'native-base'
import { dev } from '../utils.js'

const styles = {
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  text: {
    color: 'white'
  },
  alert: {
    color: 'red'
  }
}

class RequestStatus extends Component {
  constructor (props) {
    super(props)
    this.state = {
      requestAddress: props.requestAddress,
      amountRequestedInCrypto: props.amountRequestedInCrypto,
      amountReceivedInCrypto: props.amountReceivedInCrypto,
      outstandingDebtInCrypto:
        (this.amountReceivedInCrypto - this.amountRequestedInCrypto),
      hasReceivedPayment: true
    }
  }

  isPaymentSufficient = () => {
    return this.state.amountReceivedInCrypto >= this.state.amountRequestedInCrypto
  }

  hasReceivedPartialPayment = () => {
    const status =
      (this.state.hasReceivedPayment === true && this.hasOutstandingDebtInCrypto())

    return status
  }

  hasOutstandingDebtInCrypto = () => {
    return (this.state.amountRequestedInCrypto - this.state.amountReceivedInCrypto) > 0
  }

  getOutstandingDebtInCrypto = () => {
    return (this.state.amountRequestedInCrypto - this.state.amountReceivedInCrypto)
  }

  displayRequestStatus = () => {
    const outstandingDebt =
      <Text style={styles.warning}>
        Outstanding Debt: {this.getOutstandingDebtInCrypto}
      </Text>

    const waitingForPayment =
      <Text style={styles.text}>
        Waiting for payment...
      </Text>

    const displayStatus =
      this.hasReceivedPartialPayment()
      ? outstandingDebt
      : waitingForPayment

    return displayStatus
  }

  render () {
    return (
      <View style={styles.view}>
        {this.displayRequestStatus()}

        <Text style={styles.text}>
          {this.state.amountReceivedInCrypto.toString()} b Received
        </Text>

        <Text style={styles.text}>
          {this.state.requestAddress}
        </Text>
      </View>
    )
  }
}

export default connect()(RequestStatus)
