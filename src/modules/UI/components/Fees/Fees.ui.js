/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import * as s from '../../../../locales/strings.js'

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
    const { primaryFee, secondaryFee } = this.props
    return (
      <View style={styles.view}>
        <Text style={styles.label}>{s.strings.string_fee_with_brackets}</Text>

        <Text style={styles.feesInCrypto}>$ + {primaryFee}</Text>

        <Text style={styles.feesInFiat}>b + {secondaryFee}</Text>
      </View>
    )
  }
}
