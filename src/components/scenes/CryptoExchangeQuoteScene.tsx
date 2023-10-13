import { div, gte } from 'biggystring'
import { EdgeSwapQuote } from 'edge-core-js'
import React, { useEffect, useState } from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { exchangeTimerExpired, getSwapInfo, shiftCryptoCurrency } from '../../actions/CryptoExchangeActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logEvent } from '../../util/tracking'
import { PoweredByCard } from '../cards/PoweredByCard'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal'
import { CircleTimer } from '../progress-indicators/CircleTimer'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { ExchangeQuote } from '../themed/ExchangeQuoteComponent'
import { LineTextDivider } from '../themed/LineTextDivider'
import { SceneHeader } from '../themed/SceneHeader'
import { Slider } from '../themed/Slider'

export interface CryptoExchangeQuoteParams {
  quote: EdgeSwapQuote
  onApprove: () => void
}

interface Props extends EdgeSceneProps<'exchangeQuote'> {}

export const CryptoExchangeQuoteScene = (props: Props) => {
  const { route, navigation } = props
  const { quote, onApprove } = route.params
  const { request } = quote
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const fromDenomination = useSelector(state => state.cryptoExchange.fromWalletPrimaryInfo.displayDenomination.name)
  const fromWalletCurrencyName = useSelector(state =>
    state.cryptoExchange.fromWalletId != null ? state.core.account.currencyWallets[state.cryptoExchange.fromWalletId].currencyInfo.displayName : ''
  )
  const pending = useSelector(state => state.cryptoExchange.shiftPendingTransaction)
  const toDenomination = useSelector(state => state.cryptoExchange.toWalletPrimaryInfo.displayDenomination.name)
  const toWalletCurrencyName = useSelector(state =>
    state.cryptoExchange.toWalletId != null ? state.core.account.currencyWallets[state.cryptoExchange.toWalletId].currencyInfo.displayName : ''
  )
  const swapInfo = useSelector(state => getSwapInfo(state, quote))

  const [calledApprove, setCalledApprove] = useState(false)

  const { fee, fromDisplayAmount, fromFiat, fromTotalFiat, toDisplayAmount, toFiat } = swapInfo
  const { fiatCurrencyCode } = request.fromWallet
  const { pluginId } = quote

  const swapConfig = account.swapConfig[pluginId]
  const exchangeName = swapConfig?.swapInfo.displayName ?? '' // HACK: for unit tests to run
  const feePercent = div(quote.networkFee.nativeAmount, quote.fromNativeAmount, 2)
  const showFeeWarning = gte(feePercent, '0.05')

  useEffect(() => {
    const swapConfig = account.swapConfig[pluginId]

    logEvent('Exchange_Shift_Quote')
    swapVerifyTerms(swapConfig)
      .then(async result => {
        if (!result) await dispatch(exchangeTimerExpired(navigation, quote, onApprove))
      })
      .catch(err => showError(err))

    return () => {
      if (!calledApprove) quote.close().catch(err => showError(err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doShift = async () => {
    setCalledApprove(true)
    await dispatch(shiftCryptoCurrency(navigation, quote, onApprove))
  }

  const renderTimer = () => {
    const { expirationDate } = quote
    if (!expirationDate) return null
    return <CircleTimer timeExpired={async () => await dispatch(exchangeTimerExpired(navigation, quote, onApprove))} expiration={expirationDate} />
  }

  const handleForEstimateExplanation = async () => {
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.estimated_exchange_rate}
        message={lstrings.estimated_exchange_rate_body}
        buttons={{ ok: { label: lstrings.string_ok } }}
      />
    ))
  }

  const handleCanBePartialExplanation = async () => {
    const { canBePartial, maxFulfillmentSeconds } = quote
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

  const handlePoweredByTap = useHandler(() => {
    navigation.navigate('exchangeSettings', {})
  })

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
            <PoweredByCard iconUri={getSwapPluginIconUri(quote.pluginId, theme)} poweredByText={exchangeName} onPress={handlePoweredByTap} />
            {quote.isEstimate && (
              <Alert
                title={lstrings.estimated_quote}
                message={lstrings.estimated_exchange_message}
                type="warning"
                marginRem={[1, 1]}
                onPress={handleForEstimateExplanation}
              />
            )}
            {quote.canBePartial === true && (
              <Alert
                title={lstrings.can_be_partial_quote_title}
                message={lstrings.can_be_partial_quote_message}
                type="warning"
                marginRem={[1, 1]}
                onPress={handleCanBePartialExplanation}
              />
            )}

            <Slider parentStyle={styles.slider} onSlidingComplete={doShift} disabled={pending} showSpinner={pending} />
            {renderTimer()}
          </ScrollView>
        </>
      )}
    </NotificationSceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingTop: theme.rem(0.5)
  },
  slider: {
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(1)
  }
}))
