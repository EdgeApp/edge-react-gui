import React, {Component} from 'react'
import {View, Image, Text} from 'react-native'
import ExchangedFlipInput from './ExchangedFlipInput'
import {TextAndIconButton} from '../Buttons'
import * as Constants from '../../../../constants/indexConstants'
// import * as UTILS from '../../../utils'
// import WalletSelector from '../Header/Component/WalletSelectorConnector'

export default class CryptoExchangeFlipInputWrapperComponent extends Component {
  renderFee (style) {
    if (this.props.fee) {
      return (
        <View style={style.fee}>
          <Text style={style.feeText}>{this.props.fee}</Text>
        </View>
      )
    }
    return null
  }

  launchSelector = () => {
    this.props.launchWalletSelector(this.props.whichWallet)
  }

  onAmountsChange = () => {

  }

  render () {
    const logo = this.props.uiWallet ? this.props.uiWallet.symbolImage : null
    const style = this.props.style
    if (!this.props.uiWallet) {
      return <View style={style.container} />
    }
    const {
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto,
      nativeAmount
    } = this.props
    const color = 'white' // TODO: Update with Kevins color and theme
    return (
      <View style={[style.containerNoFee, this.props.fee && style.container]}>
        <View style={style.topRow}>
            <TextAndIconButton
              style={style.walletSelector}
              onPress={this.launchSelector}
              icon={Constants.KEYBOARD_ARROW_DOWN}
              title={this.props.uiWallet.name}
            />
          </View>
          <View style={style.iconContainer}>
            <Image style={style.currencyIcon} source={{uri: logo}} />
          </View>
        <View style={style.flipInput} >
        <ExchangedFlipInput
          primaryInfo={{...primaryInfo, nativeAmount}}
          secondaryInfo={secondaryInfo}
          secondaryToPrimaryRatio={fiatPerCrypto}
          onAmountsChange={this.onAmountsChange}
          color={color} />
        </View>
        {this.renderFee(style)}
      </View>
    )
  }
}
