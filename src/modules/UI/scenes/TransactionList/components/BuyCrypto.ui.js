/* eslint-disable flowtype/require-valid-file-annotation */

import React, { Component } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import T from '../../../components/FormattedText'
import style from '../style.js'

export default class BuyCrypto extends Component {
  render () {
    return (
      <TouchableWithoutFeedback onPress={Actions.buysell}>
        <View style={style.buyCryptoContainer}>
          <View style={style.buyCryptoBox} />
          <View style={style.buyCryptoNoTransactionBox}>
            <T style={style.buyCryptoNoTransactionText}>No transaction yet!</T>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}
