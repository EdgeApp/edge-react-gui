import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {View, Image, Text} from 'react-native'
import ExchangedFlipInput from './ExchangedFlipInput'
import {TextAndIconButton} from '../Buttons'
import * as Constants from '../../../../constants/indexConstants'
import {GuiWallet, GuiCurrencyInfo} from '../../../../types'

type Props = {
  style: any,
  fee: string,
  uiWallet: GuiWallet,
  primaryInfo: GuiCurrencyInfo,
  secondaryInfo: GuiCurrencyInfo,
  fiatPerCrypto: number,
  nativeAmount: number
}

export default class CryptoExchangeFlipInputWrapperComponent extends Component<Props> {
  static propTypes = {
    style: PropTypes.object.isRequired,
    uiWallet: PropTypes.instanceOf.GuiWallet,
    primaryInfo: PropTypes.instanceOf.GuiCurrencyInfo,
    secondaryInfo: PropTypes.instanceOf.GuiCurrencyInfo,
    fiatPerCrypto: PropTypes.number,
    nativeAmount: PropTypes.number,
    fee: PropTypes.string
  }
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
          color={style.flipInputColor} />
        </View>
        {this.renderFee(style)}
      </View>
    )
  }
}
