// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import shapeShiftLogo from '../../../../assets/images/shapeShiftLogo.png'
import { CircleTimer } from '../../../../components/CircleTimer'
import s from '../../../../locales/strings.js'
import { ExchangeQuoteComponent } from '../../../../modules/UI/components/ExchangeQuote/ExchangeQuoteComponent.js'
import { CryptoExchangeQuoteSceneStyles as styles } from '../../../../styles/indexStyles'
import type { GuiWallet } from '../../../../types'
import Gradient from '../../../UI/components/Gradient/Gradient.ui'
import FormattedText from '../../components/FormattedText'
// import FormattedText from '../../components/FormattedText'
import SafeAreaView from '../../components/SafeAreaView'
import Slider from '../../components/Slider'

type Props = {
  pending: boolean,
  fromWallet: GuiWallet,
  toWallet: GuiWallet,
  fromNativeAmount: string,
  fromFiatToCrypto: string,
  fromBalanceInFiat: string,
  fromCurrencyCode: string,
  toCurrencyCode: string,
  fromDisplayAmount: string,
  toDisplayAmount: string,
  fromCurrencyIcon: string,
  toCurrencyIcon: string,
  toNativeAmount: string,
  toBalanceInFiat: string,
  quoteExpireDate: Date | null,
  fee: string,
  shift(): void,
  timeExpired(): void
}
type State = {}

class CryptoExchangeQuoteScreenComponent extends Component<Props, State> {
  renderSlider = () => {
    if (this.props.pending) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'small'} />
    }
    return <Slider onSlidingComplete={this.props.shift} sliderDisabled={this.props.pending} parentStyle={styles.slideContainer} />
  }
  renderTimer = () => {
    if (this.props.quoteExpireDate) {
      return <CircleTimer style={styles.timerContainer} timeExpired={this.props.timeExpired} expiration={this.props.quoteExpireDate} />
    }
    return null
  }

  render () {
    if (!this.props.fromWallet) {
      return null
    }
    console.log('stop')
    return (
      <SafeAreaView>
        <Gradient style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.topRow}>
            <Image source={shapeShiftLogo} style={styles.logoImage} />
          </View>
          <View style={styles.centerRow}>
            <ExchangeQuoteComponent
              headline={sprintf(s.strings.exchange_will_be_sent, this.props.fromDisplayAmount, this.props.fromCurrencyCode)}
              walletIcon={this.props.fromCurrencyIcon}
              walletName={this.props.fromWallet.name}
              cryptoAmount={this.props.fromDisplayAmount}
              currencyCode={this.props.fromCurrencyCode}
              fiatCurrencyCode={this.props.fromWallet.fiatCurrencyCode}
              fiatCurrencyAmount={this.props.fromBalanceInFiat}
              currency={this.props.fromWallet.currencyNames[this.props.fromWallet.currencyCode]}
              miningFee={this.props.fee}
              isTop
            />
            <ExchangeQuoteComponent
              headline={sprintf(s.strings.exchange_will_be_received, this.props.toDisplayAmount, this.props.toCurrencyCode)}
              walletIcon={this.props.toCurrencyIcon}
              walletName={this.props.toWallet.name}
              currencyCode={this.props.toCurrencyCode}
              fiatCurrencyCode={this.props.toWallet.fiatCurrencyCode}
              fiatCurrencyAmount={this.props.toBalanceInFiat}
              cryptoAmount={this.props.toDisplayAmount}
              currency={this.props.toWallet.currencyNames[this.props.toWallet.currencyCode]}
            />
          </View>
          <View style={styles.bottomRow}>
            <FormattedText style={styles.confirmText}>{s.strings.confirm_with_shapeshift}</FormattedText>
            {this.renderSlider()}
            {this.renderTimer()}
          </View>
        </Gradient>
      </SafeAreaView>
    )
  }
}

export { CryptoExchangeQuoteScreenComponent }
