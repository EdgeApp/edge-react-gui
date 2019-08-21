// @flow

import type { EdgeAccount } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { swapPluginLogos } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { ExchangeQuoteComponent } from '../../modules/UI/components/ExchangeQuote/ExchangeQuoteComponent.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import Slider from '../../modules/UI/components/Slider/index'
import { styles } from '../../styles/scenes/CryptoExchangeQuoteSceneStyles.js'
import { type GuiSwapInfo } from '../../types/types.js'
import { CircleTimer } from '../common/CircleTimer'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { SwapVerifyChangellyModal } from '../modals/SwapVerifyChangellyModal.js'
import { Airship } from '../services/AirshipInstance.js'

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
    const { swapInfo } = this.props
    const { pluginName } = swapInfo.quote
    if (pluginName === 'changelly') {
      this.checkChangellyKYC()
    }
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

  async checkChangellyKYC () {
    const { account, swapInfo, timeExpired } = this.props
    const swapConfig = account.swapConfig.changelly
    if (swapConfig.userSettings && swapConfig.userSettings.agreedToTerms) return

    const result = await Airship.show(bridge => <SwapVerifyChangellyModal bridge={bridge} />)

    if (result) {
      await account.swapConfig.changelly.changeUserSettings({ agreedToTerms: true })
    } else {
      // If the user rejects the terms, disable Changelly and expire the quote:
      await account.swapConfig.changelly.changeUserSettings({ agreedToTerms: false })
      await account.swapConfig.changelly.changeEnabled(false)
      timeExpired(swapInfo)
    }
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
