import { useIsFocused } from '@react-navigation/native'
import { add, div, gt, gte, toFixed } from 'biggystring'
import { EdgeSwapQuote, EdgeSwapResult } from 'edge-core-js'
import React, { useState } from 'react'
import { SectionList, View, ViewStyle } from 'react-native'
import { sprintf } from 'sprintf-js'

import { updateSwapCount } from '../../actions/RequestReviewActions'
import { useSwapRequestOptions } from '../../hooks/swap/useSwapRequestOptions'
import { useHandler } from '../../hooks/useHandler'
import { useMount } from '../../hooks/useMount'
import { useRowLayout } from '../../hooks/useRowLayout'
import { useUnmount } from '../../hooks/useUnmount'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom, selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { convertCurrency } from '../../selectors/WalletSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { ThunkAction } from '../../types/reduxTypes'
import { SwapTabSceneProps } from '../../types/routerTypes'
import { GuiSwapInfo } from '../../types/types'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { CryptoAmount } from '../../util/CryptoAmount'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { logActivity } from '../../util/logger'
import { logEvent } from '../../util/tracking'
import { convertCurrencyFromExchangeRates, convertNativeToExchange, DECIMAL_PRECISION } from '../../util/utils'
import { AlertCardUi4 } from '../cards/AlertCard'
import { PoweredByCard } from '../cards/PoweredByCard'
import { EdgeAnim, fadeInDown30, fadeInDown60, fadeInDown90, fadeInDown120, fadeInUp30, fadeInUp60, fadeInUp90 } from '../common/EdgeAnim'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { EdgeModal } from '../modals/EdgeModal'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal'
import { CircleTimer } from '../progress-indicators/CircleTimer'
import { SwapProviderRow } from '../rows/SwapProviderRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ExchangeQuote } from '../themed/ExchangeQuoteComponent'
import { LineTextDivider } from '../themed/LineTextDivider'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader'
import { Slider } from '../themed/Slider'
import { WalletListSectionHeader } from '../themed/WalletListSectionHeader'

export interface SwapConfirmationParams {
  selectedQuote: EdgeSwapQuote
  quotes: EdgeSwapQuote[]
  onApprove: () => void
}

interface Props extends SwapTabSceneProps<'swapConfirmation'> {}

interface Section {
  title: { title: string; rightTitle: string }
  data: EdgeSwapQuote[]
}

export const SwapConfirmationScene = (props: Props) => {
  const { route, navigation } = props
  const { quotes, onApprove } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const feeFiat = useSelector(state =>
    selectedQuote == null
      ? '0'
      : convertCurrencyFromExchangeRates(
          state.exchangeRates,
          selectedQuote.networkFee.currencyCode,
          state.ui.settings.defaultIsoFiat,
          selectedQuote.networkFee.nativeAmount
        )
  )
  const [pending, setPending] = useState(false)

  const swapRequestOptions = useSwapRequestOptions()

  const isFocused = useIsFocused()

  const [selectedQuote, setSelectedQuote] = useState(pickBestQuote(quotes))
  const [calledApprove, setCalledApprove] = useState(false)

  const { request } = selectedQuote
  const { quoteFor } = request

  const scrollPadding = React.useMemo<ViewStyle>(
    () => ({
      paddingBottom: theme.rem(ModalFooter.bottomRem)
    }),
    [theme]
  )

  const sectionList = React.useMemo(() => {
    const rightTitle = quoteFor === 'to' ? lstrings.quote_exchange_cost : lstrings.quote_payout_amount
    return [
      {
        title: { title: lstrings.quote_selected_quote, rightTitle },
        data: [selectedQuote]
      },
      {
        title: { title: lstrings.quote_fixed_quotes, rightTitle },
        data: [...quotes.filter((quote: EdgeSwapQuote) => !quote.isEstimate)]
      },
      {
        title: { title: lstrings.quote_variable_quotes, rightTitle },
        data: [...quotes.filter((quote: EdgeSwapQuote) => quote.isEstimate)]
      }
    ].filter(section => section.data.length > 0)
  }, [quoteFor, quotes, selectedQuote])

  const { pluginId } = selectedQuote

  const swapConfig = account.swapConfig[pluginId]
  const exchangeName = swapConfig?.swapInfo.displayName ?? '' // HACK: for unit tests to run
  const feePercent = div(selectedQuote.networkFee.nativeAmount, selectedQuote.fromNativeAmount, 2)
  const showFeeWarning = gt(feeFiat, '0.01') && gte(feePercent, '0.05')

  const handleExchangeTimerExpired = useHandler(() => {
    if (!isFocused) return

    navigation.replace('swapProcessing', {
      swapRequest: selectedQuote.request,
      swapRequestOptions,
      onCancel: () => {
        navigation.navigate('swapTab', { screen: 'swapCreate' })
      },
      onDone: quotes => {
        navigation.replace('swapConfirmation', {
          selectedQuote: quotes[0],
          quotes,
          onApprove
        })
      }
    })
  })

  useMount(() => {
    const swapConfig = account.swapConfig[pluginId]

    dispatch(logEvent('Exchange_Shift_Quote'))
    swapVerifyTerms(swapConfig)
      .then(async result => {
        if (!result) handleExchangeTimerExpired()
      })
      .catch(err => showError(err))
  })

  // Close the quote if the component unmounts
  useUnmount(() => {
    if (!calledApprove) selectedQuote.close().catch(err => showError(err))
  })

  const handleSlideComplete = async () => {
    setCalledApprove(true)
    setPending(true)

    const { fromDisplayAmount, fee, fromFiat, fromTotalFiat, toDisplayAmount, toFiat } = await dispatch(getSwapInfo(selectedQuote))
    const { isEstimate, fromNativeAmount, toNativeAmount, networkFee, pluginId, expirationDate, request } = selectedQuote
    // Both fromCurrencyCode and toCurrencyCode will exist, since we set them:
    const { toWallet, toTokenId } = request
    try {
      dispatch(logEvent('Exchange_Shift_Start'))
      const result: EdgeSwapResult = await selectedQuote.approve()

      logActivity(`Swap Exchange Executed: ${account.username}`)
      logActivity(`
    fromDisplayAmount: ${fromDisplayAmount}
    fee: ${fee}
    fromFiat: ${fromFiat}
    fromTotalFiat: ${fromTotalFiat}
    toDisplayAmount: ${toDisplayAmount}
    toFiat: ${toFiat}
    quote:
      pluginId: ${pluginId}
      isEstimate: ${isEstimate.toString()}
      fromNativeAmount: ${fromNativeAmount}
      toNativeAmount: ${toNativeAmount}
      expirationDate: ${expirationDate ? expirationDate.toISOString() : 'no expiration'}
      networkFee:
        currencyCode ${networkFee.currencyCode}
        nativeAmount ${networkFee.nativeAmount}
`)

      navigation.push('swapSuccess', {
        edgeTransaction: result.transaction,
        walletId: request.fromWallet.id
      })

      // Dispatch the success action and callback
      onApprove()

      await dispatch(updateSwapCount())

      dispatch(
        logEvent('Exchange_Shift_Success', {
          conversionValues: {
            conversionType: 'crypto',
            cryptoAmount: new CryptoAmount({
              nativeAmount: toNativeAmount,
              tokenId: toTokenId,
              currencyConfig: toWallet.currencyConfig
            }),
            orderId: result.orderId,
            swapProviderId: pluginId
          }
        })
      )
    } catch (error: any) {
      dispatch(logEvent('Exchange_Shift_Failed', { error: String(error) })) // TODO: Do we need to parse/clean all cases?
      setTimeout(() => {
        showError(error)
      }, 1)
    }
    setPending(false)
    await selectedQuote.close()
  }

  const renderTimer = () => {
    const { expirationDate } = selectedQuote
    if (!expirationDate) return null
    return <CircleTimer timeExpired={handleExchangeTimerExpired} expiration={expirationDate} />
  }

  const renderRow = useHandler((item: { item: EdgeSwapQuote; section: Section; index: number }) => {
    const quote = item.item
    return (
      <EdgeTouchableOpacity
        onPress={() => {
          setSelectedQuote(quote)
          Airship.clear()
        }}
      >
        <SwapProviderRow quote={quote} />
      </EdgeTouchableOpacity>
    )
  })

  const renderSectionHeader = useHandler((sectionObj: { section: Section }) => {
    return <WalletListSectionHeader title={sectionObj.section.title.title} rightTitle={sectionObj.section.title.rightTitle} />
  })

  const handleItemLayout = useRowLayout()

  const handlePoweredByTap = useHandler(async () => {
    await Airship.show(bridge => (
      <EdgeModal bridge={bridge} onCancel={() => bridge.resolve()}>
        <ModalTitle>{lstrings.quote_swap_provider}</ModalTitle>
        <SectionList
          style={styles.container}
          contentContainerStyle={scrollPadding}
          getItemLayout={handleItemLayout}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, index) => item.swapInfo.displayName + index}
          renderItem={renderRow}
          renderSectionHeader={renderSectionHeader}
          sections={sectionList}
        />
      </EdgeModal>
    ))
  })

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
    const { canBePartial, maxFulfillmentSeconds } = selectedQuote
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
  return (
    <SceneWrapper hasTabs hasNotifications scroll>
      <View style={styles.container}>
        <EdgeAnim style={styles.header} enter={fadeInUp90}>
          <SceneHeader title={lstrings.title_exchange} underline withTopMargin />
        </EdgeAnim>

        {showFeeWarning ? (
          <EdgeAnim enter={fadeInUp60}>
            <AlertCardUi4 title={lstrings.transaction_details_fee_warning} type="warning" />
          </EdgeAnim>
        ) : null}

        <EdgeAnim enter={fadeInUp30}>
          <ExchangeQuote quote={selectedQuote} fromTo="from" showFeeWarning={showFeeWarning} />
        </EdgeAnim>
        <EdgeAnim>
          <LineTextDivider title={lstrings.string_to_capitalize} lowerCased />
        </EdgeAnim>
        <EdgeAnim enter={fadeInDown30}>
          <ExchangeQuote quote={selectedQuote} fromTo="to" />
        </EdgeAnim>
        <EdgeAnim enter={fadeInDown60}>
          <PoweredByCard iconUri={getSwapPluginIconUri(selectedQuote.pluginId, theme)} poweredByText={exchangeName} onPress={handlePoweredByTap} />
        </EdgeAnim>
        {selectedQuote.isEstimate ? (
          <EdgeAnim enter={fadeInDown90}>
            <AlertCardUi4 title={lstrings.estimated_quote} body={lstrings.estimated_exchange_message} type="warning" onPress={handleForEstimateExplanation} />
          </EdgeAnim>
        ) : null}
        {selectedQuote.canBePartial ? (
          <EdgeAnim enter={fadeInDown90}>
            <AlertCardUi4
              title={lstrings.can_be_partial_quote_title}
              body={lstrings.can_be_partial_quote_message}
              type="warning"
              onPress={handleCanBePartialExplanation}
            />
          </EdgeAnim>
        ) : null}

        <EdgeAnim enter={fadeInDown120}>
          <Slider parentStyle={styles.slider} onSlidingComplete={handleSlideComplete} disabled={pending} showSpinner={pending} />
        </EdgeAnim>
        {renderTimer()}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    marginHorizontal: theme.rem(0.5),
    paddingTop: theme.rem(0.5)
  },
  header: {
    marginLeft: -theme.rem(0.5),
    width: '100%',
    marginBottom: theme.rem(1)
  },
  slider: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(3)
  }
}))

// TODO: Use new hooks and utility methods for all conversions here
const getSwapInfo = (quote: EdgeSwapQuote): ThunkAction<Promise<GuiSwapInfo>> => {
  return async (_dispatch, getState) => {
    const state = getState()
    const { defaultFiat, defaultIsoFiat } = state.ui.settings

    // Currency conversion tools:
    // Both fromCurrencyCode and toCurrencyCode will exist, since we set them:
    const { request } = quote
    const { fromWallet, toWallet, fromTokenId, toTokenId } = request
    const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
    const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

    // Format from amount:
    const fromDisplayDenomination = selectDisplayDenom(state, fromWallet.currencyConfig, fromTokenId)
    const fromDisplayAmountTemp = div(quote.fromNativeAmount, fromDisplayDenomination.multiplier, DECIMAL_PRECISION)
    const fromDisplayAmount = toFixed(fromDisplayAmountTemp, 0, 8)

    // Format from fiat:
    const fromExchangeDenomination = getExchangeDenom(fromWallet.currencyConfig, fromTokenId)
    const fromBalanceInCryptoDisplay = convertNativeToExchange(fromExchangeDenomination.multiplier)(quote.fromNativeAmount)
    const fromBalanceInFiatRaw = parseFloat(convertCurrency(state, fromCurrencyCode, defaultIsoFiat, fromBalanceInCryptoDisplay))
    const fromFiat = formatNumber(fromBalanceInFiatRaw || 0, { toFixed: 2 })

    // Format crypto fee:
    const feeDenomination = selectDisplayDenom(state, fromWallet.currencyConfig, null)
    const feeNativeAmount = quote.networkFee.nativeAmount
    const feeTempAmount = div(feeNativeAmount, feeDenomination.multiplier, DECIMAL_PRECISION)
    const feeDisplayAmount = toFixed(feeTempAmount, 0, 6)

    // Format fiat fee:
    const feeDenominatedAmount = await fromWallet.nativeToDenomination(feeNativeAmount, request.fromWallet.currencyInfo.currencyCode)
    const feeFiatAmountRaw = parseFloat(convertCurrency(state, request.fromWallet.currencyInfo.currencyCode, defaultIsoFiat, feeDenominatedAmount))
    const feeFiatAmount = formatNumber(feeFiatAmountRaw || 0, { toFixed: 2 })
    const fee = `${feeDisplayAmount} ${feeDenomination.name} (${feeFiatAmount} ${defaultFiat})`
    const fromTotalFiat = formatNumber(add(fromBalanceInFiatRaw.toFixed(DECIMAL_PRECISION), feeFiatAmountRaw.toFixed(DECIMAL_PRECISION)), { toFixed: 2 })

    // Format to amount:
    const toDisplayDenomination = selectDisplayDenom(state, toWallet.currencyConfig, toTokenId)
    const toDisplayAmountTemp = div(quote.toNativeAmount, toDisplayDenomination.multiplier, DECIMAL_PRECISION)
    const toDisplayAmount = toFixed(toDisplayAmountTemp, 0, 8)

    // Format to fiat:
    const toExchangeDenomination = getExchangeDenom(toWallet.currencyConfig, toTokenId)
    const toBalanceInCryptoDisplay = convertNativeToExchange(toExchangeDenomination.multiplier)(quote.toNativeAmount)
    const toBalanceInFiatRaw = parseFloat(convertCurrency(state, toCurrencyCode, defaultIsoFiat, toBalanceInCryptoDisplay))
    const toFiat = formatNumber(toBalanceInFiatRaw || 0, { toFixed: 2 })

    const swapInfo: GuiSwapInfo = {
      fee,
      fromDisplayAmount,
      fromFiat,
      fromTotalFiat,
      toDisplayAmount,
      toFiat
    }
    return swapInfo
  }
}

const getBetterQuoteRate = (quoteA: EdgeSwapQuote, quoteB: EdgeSwapQuote): EdgeSwapQuote => {
  const aRate = div(quoteA.toNativeAmount, quoteA.fromNativeAmount, DECIMAL_PRECISION)
  const bRate = div(quoteB.toNativeAmount, quoteB.fromNativeAmount, DECIMAL_PRECISION)
  return gte(aRate, bRate) ? quoteA : quoteB
}

export const pickBestQuote = (quotes: EdgeSwapQuote[]): EdgeSwapQuote => {
  const best = quotes.reduce((bestQuote, quote) => {
    const { swapInfo, isEstimate } = quote
    const { isDex = false } = swapInfo
    const { isEstimate: isBestQuoteEstimate } = bestQuote
    const isBestQuoteDex = bestQuote.swapInfo.isDex === true

    // If the quote isDex and has a better rate, pick the quote
    if (isDex) {
      return getBetterQuoteRate(quote, bestQuote)
    }

    // If best quote isDex and new quote is fixed. Pick the better rate
    if (isBestQuoteDex) {
      if (!isEstimate) {
        return getBetterQuoteRate(quote, bestQuote)
      }
      return bestQuote
    }

    // Neither quotes are isDex. If both quotes are estimates or fixed,
    // pick the better rate
    if ((!isEstimate && !isBestQuoteEstimate) || (isEstimate && isBestQuoteEstimate)) {
      return getBetterQuoteRate(quote, bestQuote)
    }

    // Pick the fixed quote
    if (!isEstimate) {
      return quote
    } else {
      // This has to be a fixed quote
      return bestQuote
    }
  })

  return best
}
