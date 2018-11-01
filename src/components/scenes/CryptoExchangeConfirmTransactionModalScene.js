// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import StylizedModal from '../../modules/UI/components/Modal/Modal.ui'
import Slider from '../../modules/UI/components/Slider/index'
import THEME from '../../theme/variables/airbitz'
import type { GuiWallet } from '../../types'

type CryptoExchangeConfirmTransactionModalOwnProps = {
  style: Object,
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
  confirmFunction(): void,
  pending: boolean
}
export default class CryptoExchangeConfirmTransactionModal extends Component<CryptoExchangeConfirmTransactionModalOwnProps> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    const style = this.props.style
    const icon = <Icon style={style.icon} name={Constants.EXCHANGE_ICON} size={style.iconSize} type={Constants.FONT_AWESOME} />

    return (
      <StylizedModal
        visibilityBoolean={true}
        featuredIcon={icon}
        headerText={s.strings.title_confirm_exchange}
        headerTextStyle={{ color: THEME.COLORS.PRIMARY, marginTop: -10, marginBottom: 10 }}
        modalMiddle={this.renderMiddle(style)}
        modalBottom={this.renderBottom(style)}
        modalBottomStyle={style.bottom}
        onExitButtonFxn={this.props.pending ? null : this.props.closeFunction}
      />
    )
  }

  renderLogo = (style: Object, logo?: string) => {
    if (logo) {
      return <Image style={style.middle.currencyIcon} source={{ uri: logo }} />
    }
    return <Text style={style.middle.altCurrencyText}>{this.props.currencyCode}</Text>
  }

  renderMiddle = (style: Object) => {
    const { container, top, topRight, topLeft, bottom, bottomLeft, bottomRight, text, sliderParent } = style.middle
    const fromCurrencyAmount = this.props.fromCurrencyAmount ? this.props.fromCurrencyAmount : ''
    const fromCurrencyCode = this.props.fromCurrencyCode ? this.props.fromCurrencyCode : ''
    const fee = this.props.fee || ''
    const { fromWallet, toWallet } = this.props

    return (
      <View style={container}>
        <View style={top}>
          <View style={topLeft}>{this.renderLogo(style, this.props.fromCurrencyIconDark)}</View>
          <View style={topRight}>
            <Text style={text}>{sprintf(s.strings.string_from_exchange_info, fromCurrencyAmount, fromCurrencyCode, fee, fromWallet.name)}</Text>
          </View>
        </View>
        <View style={bottom}>
          <View style={bottomLeft}>{this.renderLogo(style, this.props.toCurrencyIconDark)}</View>
          <View style={bottomRight}>
            <Text style={text}>{sprintf(s.strings.string_to_exchange_info, this.props.toCurrencyAmount, this.props.toCurrencyCode, toWallet.name)}</Text>
          </View>
        </View>
        <Slider onSlidingComplete={this.props.confirmFunction} sliderDisabled={this.props.pending} parentStyle={sliderParent} />
      </View>
    )
  }

  renderBottom = (style: Object) => {
    if (this.props.pending) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'small'} />
    }
    return (
      <TouchableOpacity>
        <Text style={style.bottomButton} onPress={this.props.closeFunction}>
          {s.strings.string_cancel_cap}
        </Text>
      </TouchableOpacity>
    )
  }
}
