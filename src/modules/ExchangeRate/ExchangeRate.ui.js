import React, { Component } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
// import styles from './styles.js'
import { Container, Content } from 'native-base'
import { dev } from '../utils.js'

const styles = StyleSheet.create({
  view: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {}
})

const ExchangeRate = ({fiatPerCrypto}) => {
  return (
    <View style={styles.view}>
      <Text style={styles.text}>$ {fiatPerCrypto} = 1000 bits</Text>
    </View>
  )
}

export default connect()(ExchangeRate)
