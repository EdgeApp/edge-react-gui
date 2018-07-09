// @flow

import React, { Component } from 'react'
import { Actions } from 'react-native-router-flux'
import { TouchableWithoutFeedback, View, Image } from 'react-native'
import T from '../../../components/FormattedText'
import style from '../style.js'
import type { GuiWallet } from '../../../../../types'

export type Props = {
  wallet: GuiWallet,
}

export default class BuyCrypto extends Component<Props> {
  getLogo = () => {
    const { wallet } = this.props
    switch (wallet.currencyCode) {
      case 'ETH':
        return wallet.symbolImageDarkMono
      default:
        return wallet.symbolImage
    }
  }
  getCurrencyName = () => {
    const { wallet } = this.props
    return wallet.currencyNames[wallet.currencyCode]
  }
  render () {
    return (
      <TouchableWithoutFeedback onPress={Actions.buysell}>
        <View style={style.buyCryptoContainer}>
          <View style={style.buyCryptoBox}>
            <Image style={style.buyCryptoBoxImage} source={{ uri: this.getLogo() }} resizeMode={'cover'} />
            <T style={style.buyCryptoBoxText}>Buy { this.getCurrencyName() } with Credit Card</T>
          </View>
          <View style={style.buyCryptoNoTransactionBox}>
            <T style={style.buyCryptoNoTransactionText}>No transaction yet!</T>
          </View>
        </View>
      </TouchableWithoutFeedback>
    )
  }
}
