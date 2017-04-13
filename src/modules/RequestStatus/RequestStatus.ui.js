import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import { Container, Content } from 'native-base'
import { dev } from '../utils.js'

const styles = {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
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
    const displayStatus =
      this.hasReceivedPartialPayment()
      ? <Text>Outstanding Debt: {this.getOutstandingDebtInCrypto}</Text>
      : <Text>Waiting for payment...</Text>

    return displayStatus
  }

  render () {
    return (
      <View style={styles.view}>
        {this.displayRequestStatus()}
        <Text>{this.state.amountReceivedInCrypto.toString()} b Received</Text>
        <Text>{this.state.requestAddress}</Text>
      </View>
    )
  }
}

export default connect()(RequestStatus)
