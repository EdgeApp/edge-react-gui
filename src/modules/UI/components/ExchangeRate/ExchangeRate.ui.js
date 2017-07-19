import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

const styles = StyleSheet.create({
  view: {
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white'
  }
})

const ExchangeRate = ({fiatPerCrypto, fiatCurrencyCode, cryptoDenom}) => {
  const text = fiatPerCrypto === 0
    ? <Text style={styles.text}>Exchange Rate loading...</Text>
    : <Text style={styles.text}>
      1 {cryptoDenom.name} = {fiatCurrencyCode} {(fiatPerCrypto * cryptoDenom.multiplier).toFixed(2)}
    </Text>

  return (
    <View style={styles.view}>{text}</View>
  )
}

export default connect()(ExchangeRate)
