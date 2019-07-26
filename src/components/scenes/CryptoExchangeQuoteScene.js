// @flow

import type { EdgeAccount } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, Linking, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { swapPluginLogos } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { ExchangeQuoteComponent } from '../../modules/UI/components/ExchangeQuote/ExchangeQuoteComponent.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import Slider from '../../modules/UI/components/Slider/index'
import { styles } from '../../styles/scenes/CryptoExchangeQuoteSceneStyles.js'
import { type GuiSwapInfo } from '../../types/types.js'
import { CircleTimer } from '../common/CircleTimer'
import { launchModal } from '../common/ModalProvider.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { createKYCAlertModal } from '../modals/KYCAlertModal'

export type OwnProps = {
  swapInfo: GuiSwapInfo
}
export type StateProps = {
  account: EdgeAccount,
  fromCurrencyIcon: string,
  fromDenomination: string,
  fromWalletCurrencyName: string,
  pending: boolean,
  toCurrencyIcon: string,
  toDenomination: string,
  toWalletCurrencyName: string
}
export type DispatchProps = {
  shift(swapInfo: GuiSwapInfo): mixed,
  timeExpired(swapInfo: GuiSwapInfo): void
}

type Props = OwnProps & StateProps & DispatchProps
type State = {}

class CryptoExchangeQuoteScreenComponent extends Component<Props, State> {
  componentDidMount = () => {
    this.checkForKYC()
    global.firebase && global.firebase.analytics().logEvent(`Exchange_Shift_Quote`)
  }

  renderSlider = () => {
    const { pending, shift, swapInfo } = this.props
    if (pending) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'small'} />
    }
    return <Slider onSlidingComplete={() => shift(swapInfo)} sliderDisabled={pending} parentStyle={styles.slideContainer} />
  }
  renderTimer = () => {
    const { swapInfo, timeExpired } = this.props
    const { expirationDate } = swapInfo.quote

    if (!expirationDate) return null
    return <CircleTimer style={styles.timerContainer} timeExpired={() => timeExpired(swapInfo)} expiration={expirationDate} />
  }

  checkForKYC = () => {
    const { account, swapInfo } = this.props
    const { pluginName } = swapInfo.quote
    const componentProps = {
      aboutText: '',
      acceptText: '',
      termsText: '',
      privacyText: '',
      amlText: ''
    }
    switch (pluginName) {
      case 'changelly':
        console.log('KYC: settings', account.swapConfig[pluginName])
        if (!account.swapConfig[pluginName].userSettings || !account.swapConfig[pluginName].userSettings.agreedToTerms) {
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
        logo: swapPluginLogos[pluginName],
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
      launchModal(modal).then((response: null) => {})
    }
  }
  viewPrivacy = () => {
    const { swapInfo } = this.props
    const { pluginName } = swapInfo.quote
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
    const { swapInfo } = this.props
    const { pluginName } = swapInfo.quote
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
    const { swapInfo } = this.props
    const { pluginName } = swapInfo.quote
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
    const { account, swapInfo } = this.props
    const { pluginName } = swapInfo.quote
    await account.swapConfig[pluginName].changeUserSettings({ agreedToTerms: true })
  }

  render () {
    const { fromCurrencyIcon, fromDenomination, fromWalletCurrencyName, swapInfo, toCurrencyIcon, toDenomination, toWalletCurrencyName } = this.props
    const { fee, fromDisplayAmount, fromFiat, toDisplayAmount, toFiat } = swapInfo
    const { isEstimate, pluginName } = swapInfo.quote
    const { fromWallet, toWallet } = swapInfo.request

    return (
      <SceneWrapper>
        <View style={styles.topRow}>
          <Image source={swapPluginLogos[pluginName]} resizeMode={'contain'} style={styles.logoImage} />
        </View>
        <View style={styles.centerRow}>
          <ExchangeQuoteComponent
            cryptoAmount={fromDisplayAmount}
            currency={fromWalletCurrencyName}
            currencyCode={fromDenomination}
            fiatCurrencyAmount={fromFiat}
            fiatCurrencyCode={fromWallet.fiatCurrencyCode.replace('iso:', '')}
            headline={sprintf(s.strings.exchange_will_be_sent, fromDisplayAmount, fromDenomination)}
            isTop
            miningFee={fee}
            walletIcon={fromCurrencyIcon}
            walletName={fromWallet.name || ''}
          />
          <ExchangeQuoteComponent
            cryptoAmount={toDisplayAmount}
            currency={toWalletCurrencyName}
            currencyCode={toDenomination}
            fiatCurrencyAmount={toFiat}
            fiatCurrencyCode={toWallet.fiatCurrencyCode.replace('iso:', '')}
            headline={sprintf(s.strings.exchange_will_be_received, toDisplayAmount, toDenomination)}
            isEstimate={isEstimate}
            walletIcon={toCurrencyIcon}
            walletName={toWallet.name || ''}
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
