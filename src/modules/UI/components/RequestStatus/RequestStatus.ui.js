import React from 'react'
import { Text, View } from 'react-native'
import T from '../FormattedText/'
import { connect } from 'react-redux'
import { border as b } from '../../../utils.js'

const styles = {
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white',
    margin: 10
  },
  alert: {
    color: 'red'
  }
}

const RequestStatus = (props) => {
  console.log('inside RequestStatus, props is: ', props)
  const amountRequestedInCrypto = props.amountSatoshi
  const amountReceivedInCrypto = props.amountSatoshi
  const { publicAddress } = props
  const requestAddress = props.requestAddress
  console.log('inside RequestStatus #2, props is: ', props, ' publicAddress is : ', publicAddress)

  const hasReceivedPartialPayment = () => {
    const hasReceivedPartialPayment =
      (hasReceivedPayment() && !isPaymentSufficient())

    return hasReceivedPartialPayment
  }

  const hasReceivedPayment = () => {
    const hasReceivedPayment = !!amountReceivedInCrypto

    return hasReceivedPayment
  }

  const isPaymentSufficient = () => {
    const isPaymentSufficient =
      amountReceivedInCrypto >= amountRequestedInCrypto

    return isPaymentSufficient
  }

  const getOutstandingDebtInCrypto = () => {
    const outstandingDebtInCrypto =
      (amountRequestedInCrypto - amountReceivedInCrypto)

    return outstandingDebtInCrypto
  }

  const getDisplayRequestStatus = () => {
    const waitingForPayment =
      <View style={styles.view}>
        <Text style={styles.text}>
          Waiting for payment...
        </Text>

        <T numberOfLines={1} ellipsizeMode='middle' style={[b(), styles.text]}>
          {requestAddress}
        </T>
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
          {requestAddress}
        </Text>
      </View>

    const displayStatus =
      hasReceivedPartialPayment()
      ? partialPaymentReceived
      : waitingForPayment

    return displayStatus
  }

  console.log('in RequestStatus.ui, this.props is: ', this)
  return (
    <View style={styles.view}>
      {getDisplayRequestStatus()}
    </View>
  )
}

const mapStateToProps = state => ({
  request: state.request
})

export default connect(mapStateToProps)(RequestStatus)
