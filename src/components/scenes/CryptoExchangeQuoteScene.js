// @flow

import { showModal } from 'edge-components'
import type { EdgeAccount, EdgeSwapQuote } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, Linking, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import s from '../../locales/strings.js'
import { ExchangeQuoteComponent } from '../../modules/UI/components/ExchangeQuote/ExchangeQuoteComponent.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import Slider from '../../modules/UI/components/Slider/index'
import { styles } from '../../styles/scenes/CryptoExchangeQuoteSceneStyles.js'
import type { GuiWallet } from '../../types'
import { CircleTimer } from '../common/CircleTimer'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { createKYCAlertModal } from '../modals/KYCAlertModal'

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
  account: EdgeAccount,
  shift(): void,
  timeExpired(): void
}
type Props = OwnProps & StateProps
type State = {}

class CryptoExchangeQuoteScreenComponent extends Component<Props, State> {
  componentDidMount = () => {
    this.checkForKYC()
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

      case 'changenow':
        return { uri: 'exchange_logo_changenow' }

      case 'faast':
        return { uri: 'exchange_logo_faast' }

      case 'changelly':
      default:
        return { uri: 'exchange_logo_changelly' }
    }
  }
  checkForKYC = () => {
    const pluginName = this.props.quote.quote.pluginName
    const componentProps = {
      aboutText: '',
      acceptText: '',
      termsText: '',
      privacyText: '',
      amlText: ''
    }
    switch (pluginName) {
      case 'changelly':
        console.log('KYC: settings', this.props.account.swapConfig[pluginName])
        if (!this.props.account.swapConfig[pluginName].userSettings || !this.props.account.swapConfig[pluginName].userSettings.agreedToTerms) {
          componentProps.aboutText = s.strings.changelly_about
          componentProps.acceptText = s.strings.changelly_kyc_statement
          componentProps.termsText = s.strings.terms_of_use
          componentProps.privacyText = s.strings.privacy_policy
          componentProps.amlText = s.strings.changelly_aml_kyc
        }
        break
    }
    if (componentProps.aboutText !== '') {
      const modal = createKYCAlertModal({
        logo: this.renderImage(pluginName),
        aboutText: componentProps.aboutText,
        acceptText: componentProps.acceptText,
        termsText: componentProps.termsText,
        privacyText: componentProps.privacyText,
        amlText: componentProps.amlText,
        onAccept: this.acceptKYCWarning,
        termsClick: this.viewTerms,
        privacyClick: this.viewPrivacy,
        amlClick: this.viewAML
      })
      showModal(modal).then((response: null) => {})
    }
  }
  viewPrivacy = () => {
    const pluginName = this.props.quote.quote.pluginName
    let url = null
    switch (pluginName) {
      case 'changelly':
        url = 'https://changelly.com/privacy-policy'
        break
    }
    if (url) {
      Linking.openURL(url)
    }
  }
  viewAML = () => {
    const pluginName = this.props.quote.quote.pluginName
    let url = null
    switch (pluginName) {
      case 'changelly':
        url = 'https://changelly.com/aml-kyc'
        break
    }
    if (url) {
      Linking.openURL(url)
    }
  }
  viewTerms = () => {
    const pluginName = this.props.quote.quote.pluginName
    let url = null
    switch (pluginName) {
      case 'changelly':
        url = 'https://changelly.com/terms-of-use'
        break
    }
    if (url) {
      Linking.openURL(url)
    }
  }
  acceptKYCWarning = async () => {
    const pluginName = this.props.quote.quote.pluginName
    await this.props.account.swapConfig[pluginName].changeUserSettings({ agreedToTerms: true })
  }

  render () {
    const isEstimate = this.props.quote.quote.isEstimate
    if (!this.props.fromWallet) {
      return null
    }

    return (
      <SceneWrapper>
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
            isEstimate={isEstimate}
          />
        </View>
        <View style={styles.confirmTextRow}>
          <FormattedText style={styles.confirmText}>{s.strings.confirm_to_complete_exchange}</FormattedText>
        </View>
        <View style={styles.bottomRow}>
          {this.renderSlider()}
          {this.renderTimer()}
        </View>
      </SceneWrapper>
    )
  }
}

export { CryptoExchangeQuoteScreenComponent }
