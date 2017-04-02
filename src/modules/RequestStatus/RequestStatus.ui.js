import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'

class RequestStatus extends Component {

  render () {
    return (
      <View>
        <Text style={styles.container}>Waiting for payment...</Text>
        <Text style={styles.container}>3245.00 b Received</Text>
        <Text style={styles.container}>1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX</Text>
      </View>
    )
  }
}

export default connect()(RequestStatus)
