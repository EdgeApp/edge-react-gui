import { div, gte } from 'biggystring'
import { EdgeAccount } from 'edge-core-js/types'
import * as React from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'
import FastImage from 'react-native-fast-image'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/CryptoExchangeActions'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps, NavigationBase } from '../../types/routerTypes'
import { GuiSwapInfo } from '../../types/types'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logEvent } from '../../util/tracking'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal'
import { CircleTimer } from '../progress-indicators/CircleTimer'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { EdgeText } from '../themed/EdgeText'
import { ExchangeQuote } from '../themed/ExchangeQuoteComponent'
import { LineTextDivider } from '../themed/LineTextDivider'
import { SceneHeader } from '../themed/SceneHeader'
import { Slider } from '../themed/Slider'

interface OwnProps extends EdgeSceneProps<'exchangeQuote'> {}

interface StateProps {
  account: EdgeAccount
  fromDenomination: string
  fromWalletCurrencyName: string
  pending: boolean
  toDenomination: string
  toWalletCurrencyName: string
}
interface DispatchProps {
  shift: (navigation: NavigationBase, swapInfo: GuiSwapInfo, onApprove: () => void) => Promise<void>
  timeExpired: (navigation: NavigationBase, swapInfo: GuiSwapInfo, onApprove: () => void) => Promise<void>
}
type Props = StateProps & DispatchProps & ThemeProps & OwnProps

interface State {}

export class CryptoExchangeQuoteScreenComponent extends React.Component<Props, State> {
  // @ts-expect-error
  calledApprove: true

  componentDidMount = () => {
    const { route, account, timeExpired, navigation } = this.props
    const { swapInfo, onApprove } = route.params
    const { pluginId } = swapInfo.quote
    const swapConfig = account.swapConfig[pluginId]

    logEvent('Exchange_Shift_Quote')
    swapVerifyTerms(swapConfig)
      .then(async result => {
        if (!result) await timeExpired(navigation, swapInfo, onApprove)
      })
      .catch(err => showError(err))
  }

  componentWillUnmount() {
    const { route } = this.props
    const { swapInfo } = route.params
    const { quote } = swapInfo

    if (!this.calledApprove) quote.close().catch(err => showError(err))
  }

  doShift = async () => {
    const { shift, route, navigation } = this.props
    const { swapInfo, onApprove } = route.params
    this.calledApprove = true
    await shift(navigation, swapInfo, onApprove)
  }

  renderTimer = () => {
    const { timeExpired, route, navigation } = this.props
    const { swapInfo, onApprove } = route.params
    const { expirationDate } = swapInfo.quote

    if (!expirationDate) return null
    return <CircleTimer timeExpired={async () => await timeExpired(navigation, swapInfo, onApprove)} expiration={expirationDate} />
  }

  handleForEstimateExplanation = async () => {
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.estimated_exchange_rate}
        message={lstrings.estimated_exchange_rate_body}
        buttons={{ ok: { label: lstrings.string_ok } }}
      />
    ))
  }

  handleCanBePartialExplanation = async () => {
    const { canBePartial, maxFulfillmentSeconds } = this.props.route.params.swapInfo.quote
    let canBePartialString: string | undefined
    if (canBePartial === true) {
      if (maxFulfillmentSeconds != null) {
        const t = Math.ceil(maxFulfillmentSeconds / 60)
        canBePartialString = sprintf(lstrings.can_be_partial_quote_with_max_body, t.toString())
      } else {
        canBePartialString = lstrings.can_be_partial_quote_body
      }
    }
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal bridge={bridge} title={lstrings.can_be_partial_quote_title} message={canBePartialString} buttons={{ ok: { label: lstrings.string_ok } }} />
    ))
  }

  handlePoweredByTap = () => {
    this.props.navigation.navigate('exchangeSettings', {})
  }

  render() {
    const { account, fromDenomination, fromWalletCurrencyName, toDenomination, toWalletCurrencyName, pending, theme, route, navigation } = this.props
    const { swapInfo } = route.params
    const { fee, fromDisplayAmount, fromFiat, fromTotalFiat, toDisplayAmount, toFiat, quote, request } = swapInfo
    const { fiatCurrencyCode } = request.fromWallet
    const { pluginId } = quote
    const swapConfig = account.swapConfig[pluginId]
    const exchangeName = swapConfig.swapInfo.displayName
    const feePercent = div(quote.networkFee.nativeAmount, quote.fromNativeAmount, 2)
    const showFeeWarning = gte(feePercent, '0.05')
    const styles = getStyles(theme)

    return (
      <NotificationSceneWrapper hasTabs navigation={navigation} background="theme">
        {(gap, notificationHeight) => (
          <>
            <SceneHeader title={lstrings.title_exchange} underline withTopMargin />
            <ScrollView contentContainerStyle={[{ paddingBottom: notificationHeight }, styles.container]}>
              <LineTextDivider title={lstrings.fragment_send_from_label} lowerCased />
              {showFeeWarning && <Alert marginRem={[0, 1, 1.5, 1]} title={lstrings.transaction_details_fee_warning} type="warning" />}
              <ExchangeQuote
                cryptoAmount={fromDisplayAmount}
                currency={fromWalletCurrencyName}
                currencyCode={fromDenomination}
                fiatCurrencyAmount={fromFiat}
                fiatCurrencyCode={fiatCurrencyCode.replace('iso:', '')}
                isTop
                miningFee={fee}
                total={fromTotalFiat}
                walletId={request.fromWallet.id}
                walletName={getWalletName(request.fromWallet)}
                showFeeWarning={showFeeWarning}
              />
              <LineTextDivider title={lstrings.string_to_capitalize} lowerCased />
              <ExchangeQuote
                cryptoAmount={toDisplayAmount}
                currency={toWalletCurrencyName}
                currencyCode={toDenomination}
                fiatCurrencyAmount={toFiat}
                fiatCurrencyCode={request.toWallet.fiatCurrencyCode.replace('iso:', '')}
                walletId={request.toWallet.id}
                walletName={getWalletName(request.toWallet)}
              />
              <TouchableOpacity style={styles.pluginRowPoweredByRow} onPress={this.handlePoweredByTap}>
                <EdgeText style={styles.footerText}>{lstrings.plugin_powered_by_space + ' '}</EdgeText>
                <FastImage style={styles.partnerIconImage} resizeMode="contain" source={{ uri: getSwapPluginIconUri(quote.pluginId, theme) }} />
                <EdgeText style={styles.footerText}>{' ' + exchangeName}</EdgeText>
                <IonIcon name="chevron-forward" size={theme.rem(1)} color={theme.iconTappable} />
              </TouchableOpacity>
              {quote.isEstimate && (
                <Alert
                  title={lstrings.estimated_quote}
                  message={lstrings.estimated_exchange_message}
                  type="warning"
                  marginRem={[1, 1]}
                  onPress={this.handleForEstimateExplanation}
                />
              )}
              {quote.canBePartial === true && (
                <Alert
                  title={lstrings.can_be_partial_quote_title}
                  message={lstrings.can_be_partial_quote_message}
                  type="warning"
                  marginRem={[1, 1]}
                  onPress={this.handleCanBePartialExplanation}
                />
              )}

              <Slider parentStyle={styles.slider} onSlidingComplete={this.doShift} disabled={pending} showSpinner={pending} />
              {this.renderTimer()}
            </ScrollView>
          </>
        )}
      </NotificationSceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingTop: theme.rem(0.5)
  },
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
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(1)
  },
  spacer: {
    height: theme.rem(8)
  }
}))

export const CryptoExchangeQuote = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    account: state.core.account,
    fromDenomination: state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name,
    fromWalletCurrencyName:
      state.cryptoExchange.fromWalletId != null ? state.core.account.currencyWallets[state.cryptoExchange.fromWalletId].currencyInfo.displayName : '',
    pending: state.cryptoExchange.shiftPendingTransaction,
    toDenomination: state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name,
    toWalletCurrencyName:
      state.cryptoExchange.toWalletId != null ? state.core.account.currencyWallets[state.cryptoExchange.toWalletId].currencyInfo.displayName : ''
  }),
  dispatch => ({
    async shift(navigation, swapInfo, onApprove) {
      await dispatch(shiftCryptoCurrency(navigation, swapInfo, onApprove))
    },
    async timeExpired(navigation, swapInfo, onApprove) {
      await dispatch(exchangeTimerExpired(navigation, swapInfo, onApprove))
    }
  })
)(withTheme(CryptoExchangeQuoteScreenComponent))
