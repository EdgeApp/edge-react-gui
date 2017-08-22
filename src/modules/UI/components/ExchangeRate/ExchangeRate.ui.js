import React, { Component } from 'react'
import { Text, View, StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  view: {
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white'
  }
})

export default class ExchangeRate extends Component {
  render () {
    return (
      <View style={styles.view}>
        {
          this.props.fiatPerCrypto === 0
          ? <Text style={styles.text}>Exchange Rate loading...</Text>
          : <Text style={styles.text}>
            1 {this.props.primaryInfo.displayDenomination.name} = {this.props.secondaryInfo.displayDenomination.symbol} {this.props.fiatPerCrypto.toFixed(this.props.secondaryInfo.displayDenomination.precision)} {this.props.secondaryInfo.displayDenomination.currencyCode}
          </Text>
        }
      </View>
    )
  }
}
