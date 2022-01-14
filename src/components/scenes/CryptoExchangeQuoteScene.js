// @flow

import { type EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { Image, ScrollView, View } from 'react-native'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/CryptoExchangeActions'
import { swapPluginIcons } from '../../assets/images/exchange'
import s from '../../locales/strings.js'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { connect } from '../../types/reactRedux.js'
import { type RouteProp } from '../../types/routerTypes.js'
import { type GuiSwapInfo } from '../../types/types.js'
import { logEvent } from '../../util/tracking.js'
import { CircleTimer } from '../common/CircleTimer'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Alert } from '../themed/Alert'
import { EdgeText } from '../themed/EdgeText.js'
import { ExchangeQuote } from '../themed/ExchangeQuoteComponent.js'
import { LineTextDivider } from '../themed/LineTextDivider'
import { SceneHeader } from '../themed/SceneHeader'

type OwnProps = {
  route: RouteProp<'exchangeQuote'>
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
  shift: (swapInfo: GuiSwapInfo, onApprove: () => void) => void,
  timeExpired: (swapInfo: GuiSwapInfo, onApprove: () => void) => void
}
type Props = StateProps & DispatchProps & ThemeProps & OwnProps

type State = {}

class CryptoExchangeQuoteScreenComponent extends React.Component<Props, State> {
  calledApprove: true

  componentDidMount = () => {
    const { route, account, timeExpired } = this.props
    const { swapInfo, onApprove } = route.params
    const { pluginId } = swapInfo.quote
    const swapConfig = account.swapConfig[pluginId]

    logEvent('SwapQuote')
    swapVerifyTerms(swapConfig).then(result => {
      if (!result) timeExpired(swapInfo, onApprove)
    }, showError)
  }

  componentWillUnmount() {
    const { route } = this.props
    const { swapInfo } = route.params
    const { quote } = swapInfo

    if (!this.calledApprove) quote.close()
  }

  doShift = () => {
    const { shift, route } = this.props
    const { swapInfo, onApprove } = route.params
    this.calledApprove = true
    shift(swapInfo, onApprove)
  }

  renderTimer = () => {
    const { timeExpired, route } = this.props
    const { swapInfo, onApprove } = route.params
    const { expirationDate } = swapInfo.quote

    if (!expirationDate) return null
    return <CircleTimer timeExpired={() => timeExpired(swapInfo, onApprove)} expiration={expirationDate} />
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
    const { account, fromCurrencyIcon, fromDenomination, fromWalletCurrencyName, toCurrencyIcon, toDenomination, toWalletCurrencyName, pending, theme, route } =
      this.props
    const { swapInfo } = route.params
    const { fee, fromDisplayAmount, fromFiat, fromTotalFiat, toDisplayAmount, toFiat, quote, request } = swapInfo
    const { fiatCurrencyCode } = request.fromWallet
    const { pluginId } = quote
    const swapConfig = account.swapConfig[pluginId]
    const exchangeName = swapConfig.swapInfo.displayName
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        <SceneHeader withTopMargin title={s.strings.title_exchange} underline />
        <ScrollView>
          <LineTextDivider title={s.strings.fragment_send_from_label} lowerCased />
          <ExchangeQuote
            cryptoAmount={fromDisplayAmount}
            currency={fromWalletCurrencyName}
            currencyCode={fromDenomination}
            fiatCurrencyAmount={fromFiat}
            fiatCurrencyCode={fiatCurrencyCode.replace('iso:', '')}
            isTop
            miningFee={fee}
            total={fromTotalFiat}
            walletIcon={fromCurrencyIcon}
            walletName={request.fromWallet.name || ''}
          />
          <LineTextDivider title={s.strings.string_to_capitalize} lowerCased />
          <ExchangeQuote
            cryptoAmount={toDisplayAmount}
            currency={toWalletCurrencyName}
            currencyCode={toDenomination}
            fiatCurrencyAmount={toFiat}
            fiatCurrencyCode={request.toWallet.fiatCurrencyCode.replace('iso:', '')}
            walletIcon={toCurrencyIcon}
            walletName={request.toWallet.name || ''}
          />
          <View style={styles.pluginRowPoweredByRow}>
            <EdgeText style={styles.footerText}>{s.strings.plugin_powered_by + ' '}</EdgeText>
            <Image style={styles.partnerIconImage} resizeMode="contain" source={swapPluginIcons[quote.pluginId]} />
            <EdgeText style={styles.footerText}>{' ' + exchangeName}</EdgeText>
          </View>
          {quote.isEstimate && (
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
  (state, { route: { params } }) => ({
    account: state.core.account,
    fromCurrencyIcon: state.cryptoExchange.fromCurrencyIcon ?? '',
    fromDenomination: state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
    fromWalletCurrencyName:
      state.cryptoExchange.fromWalletId != null ? state.core.account.currencyWallets[state.cryptoExchange.fromWalletId].currencyInfo.displayName : '',
    pending: state.cryptoExchange.shiftPendingTransaction,
    toCurrencyIcon: state.cryptoExchange.toCurrencyIcon ?? '',
    toDenomination: state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
    toWalletCurrencyName:
      state.cryptoExchange.toWalletId != null ? state.core.account.currencyWallets[state.cryptoExchange.toWalletId].currencyInfo.displayName : ''
  }),
  dispatch => ({
    shift(swapInfo, onApprove) {
      dispatch(shiftCryptoCurrency(swapInfo, onApprove))
    },
    timeExpired(swapInfo, onApprove) {
      dispatch(exchangeTimerExpired(swapInfo, onApprove))
    }
  })
)(withTheme(CryptoExchangeQuoteScreenComponent))
