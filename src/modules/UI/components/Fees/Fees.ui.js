import {View, StyleSheet, Text} from 'react-native'
import React, {Component} from 'react'

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  feesInCrypto: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  secondaryFee: {
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default class Fees extends Component {
  render () {
    const {primaryFee, secondaryFee} = this.props
    return <View style={styles.view}>
      <Text style={styles.label}>
        (Fee)
      </Text>

      <Text style={styles.feesInCrypto}>
        $ + {primaryFee}
      </Text>

      <Text style={styles.feesInFiat}>
        b + {secondaryFee}
      </Text>
    </View>
  }
}
