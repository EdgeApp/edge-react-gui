import React, {Component} from 'react'
import {View, Image, Text} from 'react-native'
// import * as UTILS from '../../../utils'
import WalletSelector from '../Header/Component/WalletSelectorConnector'

export default class CryptoExchangeFlipInputWrapperComponent extends Component {

  renderFee (style) {
    if (this.props.fee) {
      return <View style={style.fee} >
        <Text style={style.feeText} >{this.props.fee}</Text>
         </View>
    }
    return null
  }

  render () {
    console.log('WALLET ')
    console.log(this.props.fee) // symbolImage
    const logo = this.props.uiWallet ? this.props.uiWallet.symbolImage : null
    const style = this.props.style
    if (!this.props.uiWallet) {
      return <View style={style.container} />
    }
    return (
      <View style={[style.containerNoFee, this.props.fee && style.container]}>
        <View style={style.topRow}>
        <Image
          style={style.currencyIcon}
          source={{uri: logo}}
        />
        <WalletSelector />
        </View>
        <View style={style.flipInput} />
        {this.renderFee(style)}
      </View>
    )
  }
}
