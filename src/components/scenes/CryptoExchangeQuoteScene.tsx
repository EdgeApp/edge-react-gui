import { div, gte } from 'biggystring'
import { EdgeSwapQuote } from 'edge-core-js'
import React, { useEffect, useState } from 'react'
import { SectionList, TouchableOpacity, View, ViewStyle } from 'react-native'
import { sprintf } from 'sprintf-js'

import { exchangeTimerExpired, shiftCryptoCurrency } from '../../actions/CryptoExchangeActions'
import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getSwapPluginIconUri } from '../../util/CdnUris'
import { logEvent } from '../../util/tracking'
import { PoweredByCard } from '../cards/PoweredByCard'
import { EdgeAnim, fadeInDown30, fadeInDown60, fadeInDown90, fadeInDown120, fadeInUp30, fadeInUp60, fadeInUp90 } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SwapProviderRow } from '../data/row/SwapProviderRow'
import { ButtonsModal } from '../modals/ButtonsModal'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal'
import { CircleTimer } from '../progress-indicators/CircleTimer'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ExchangeQuote } from '../themed/ExchangeQuoteComponent'
import { LineTextDivider } from '../themed/LineTextDivider'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader'
import { Slider } from '../themed/Slider'
import { WalletListSectionHeader } from '../themed/WalletListSectionHeader'
import { AlertCardUi4 } from '../ui4/AlertCardUi4'
import { ModalUi4 } from '../ui4/ModalUi4'

export interface CryptoExchangeQuoteParams {
  selectedQuote: EdgeSwapQuote
  quotes: EdgeSwapQuote[]
  onApprove: () => void
}

interface Props extends EdgeSceneProps<'exchangeQuote'> {}

interface Section {
  title: { title: string; rightTitle: string }
  data: EdgeSwapQuote[]
}

export const CryptoExchangeQuoteScene = (props: Props) => {
  const { route, navigation } = props
  const { selectedQuote: initialSelectedQuote, quotes, onApprove } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const pending = useSelector(state => state.cryptoExchange.shiftPendingTransaction)

  const [selectedQuote, setSelectedQuote] = useState(initialSelectedQuote)
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
  const showFeeWarning = gte(feePercent, '0.05')

  useEffect(() => {
    const swapConfig = account.swapConfig[pluginId]

    dispatch(logEvent('Exchange_Shift_Quote'))
    swapVerifyTerms(swapConfig)
      .then(async result => {
        if (!result) await dispatch(exchangeTimerExpired(navigation, selectedQuote, onApprove))
      })
      .catch(err => showError(err))

    return () => {
      if (!calledApprove) selectedQuote.close().catch(err => showError(err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doShift = async () => {
    setCalledApprove(true)
    await dispatch(shiftCryptoCurrency(navigation, selectedQuote, onApprove))
  }

  const renderTimer = () => {
    const { expirationDate } = selectedQuote
    if (!expirationDate) return null
    return <CircleTimer timeExpired={async () => await dispatch(exchangeTimerExpired(navigation, selectedQuote, onApprove))} expiration={expirationDate} />
  }

  const renderRow = useHandler((item: { item: EdgeSwapQuote; section: Section; index: number }) => {
    const quote = item.item
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedQuote(quote)
          Airship.clear()
        }}
      >
        <SwapProviderRow quote={quote} />
      </TouchableOpacity>
    )
  })

  const renderSectionHeader = useHandler((sectionObj: { section: Section }) => {
    return <WalletListSectionHeader title={sectionObj.section.title.title} rightTitle={sectionObj.section.title.rightTitle} />
  })

  const handleItemLayout = useRowLayout()

  const handlePoweredByTap = useHandler(async () => {
    await Airship.show(bridge => (
      <ModalUi4 bridge={bridge} onCancel={() => bridge.resolve()}>
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
      </ModalUi4>
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
          <Slider parentStyle={styles.slider} onSlidingComplete={doShift} disabled={pending} showSpinner={pending} />
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
