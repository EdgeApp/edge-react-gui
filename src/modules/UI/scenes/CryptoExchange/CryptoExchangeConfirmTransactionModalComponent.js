// @flow

import React, {Component} from 'react'
import {View, Image, Text} from 'react-native'
import {sprintf} from 'sprintf-js'

import Slider from '../../components/Slider'
import StylizedModal from '../../components/Modal/Modal.ui'
import {Icon} from '../../components/Icon/Icon.ui'
import * as Constants from '../../../../constants/indexConstants'
import s from '../../../../locales/strings.js'
import {GuiWallet} from '../../../../types'
import THEME from '../../../../theme/variables/airbitz'

type Props = {
  style: any,
  fromWallet: GuiWallet,
  toWallet: GuiWallet,
  fromCurrencyIconDark?: string,
  toCurrencyIconDark?: string,
  currencyCode?: string,
  toCurrencyAmount?: string,
  fromCurrencyAmount?: string,
  toCurrencyCode?: string,
  fromCurrencyCode?: string,
  fee: string,
  closeFunction(): void,
  confirmFunction(): void
}
export default class CryptoExchangeConfirmTransactionModalComponent extends Component<Props> {
  render () {
    const style = this.props.style
    const icon = <Icon
      style={style.icon}
      name={Constants.EXCHANGE_ICON}
      size={style.iconSize}
      type={Constants.ION_ICONS}/>

    return <StylizedModal
      visibilityBoolean={true}
      featuredIcon={icon}
      headerText={s.strings.title_confirm_exchange}
      headerTextStyle={{color: THEME.COLORS.PRIMARY, marginTop: -10, marginBottom: 10}}
      modalMiddle={this.renderMiddle(style)}
      modalMiddleStyle={{paddingBottom: 40}}
      modalBottom={this.renderBottom(style)}
      modalBottomStyle={{paddingBottom: 8}}
      onExitButtonFxn={this.props.closeFunction} />
  }

  renderLogo = (style: Object, logo?: string) => {
    if (logo) {
      return <Image style={style.middle.currencyIcon} source={{uri: logo}} />
    }
    return <Text style={style.middle.altCurrencyText}>{this.props.currencyCode}</Text>
  }

  renderMiddle = (style: Object) => {
    const {
      container,
      top,
      topRight,
      topLeft,
      shim,
      bottom,
      bottomLeft,
      bottomRight,
      text
    } = style.middle
    const fromCurrencyAmount = this.props.fromCurrencyAmount ? this.props.fromCurrencyAmount : ''
    const fromCurrencyCode = this.props.fromCurrencyCode ? this.props.fromCurrencyCode : ''
    const fee = this.props.fee || ''
    const {
      fromWallet,
      toWallet
    } = this.props

    return <View style={container}>
      <View style={top}>
        <View style={topLeft}>
          {this.renderLogo(style, this.props.fromCurrencyIconDark)}
        </View>
        <View style={topRight}>
          <Text style={text}>{sprintf(s.strings.string_from_exchange_info, fromCurrencyAmount, fromCurrencyCode, fee, fromWallet.name)}</Text>
        </View>
      </View>

      <View style={shim} />

      <View style={bottom}>
        <View style={bottomLeft}>
          {this.renderLogo(style, this.props.toCurrencyIconDark)}
        </View>

        <View style={bottomRight}>
          <Text style={text}>{sprintf(s.strings.string_to_exchange_info, this.props.toCurrencyAmount, this.props.toCurrencyCode, toWallet.name)}</Text>
        </View>

        <View style={shim} />
        <View style={shim} />
      </View>

    </View>
  }

  renderBottom = (style: Object) => {
    return <View style={style.bottom}>
      <Slider onSlidingComplete={this.props.confirmFunction} sliderDisabled={false}
        parentStyle={{
          backgroundColor: THEME.COLORS.SECONDARY,
          borderRadius: 40,
          marginBottom: 10,
          marginLeft: 0,
          marginRight: 0
        }} />
    </View>
  }
}
