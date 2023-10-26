import { div, gte } from 'biggystring'
import { EdgeSwapQuote } from 'edge-core-js'
import React, { useEffect, useState } from 'react'
import { ScrollView, SectionList, TouchableOpacity, ViewStyle } from 'react-native'
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
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { SwapProviderRow } from '../data/row/SwapProviderRow'
import { ButtonsModal } from '../modals/ButtonsModal'
import { swapVerifyTerms } from '../modals/SwapVerifyTermsModal'
import { CircleTimer } from '../progress-indicators/CircleTimer'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { ExchangeQuote } from '../themed/ExchangeQuoteComponent'
import { LineTextDivider } from '../themed/LineTextDivider'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SceneHeader } from '../themed/SceneHeader'
import { Slider } from '../themed/Slider'
import { ThemedModal } from '../themed/ThemedModal'
import { WalletListSectionHeader } from '../themed/WalletListSectionHeader'

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

    logEvent('Exchange_Shift_Quote')
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
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve()}>
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
      </ThemedModal>
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
    <NotificationSceneWrapper hasTabs navigation={navigation} background="theme">
      {(gap, notificationHeight) => (
        <>
          <SceneHeader title={lstrings.title_exchange} underline withTopMargin />
          <ScrollView contentContainerStyle={[{ paddingBottom: notificationHeight }, styles.container]}>
            <LineTextDivider title={lstrings.fragment_send_from_label} lowerCased />
            {showFeeWarning && <Alert marginRem={[0, 1, 1.5, 1]} title={lstrings.transaction_details_fee_warning} type="warning" />}
            <ExchangeQuote quote={selectedQuote} fromTo="from" showFeeWarning={showFeeWarning} />
            <LineTextDivider title={lstrings.string_to_capitalize} lowerCased />
            <ExchangeQuote quote={selectedQuote} fromTo="to" />
            <PoweredByCard iconUri={getSwapPluginIconUri(selectedQuote.pluginId, theme)} poweredByText={exchangeName} onPress={handlePoweredByTap} />
            {selectedQuote.isEstimate && (
              <Alert
                title={lstrings.estimated_quote}
                message={lstrings.estimated_exchange_message}
                type="warning"
                marginRem={[1, 1]}
                onPress={handleForEstimateExplanation}
              />
            )}
            {selectedQuote.canBePartial === true && (
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
