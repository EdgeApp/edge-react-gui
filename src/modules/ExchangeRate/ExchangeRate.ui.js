import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './styles.js'

const ExchangeRate = ({crypto, fiat}) => {
  return (
    <View>
      <Text style={styles.container}>$ {fiat} = B {crypto}</Text>
    </View>
  )
}

export default connect()(ExchangeRate)
