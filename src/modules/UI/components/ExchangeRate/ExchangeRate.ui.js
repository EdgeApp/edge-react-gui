import React, { Component } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { dev } from '../../../utils.js'

const styles = StyleSheet.create({
  view: {
    backgroundColor: 'transparent'
  },
  text: {
    color: 'white'
  }
})

const ExchangeRate = ({fiatPerCrypto, fiatCurrencyCode, cryptoDenom}) => {
  return (
    <View style={styles.view}>
      <Text style={styles.text}>{fiatCurrencyCode} {(fiatPerCrypto *  cryptoDenom.multiplier).toFixed(2)} = 1 {cryptoDenom.name}</Text>
    </View>
  )
}

export default connect()(ExchangeRate)
