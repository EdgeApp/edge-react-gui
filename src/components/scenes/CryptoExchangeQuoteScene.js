// @flow

import { type EdgeAccount } from 'edge-core-js/types'
import React, { Component } from 'react'
import { ActivityIndicator, Image, ScrollView, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { swapPluginLogos } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { ExchangeQuoteComponent } from '../../modules/UI/components/ExchangeQuote/ExchangeQuoteComponent.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import Slider from '../../modules/UI/components/Slider/index'
import { styles } from '../../styles/scenes/CryptoExchangeQuoteSceneStyles.js'
import { type GuiSwapInfo } from '../../types/types.js'
import { trackEvent } from '../../util/tracking.js'
import { CircleTimer } from '../common/CircleTimer'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal.js'
import { showError } from '../services/AirshipInstance.js'

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
  calledApprove: true

  componentDidMount = () => {
    const { swapInfo } = this.props
    const { pluginName } = swapInfo.quote
    if (pluginName === 'changelly') {
      this.checkChangellyKYC().catch(showError)
    } else if (pluginName === 'changenow') {
      this.checkChangeNowKYC().catch(showError)
    } else if (pluginName === 'coinswitch') {
      this.checkCoinswitchKYC().catch(showError)
    } else if (pluginName === 'foxExchange') {
      this.checkFoxExchangeKYC().catch(showError)
    }
    trackEvent('SwapQuote')
  }

  componentWillUnmount () {
    const { swapInfo } = this.props
    if (!this.calledApprove) swapInfo.quote.close()
  }

  doShift = () => {
    const { shift, swapInfo } = this.props
    this.calledApprove = true
    shift(swapInfo)
  }

  renderSlider = () => {
    const { pending } = this.props
    if (pending) {
      return <ActivityIndicator style={{ flex: 1, alignSelf: 'center' }} size={'small'} />
    }
    return <Slider onSlidingComplete={this.doShift} sliderDisabled={pending} parentStyle={styles.slideContainer} />
  }
  renderTimer = () => {
    const { swapInfo, timeExpired } = this.props
    const { expirationDate } = swapInfo.quote

    if (!expirationDate) return null
    return <CircleTimer style={styles.timerContainer} timeExpired={() => timeExpired(swapInfo)} expiration={expirationDate} />
  }

  async checkChangellyKYC () {
    const { account, swapInfo, timeExpired } = this.props
    const result = await swapVerifyTerms(account.swapConfig.changelly, [
      {
        text: s.strings.swap_terms_terms_link,
        uri: 'https://changelly.com/terms-of-use'
      },
      {
        text: s.strings.swap_terms_privacy_link,
        uri: 'https://changelly.com/privacy-policy'
      },
      {
        text: s.strings.swap_terms_kyc_link,
        uri: 'https://changelly.com/aml-kyc'
      }
    ])
    if (!result) timeExpired(swapInfo)
  }

  async checkChangeNowKYC () {
    const { account, swapInfo, timeExpired } = this.props
    const result = await swapVerifyTerms(account.swapConfig.changenow, [
      {
        text: s.strings.swap_terms_terms_link,
        uri: 'https://changenow.io/terms-of-use'
      },
      {
        text: s.strings.swap_terms_privacy_link,
        uri: 'https://changenow.io/privacy-policy'
      },
      {
        text: s.strings.swap_terms_kyc_link,
        uri: 'https://changenow.io/faq/kyc'
      }
    ])
    if (!result) timeExpired(swapInfo)
  }

  async checkCoinswitchKYC () {
    const { account, swapInfo, timeExpired } = this.props
    const result = await swapVerifyTerms(account.swapConfig.coinswitch, [
      {
        text: s.strings.swap_terms_terms_link,
        uri: 'https://coinswitch.co/terms'
      }
    ])
    if (!result) timeExpired(swapInfo)
  }

  async checkFoxExchangeKYC () {
    const { account, swapInfo, timeExpired } = this.props
    const result = await swapVerifyTerms(account.swapConfig.foxExchange, [
      {
        text: s.strings.swap_terms_terms_link,
        uri: 'https://fox.exchange/tos'
      }
    ])
    if (!result) timeExpired(swapInfo)
  }

  render () {
    const { fromCurrencyIcon, fromDenomination, fromWalletCurrencyName, swapInfo, toCurrencyIcon, toDenomination, toWalletCurrencyName } = this.props
    const { fee, fromDisplayAmount, fromFiat, toDisplayAmount, toFiat } = swapInfo
    const { isEstimate, pluginName } = swapInfo.quote
    const { fromWallet, toWallet } = swapInfo.request

    return (
      <SceneWrapper>
        <ScrollView>
          <View style={styles.topLogoRow}>
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
          <View style={{ height: 200 }} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}

export { CryptoExchangeQuoteScreenComponent }
