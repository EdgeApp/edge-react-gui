import * as React from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import { useHandler } from '../../hooks/useHandler'
import { useRampPlugins } from '../../hooks/useRampPlugins'
import { useRampQuotes } from '../../hooks/useRampQuotes'
import { useSupportedPlugins } from '../../hooks/useSupportedPlugins'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { FiatProviderError } from '../../plugins/gui/fiatProviderTypes'
import type {
  RampPlugin,
  RampQuote,
  RampQuoteRequest,
  SettlementRange
} from '../../plugins/ramps/rampPluginTypes'
import { useSelector } from '../../types/reactRedux'
import type { BuySellTabSceneProps } from '../../types/routerTypes'
import { getPaymentTypeIcon } from '../../util/paymentTypeIcons'
import { getPaymentTypeDisplayName } from '../../util/paymentTypeUtils'
import { logEvent } from '../../util/tracking'
import { AlertCardUi4 } from '../cards/AlertCard'
import { ErrorCard } from '../cards/ErrorCard'
import { PaymentOptionCard } from '../cards/PaymentOptionCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { SceneContainer } from '../layout/SceneContainer'
import { CardListModal } from '../modals/CardListModal'
import { ShimmerCard } from '../progress-indicators/ShimmerCard'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface RampSelectOptionParams {
  rampQuoteRequest: RampQuoteRequest
}

interface Props extends BuySellTabSceneProps<'rampSelectOption'> {}

export const RampSelectOptionScene: React.FC<Props> = (props: Props) => {
  const { route } = props
  const { rampQuoteRequest } = route.params
  const { direction } = rampQuoteRequest

  const theme = useTheme()
  const account = useSelector(state => state.core.account)
  // Get ramp plugins
  const { data: rampPluginArray = [], isLoading: isPluginsLoading } =
    useRampPlugins({ account })
  const rampPlugins = React.useMemo(() => {
    const map: Record<string, RampPlugin> = {}
    for (const plugin of rampPluginArray) {
      map[plugin.pluginId] = plugin
    }
    return map
  }, [rampPluginArray])

  const [isApprovingQuote, setIsApprovingQuote] = React.useState(false)

  // Use supported plugins hook
  const { supportedPlugins } = useSupportedPlugins({
    selectedWallet: rampQuoteRequest.wallet,
    selectedCrypto:
      rampQuoteRequest.wallet != null
        ? {
            pluginId: rampQuoteRequest.wallet.currencyInfo.pluginId,
            tokenId: rampQuoteRequest.tokenId
          }
        : undefined,
    selectedFiatCurrencyCode: rampQuoteRequest.fiatCurrencyCode.replace(
      'iso:',
      ''
    ),
    countryCode: rampQuoteRequest.regionCode?.countryCode,
    stateProvinceCode: rampQuoteRequest.regionCode?.stateProvinceCode,
    plugins: rampPlugins,
    direction: rampQuoteRequest.direction
  })

  // Use supported plugins
  const pluginsToUse = Object.fromEntries(
    supportedPlugins.map(result => [result.plugin.pluginId, result.plugin])
  )

  // Use the ramp quotes hook
  const {
    quotes: allQuotes,
    isLoading: isLoadingQuotes,
    isFetching: isFetchingQuotes,
    errors: failedQuotes
  } = useRampQuotes({
    rampQuoteRequest,
    plugins: pluginsToUse
  })

  const handleQuotePress = useHandler(
    async (quote: RampQuote): Promise<void> => {
      setIsApprovingQuote(true)
      try {
        await quote.approveQuote({
          coreWallet: rampQuoteRequest.wallet
        })
      } finally {
        setIsApprovingQuote(false)
      }
    }
  )

  // Get the best quote overall
  const bestQuoteOverall = allQuotes[0]

  // Group quotes by payment type and sort within each group
  const quotesByPaymentType = React.useMemo(() => {
    const grouped = new Map<string, RampQuote[]>()

    allQuotes.forEach(quote => {
      const paymentType = quote.paymentType
      const existing = grouped.get(paymentType) ?? []
      grouped.set(paymentType, [...existing, quote])
    })

    // Sort quotes within each payment type group
    grouped.forEach(quotes => {
      quotes.sort((a, b) => {
        const cryptoAmountA = parseFloat(a.cryptoAmount)
        const cryptoAmountB = parseFloat(b.cryptoAmount)

        // Guard against division by zero
        if (cryptoAmountA === 0 || cryptoAmountB === 0) {
          // If either crypto amount is zero, sort that quote to the end
          if (cryptoAmountA === 0 && cryptoAmountB === 0) return 0
          if (cryptoAmountA === 0) return 1
          return -1
        }

        const rateA = parseFloat(a.fiatAmount) / cryptoAmountA
        const rateB = parseFloat(b.fiatAmount) / cryptoAmountB
        return direction === 'sell' ? rateB - rateA : rateA - rateB
      })
    })

    return grouped
  }, [allQuotes, direction])

  // Only show loading state if we have no quotes to display
  const showLoadingState =
    isPluginsLoading || (isLoadingQuotes && allQuotes.length === 0)

  const headerTitle =
    direction === 'buy'
      ? lstrings.trade_option_buy_title
      : lstrings.trade_option_sell_title

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={headerTitle}>
        <SectionHeader
          leftTitle={lstrings.trade_option_select_payment_method}
          rightNode={
            isFetchingQuotes ? (
              <EdgeAnim enter={{ type: 'fadeIn', delay: 200 }}>
                <ActivityIndicator size="small" color={theme.primaryText} />
              </EdgeAnim>
            ) : undefined
          }
        />
        {showLoadingState ? (
          <>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </>
        ) : (
          <>
            {allQuotes.length === 0 && failedQuotes.length === 0 ? (
              <AlertCardUi4
                type="warning"
                title={
                  lstrings.trade_option_no_quotes_title ?? 'No quotes available'
                }
                body={
                  lstrings.trade_option_no_quotes_body ??
                  'Please try again later. No providers are currently available.'
                }
                marginRem={[0.5, 0.5]}
              />
            ) : null}
            {Array.from(quotesByPaymentType.entries()).map(
              ([paymentType, quotes]) => (
                <QuoteResult
                  key={paymentType}
                  quotes={quotes}
                  onPress={handleQuotePress}
                  bestQuoteOverall={bestQuoteOverall}
                  isApprovingQuote={isApprovingQuote}
                />
              )
            )}
            {failedQuotes.map(quoteError => {
              const error = quoteError.error
              if (error instanceof FiatProviderError) {
                // Ignore known FiatProviderErrors
                return null
              }

              // We should communicate all unknown errors to the user for
              // reporting purposes.
              return (
                <ErrorCard
                  key={`error-${quoteError.pluginId}`}
                  error={quoteError.error}
                />
              )
            })}
          </>
        )}
      </SceneContainer>
    </SceneWrapper>
  )
}

const QuoteResult: React.FC<{
  quotes: RampQuote[]
  onPress: (quote: RampQuote) => Promise<void>
  bestQuoteOverall?: RampQuote
  isApprovingQuote: boolean
}> = ({ quotes, onPress, bestQuoteOverall, isApprovingQuote }) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  // State for selected quote
  const [selectedQuoteIndex, setSelectedQuoteIndex] = React.useState(0)
  const selectedQuote = quotes[selectedQuoteIndex] as RampQuote | undefined

  const handlePress = useHandler(async () => {
    if (isApprovingQuote || selectedQuote == null) return
    await onPress(selectedQuote)
  })

  // Handle provider press - show modal to select between providers
  const handleProviderPress = useHandler(async () => {
    if (selectedQuote == null) return

    // Create items array for the CardListModal
    const items = quotes.map(quote => {
      // Format the quote amount display for each provider
      const fiatCurrencyCode = quote.fiatCurrencyCode.replace('iso:', '')
      const cryptoCurrencyCode = quote.displayCurrencyCode
      const formattedFiatAmount = formatNumber(quote.fiatAmount, { toFixed: 2 })

      // Show fiat → crypto for buy, crypto → fiat for sell
      const body =
        quote.direction === 'buy'
          ? `${formattedFiatAmount} ${fiatCurrencyCode} → ${quote.cryptoAmount} ${cryptoCurrencyCode}`
          : `${quote.cryptoAmount} ${cryptoCurrencyCode} → ${formattedFiatAmount} ${fiatCurrencyCode}`

      return {
        key: quote.pluginId,
        title: quote.pluginDisplayName,
        icon: quote.partnerIcon, // Already full path
        body
      }
    })

    const selectedKey = await Airship.show<string | undefined>(bridge => (
      <CardListModal
        bridge={bridge}
        title={lstrings.trade_option_choose_provider}
        items={items}
        selectedKey={selectedQuote.pluginId}
      />
    ))

    if (selectedKey != null) {
      const selectedIndex = quotes.findIndex(
        quote => quote.pluginId === selectedKey
      )
      if (selectedIndex !== -1) {
        const newQuote = quotes[selectedIndex]
        logEvent(
          newQuote.direction === 'buy'
            ? 'Buy_Quote_Change_Provider'
            : 'Sell_Quote_Change_Provider'
        )
        setSelectedQuoteIndex(selectedIndex)
      }
    }
  })

  if (quotes.length === 0 || selectedQuote == null) {
    return null
  }

  // Check if the currently selected quote is the best rate
  const isBestOption =
    bestQuoteOverall != null &&
    selectedQuote.pluginId === bestQuoteOverall.pluginId &&
    selectedQuote.paymentType === bestQuoteOverall.paymentType &&
    selectedQuote.fiatAmount === bestQuoteOverall.fiatAmount

  const fiatCurrencyCode = selectedQuote.fiatCurrencyCode.replace('iso:', '')
  const formattedSelectedFiatAmount = formatNumber(selectedQuote.fiatAmount, {
    toFixed: 2
  })

  // Get the icon for the payment type
  const paymentTypeIcon = getPaymentTypeIcon(selectedQuote.paymentType, theme)
  const icon = paymentTypeIcon ?? { uri: selectedQuote.partnerIcon }

  // Determine custom title rendering
  const customTitleKey = paymentTypeToCustomTitleKey[selectedQuote.paymentType]
  const defaultTitle = getPaymentTypeDisplayName(selectedQuote.paymentType)

  // Render custom title based on payment type
  let titleComponent: React.ReactNode
  switch (customTitleKey) {
    case 'applepay':
      // Per Apple branding guidelines, "Pay with" is NOT to be translated
      titleComponent = (
        <View style={styles.titleAppleContainer}>
          <EdgeText style={styles.titleText} numberOfLines={1}>
            {'Pay with '}
          </EdgeText>
          <Image
            style={styles.titleAppleLogo}
            source={paymentTypeLogoApplePay}
          />
        </View>
      )
      break
    default:
      titleComponent = (
        <EdgeText style={styles.titleText} numberOfLines={1}>
          {defaultTitle}
        </EdgeText>
      )
  }

  return (
    <PaymentOptionCard
      title={titleComponent}
      icon={icon}
      totalAmount={sprintf(
        lstrings.string_total_amount_s,
        `${formattedSelectedFiatAmount} ${fiatCurrencyCode} → ${selectedQuote.cryptoAmount} ${selectedQuote.displayCurrencyCode}`
      )}
      settlementTime={formatSettlementTime(selectedQuote.settlementRange)}
      partner={{
        displayName: selectedQuote.pluginDisplayName,
        icon: { uri: selectedQuote.partnerIcon }
      }}
      isBestOption={isBestOption}
      onPress={handlePress}
      onProviderPress={handleProviderPress}
    />
  )
}

// Styles via cacheStyles
const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  titleAppleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    flexShrink: 1
  },
  titleText: {
    fontFamily: theme.fontFaceMedium
  },
  titleAppleLogo: {
    height: theme.rem(1),
    width: 'auto',
    aspectRatio: 150 / 64,
    resizeMode: 'contain',
    marginBottom: 1
  }
}))

// Utility mapping for payment types to custom title keys
const paymentTypeToCustomTitleKey: Record<string, string> = {
  applepay: 'applepay'
  // Add other mappings as needed
}

// Format time unit for display
const formatTimeUnit = (time: { value: number; unit: string }): string => {
  const { value, unit } = time

  // Handle singular vs plural
  const unitLabel = value === 1 ? unit.slice(0, -1) : unit

  // Abbreviate common units
  const abbreviations: Record<string, string> = {
    minute: 'min',
    minutes: 'min',
    hour: 'hr',
    hours: 'hrs',
    day: 'day',
    days: 'days'
  }

  const displayUnit = abbreviations[unitLabel] ?? unitLabel
  return `${value} ${displayUnit}`
}

// Format settlement range for display
const formatSettlementTime = (range: SettlementRange): string => {
  // Handle instant settlement
  if (range.min.value === 0) {
    return `${lstrings.trade_option_settlement_label}: Instant`
  }

  const minStr = formatTimeUnit(range.min)
  const maxStr = formatTimeUnit(range.max)

  return `${lstrings.trade_option_settlement_label}: ${minStr} - ${maxStr}`
}
