import React, {Component} from 'react'
import {View, Image, Text} from 'react-native'
import ExchangedFlipInput from './ExchangedFlipInput'
import {TextAndIconButton} from '../Buttons'
import * as Constants from '../../../../constants/indexConstants'
import type {FlipInputFieldInfo} from '../FlipInput/FlipInput.ui'
import {GuiWallet} from '../../../../types'
import type {AbcCurrencyWallet} from 'airbitz-core-types'
import * as UTILS from '../../../utils'

type Props = {
  style: any,
  fee: string,
  uiWallet: GuiWallet,
  currencyCode: string,
  whichWallet: string,
  abcWallet: AbcCurrencyWallet,
  primaryInfo: FlipInputFieldInfo,
  secondaryInfo: FlipInputFieldInfo,
  fiatPerCrypto: number,
  nativeAmount: string
}

export default class CryptoExchangeFlipInputWrapperComponent extends Component<Props> {

  renderFee (style: any) {
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

  onAmountsChange = ({primaryDisplayAmount}: {primaryDisplayAmount: string, secondaryDisplayAmount: string}) => {
    const primaryNativeToDenominationRatio = this.props.primaryInfo.displayDenomination.multiplier.toString()
    const primaryNativeAmount = UTILS.convertDisplayToNative(primaryNativeToDenominationRatio)(primaryDisplayAmount)

    if (primaryNativeAmount != this.props.nativeAmount) {
      const {whichWallet, primaryInfo} = this.props
      const data = {
        primaryNativeAmount,
        primaryDisplayAmount,
        whichWallet,
        primaryInfo
      }
      console.log(this.props.whichWallet+' !==== Calling ')
      this.props.setNativeAmount(data)
    }


  }

  renderLogo = (style: any, logo: string) => {
    if (logo) {
      return <View style={style.iconContainer}>
      <Image style={style.currencyIcon} source={{uri: logo}} />
    </View>
    }
    return <View style={style.altIconContainer}>
    <Text style={style.altCurrencyText}>{this.props.currencyCode}</Text>
  </View>
  }

  render () {
    const style = this.props.style
    if (!this.props.uiWallet) {
      return <View style={style.container} />
    }
    const {
      primaryInfo,
      secondaryInfo,
      fiatPerCrypto,
      nativeAmount,
      currencyCode
    } = this.props
    return (
      <View style={[style.containerNoFee, this.props.fee && style.container]}>
        <View style={style.topRow}>
            <TextAndIconButton
              style={style.walletSelector}
              onPress={this.launchSelector}
              icon={Constants.KEYBOARD_ARROW_DOWN}
              title={this.props.uiWallet.name+':'+currencyCode}
            />
          </View>
          {this.renderLogo(style, this.props.currencyLogo)}

        <View style={style.flipInput} >
        <ExchangedFlipInput
          primaryInfo={{...primaryInfo, nativeAmount}}
          secondaryInfo={secondaryInfo}
          secondaryToPrimaryRatio={fiatPerCrypto}
          onAmountsChange={this.onAmountsChange}
          color={style.flipInputColor} />
        </View>
        {this.renderFee(style)}
      </View>
    )
  }
}
