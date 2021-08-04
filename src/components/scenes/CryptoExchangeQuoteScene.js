// @flow

import { type EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/CryptoExchangeActions'
import { swapPluginIcons } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { connect } from '../../types/reactRedux.js'
import { type GuiSwapInfo } from '../../types/types.js'
import { logEvent } from '../../util/tracking.js'
import { CircleTimer } from '../common/CircleTimer'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import Alert from '../themed/Alert'
import { EdgeText } from '../themed/EdgeText.js'
import { ExchangeQuote } from '../themed/ExchangeQuoteComponent.js'
import { LineTextDivider } from '../themed/LineTextDivider'
import { SceneHeader } from '../themed/SceneHeader'

type OwnProps = {
  swapInfo: GuiSwapInfo
}
type StateProps = {
  account: EdgeAccount,
  fromCurrencyIcon: string,
  fromDenomination: string,
  fromWalletCurrencyName: string,
  pending: boolean,
  toCurrencyIcon: string,
  toDenomination: string,
  toWalletCurrencyName: string
}
type DispatchProps = {
  shift: (swapInfo: GuiSwapInfo) => void,
  timeExpired: (swapInfo: GuiSwapInfo) => void
}
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

type State = {}

class CryptoExchangeQuoteScreenComponent extends React.Component<Props, State> {
  calledApprove: true

  componentDidMount = () => {
    const check = {
      changelly: this.checkChangellyKYC,
      changenow: this.checkChangeNowKYC,
      coinswitch: this.checkCoinswitchKYC,
      foxExchange: this.checkFoxExchangeKYC,
      switchain: this.checkSwitchainKYC
    }
    try {
      if (check[this.props.swapInfo.quote.pluginId]) check[this.props.swapInfo.quote.pluginId]()
    } catch (e) {
      showError(e)
    }
    logEvent('SwapQuote')
  }

  componentWillUnmount() {
    const { swapInfo } = this.props
    if (!this.calledApprove) swapInfo.quote.close()
  }

  doShift = () => {
    const { shift, swapInfo } = this.props
    this.calledApprove = true
    shift(swapInfo)
  }

  renderTimer = () => {
    const { swapInfo, timeExpired } = this.props
    const { expirationDate } = swapInfo.quote

    if (!expirationDate) return null
    return <CircleTimer timeExpired={() => timeExpired(swapInfo)} expiration={expirationDate} />
  }

  async checkChangellyKYC() {
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

  async checkSwitchainKYC() {
    const { account, swapInfo, timeExpired } = this.props
    const result = await swapVerifyTerms(account.swapConfig.switchain, [
      {
        text: s.strings.swap_terms_terms_link,
        uri: 'https://www.switchain.com/tos'
      },
      {
        text: s.strings.swap_terms_privacy_link,
        uri: 'https://www.switchain.com/policy'
      },
      {
        text: s.strings.swap_terms_kyc_link,
        uri: 'https://www.switchain.com/policy'
      }
    ])
    if (!result) timeExpired(swapInfo)
  }

  async checkChangeNowKYC() {
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

  async checkCoinswitchKYC() {
    const { account, swapInfo, timeExpired } = this.props
    const result = await swapVerifyTerms(account.swapConfig.coinswitch, [
      {
        text: s.strings.swap_terms_terms_link,
        uri: 'https://coinswitch.co/terms'
      }
    ])
    if (!result) timeExpired(swapInfo)
  }

  async checkFoxExchangeKYC() {
    const { account, swapInfo, timeExpired } = this.props
    const result = await swapVerifyTerms(account.swapConfig.foxExchange, [
      {
        text: s.strings.swap_terms_terms_link,
        uri: 'https://fox.exchange/tos'
      }
    ])
    if (!result) timeExpired(swapInfo)
  }

  showExplanationForEstimate = () => {
    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.estimated_exchange_rate}
        message={s.strings.estimated_exchange_rate_body}
        buttons={{ ok: { label: s.strings.string_ok } }}
      />
    ))
  }

  render() {
    const { fromCurrencyIcon, fromDenomination, fromWalletCurrencyName, swapInfo, toCurrencyIcon, toDenomination, toWalletCurrencyName, pending, theme } =
      this.props
    const { fee, fromDisplayAmount, fromFiat, fromTotalFiat, toDisplayAmount, toFiat } = swapInfo
    const { isEstimate, pluginId } = swapInfo.quote
    const { fromWallet, toWallet } = swapInfo.request
    const exchangeName = this.props.account.swapConfig[pluginId].swapInfo.displayName
    const styles = getStyles(theme)

    return (
      <SceneWrapper hasHeader={false} background="theme">
        <SceneHeader withTopMargin title={s.strings.title_exchange} underline />
        <ScrollView>
          <LineTextDivider title={s.strings.fragment_send_from_label} lowerCased />
          <ExchangeQuote
            cryptoAmount={fromDisplayAmount}
            currency={fromWalletCurrencyName}
            currencyCode={fromDenomination}
            fiatCurrencyAmount={fromFiat}
            fiatCurrencyCode={fromWallet.fiatCurrencyCode.replace('iso:', '')}
            isTop
            miningFee={fee}
            total={fromTotalFiat}
            walletIcon={fromCurrencyIcon}
            walletName={fromWallet.name || ''}
          />
          <LineTextDivider title={s.strings.string_to_capitalize} lowerCased />
          <ExchangeQuote
            cryptoAmount={toDisplayAmount}
            currency={toWalletCurrencyName}
            currencyCode={toDenomination}
            fiatCurrencyAmount={toFiat}
            fiatCurrencyCode={toWallet.fiatCurrencyCode.replace('iso:', '')}
            walletIcon={toCurrencyIcon}
            walletName={toWallet.name || ''}
          />
          <View style={styles.pluginRowPoweredByRow}>
            <EdgeText style={styles.footerText}>{s.strings.plugin_powered_by + ' '}</EdgeText>
            <Image style={styles.partnerIconImage} resizeMode="contain" source={swapPluginIcons[pluginId]} />
            <EdgeText style={styles.footerText}>{' ' + exchangeName}</EdgeText>
          </View>
          {isEstimate && (
            <Alert
              title={s.strings.estimated_quote}
              message={s.strings.estimated_exchange_message}
              type="warning"
              marginRem={[1.5, 1]}
              onPress={this.showExplanationForEstimate}
            />
          )}

          <Slider parentStyle={styles.slider} onSlidingComplete={this.doShift} disabled={pending} showSpinner={pending} />
          {this.renderTimer()}
          <View style={styles.spacer} />
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  footerText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  partnerIconImage: {
    aspectRatio: 1,
    width: theme.rem(0.75),
    height: theme.rem(0.75)
  },
  pluginRowPoweredByRow: {
    marginTop: theme.rem(1),
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: theme.rem(1),
    alignItems: 'center'
  },
  slider: {
    marginTop: theme.rem(2.5)
  },
  spacer: {
    height: theme.rem(8)
  }
}))

export const CryptoExchangeQuote = connect<StateProps, DispatchProps, OwnProps>(
  (state, ownProps) => {
    const { request } = ownProps.swapInfo

    const { account } = state.core
    const fromWallet = state.cryptoExchange.fromWallet
    const toWallet = state.cryptoExchange.toWallet

    const toWalletCurrencyName = toWallet != null ? toWallet.currencyNames[request.toCurrencyCode] : ''
    const fromWalletCurrencyName = fromWallet != null ? fromWallet.currencyNames[request.fromCurrencyCode] : ''

    return {
      account,
      fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon || '',
      fromDenomination: state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
      fromWalletCurrencyName,
      pending: state.cryptoExchange.shiftPendingTransaction,
      toCurrencyIcon: state.cryptoExchange.toCurrencyIcon || '',
      toDenomination: state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
      toWalletCurrencyName
    }
  },
  dispatch => ({
    shift(swapInfo: GuiSwapInfo) {
      dispatch(shiftCryptoCurrency(swapInfo))
    },
    timeExpired(swapInfo: GuiSwapInfo) {
      dispatch(exchangeTimerExpired(swapInfo))
    }
  })
)(withTheme(CryptoExchangeQuoteScreenComponent))
