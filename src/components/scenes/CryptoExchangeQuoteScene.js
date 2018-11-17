// @flow

import type { EdgeSwapQuote } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { ExchangeQuoteComponent } from '../../modules/UI/components/ExchangeQuote/ExchangeQuoteComponent.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
// import FormattedText from '../../components/FormattedText'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import Slider from '../../modules/UI/components/Slider/index'
import { CryptoExchangeQuoteSceneStyles as styles } from '../../styles/indexStyles'
import type { GuiWallet } from '../../types'
import { CircleTimer } from '../common/CircleTimer'

export type QuoteObject = {
  quote: EdgeSwapQuote,
  fromNativeAmount: string,
  fromDisplayAmount: string,
  fromWalletName: string,
  fromWalletCurrencyName: string,
  fromFiat: string,
  toNativeAmount: string,
  toDisplayAmount: string,
  toWalletName: string,
  toWalletCurrencyName: string,
  toFiat: string,
  quoteExpireDate: Date | null,
  fee: string,
  fromCurrencyCode: string,
  toCurrencyCode: string
}
export type OwnProps = {
  quote: QuoteObject
}

type StateProps = {
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
type Props = OwnProps & StateProps
type State = {}

class CryptoExchangeQuoteScreenComponent extends Component<Props, State> {
  componentDidMount = () => {
    global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Quote`)
  }

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
  renderImage = (arg: string) => {
    switch (arg) {
      case 'shapeshift':
        return { uri: 'exchange_logo_shapeshift' }

      case 'bitaccess':
        return { uri: 'exchange_logo_bitaccess' }

      case 'changenow':
        return { uri: 'exchange_logo_changenow' }

      case 'changelly':
      default:
        return { uri: 'exchange_logo_changelly' }
    }
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
            <Image source={this.renderImage(this.props.quote.quote.pluginName)} style={styles.logoImage} />
          </View>
          <View style={styles.centerRow}>
            <ExchangeQuoteComponent
              headline={sprintf(s.strings.exchange_will_be_sent, this.props.quote.fromDisplayAmount, this.props.quote.fromCurrencyCode)}
              walletIcon={this.props.fromCurrencyIcon}
              walletName={this.props.quote.fromWalletName}
              cryptoAmount={this.props.fromDisplayAmount}
              currencyCode={this.props.quote.fromCurrencyCode}
              fiatCurrencyCode={this.props.fromWallet.fiatCurrencyCode}
              fiatCurrencyAmount={this.props.fromBalanceInFiat}
              currency={this.props.quote.fromWalletCurrencyName}
              miningFee={this.props.fee}
              isTop
            />
            <ExchangeQuoteComponent
              headline={sprintf(s.strings.exchange_will_be_received, this.props.quote.toDisplayAmount, this.props.quote.toCurrencyCode)}
              walletIcon={this.props.toCurrencyIcon}
              walletName={this.props.quote.toWalletName}
              currencyCode={this.props.quote.toCurrencyCode}
              fiatCurrencyCode={this.props.toWallet.fiatCurrencyCode}
              fiatCurrencyAmount={this.props.toBalanceInFiat}
              cryptoAmount={this.props.toDisplayAmount}
              currency={this.props.quote.toWalletCurrencyName}
            />
          </View>
          <View style={styles.bottomRow}>
            <FormattedText style={styles.confirmText}>{s.strings.confirm_to_complete_exchange}</FormattedText>
            {this.renderSlider()}
            {this.renderTimer()}
          </View>
        </Gradient>
      </SafeAreaView>
    )
  }
}

export { CryptoExchangeQuoteScreenComponent }
