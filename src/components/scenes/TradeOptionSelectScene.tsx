import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

// TradeOptionSelectScene - Updated layout for design requirements
import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import { lstrings } from '../../locales/strings'
import type {
  RampQuoteRequest,
  RampQuoteResult,
  SettlementRange
} from '../../plugins/ramps/rampPluginTypes'
import { useSelector } from '../../types/reactRedux'
import type { BuyTabSceneProps } from '../../types/routerTypes'
import type { Result } from '../../types/types'
import { getPaymentTypeIcon } from '../../util/paymentTypeIcons'
import { getPaymentTypeDisplayName } from '../../util/paymentTypeUtils'
import { AlertCardUi4 } from '../cards/AlertCard'
import { PaymentOptionCard } from '../cards/PaymentOptionCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { styled } from '../hoc/styled'
import { BestRateBadge } from '../icons/BestRateBadge'
import { SceneContainer } from '../layout/SceneContainer'
import { Shimmer } from '../progress-indicators/Shimmer'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface RampSelectOptionParams {
  rampQuoteRequest: RampQuoteRequest
  quotes?: RampQuoteResult[]
}

interface Props extends BuyTabSceneProps<'rampSelectOption'> {}

// Define error type for failed quotes
interface QuoteError {
  pluginId: string
  pluginDisplayName: string
  error: unknown
}

export const TradeOptionSelectScene = (props: Props): React.JSX.Element => {
  const { route } = props
  const { rampQuoteRequest, quotes: precomputedQuotes } = route.params

  const rampPlugins = useSelector(state => state.rampPlugins.plugins)
  const isPluginsLoading = useSelector(state => state.rampPlugins.isLoading)

  // Use TanStack Query to fetch quotes only if not provided
  const { data: quoteResults = [], isLoading: isLoadingQuotes } = useQuery<
    Array<Result<RampQuoteResult[], QuoteError>>
  >({
    queryKey: ['rampQuotes', rampQuoteRequest],
    queryFn: async () => {
      // Skip fetching if we already have quotes
      if (precomputedQuotes && precomputedQuotes.length > 0) {
        return []
      }

      if (Object.keys(rampPlugins).length === 0) {
        return []
      }

      const quotePromises = Object.values(rampPlugins).map(
        async (plugin): Promise<Result<RampQuoteResult[], QuoteError>> => {
          try {
            const quotes = await plugin.fetchQuote(rampQuoteRequest)
            return { ok: true, value: quotes }
          } catch (error) {
            console.warn(`Failed to get quote from ${plugin.pluginId}:`, error)
            return {
              ok: false,
              error: {
                pluginId: plugin.pluginId,
                pluginDisplayName: plugin.rampInfo.pluginDisplayName,
                error
              }
            }
          }
        }
      )

      return await Promise.all(quotePromises)
    },
    refetchOnMount: 'always',
    refetchInterval: 60000,
    enabled: !precomputedQuotes || precomputedQuotes.length === 0,
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 300000 // Keep in cache for 5 minutes
  })

  const handleQuotePress = async (quote: RampQuoteResult) => {
    try {
      await quote.approveQuote({
        coreWallet: rampQuoteRequest.wallet!
      })
    } catch (error) {
      console.error('Failed to approve quote:', error)
    }
  }

  // Use precomputed quotes if available, otherwise use fetched quotes
  const allQuotes: RampQuoteResult[] = React.useMemo(() => {
    if (precomputedQuotes && precomputedQuotes.length > 0) {
      return precomputedQuotes
    }

    return quoteResults
      .filter(
        (result): result is { ok: true; value: RampQuoteResult[] } => result.ok
      )
      .flatMap(result => result.value)
      .sort((a, b) => {
        const rateA = parseFloat(a.fiatAmount) / parseFloat(a.cryptoAmount)
        const rateB = parseFloat(b.fiatAmount) / parseFloat(b.cryptoAmount)
        return rateA - rateB
      })
  }, [precomputedQuotes, quoteResults])

  // Get the best quote overall
  const bestQuoteOverall = allQuotes[0]

  // Group quotes by payment type and sort within each group
  const quotesByPaymentType = React.useMemo(() => {
    const grouped = new Map<string, RampQuoteResult[]>()

    allQuotes.forEach(quote => {
      const paymentType = quote.paymentType
      const existing = grouped.get(paymentType) ?? []
      grouped.set(paymentType, [...existing, quote])
    })

    // Sort quotes within each payment type group
    grouped.forEach((quotes, paymentType) => {
      quotes.sort((a, b) => {
        const rateA = parseFloat(a.fiatAmount) / parseFloat(a.cryptoAmount)
        const rateB = parseFloat(b.fiatAmount) / parseFloat(b.cryptoAmount)
        return rateA - rateB
      })
    })

    return grouped
  }, [allQuotes])

  // Get failed quotes for error display
  const failedQuotes = quoteResults.filter(
    (result): result is { ok: false; error: QuoteError } => !result.ok
  )

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={lstrings.trade_option_buy_title}>
        <SectionHeader
          leftTitle={lstrings.trade_option_select_payment_method}
        />
        {isPluginsLoading || isLoadingQuotes ? (
          <>
            <ShimmerCard>
              <Shimmer />
            </ShimmerCard>
            <ShimmerCard>
              <Shimmer />
            </ShimmerCard>
            <ShimmerCard>
              <Shimmer />
            </ShimmerCard>
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
                />
              )
            )}
            {failedQuotes.map(result => {
              const errorMessage =
                result.error.error instanceof Error
                  ? result.error.error.message
                  : String(result.error.error)

              return (
                <AlertCardUi4
                  key={`error-${result.error.pluginId}`}
                  type="error"
                  title={sprintf(
                    lstrings.trade_option_provider_failed_s,
                    result.error.pluginDisplayName
                  )}
                  body={errorMessage}
                  marginRem={[0.5, 0.5]}
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
  quotes: RampQuoteResult[]
  onPress: (quote: RampQuoteResult) => Promise<void>
  bestQuoteOverall?: RampQuoteResult
}> = ({ quotes, onPress, bestQuoteOverall }) => {
  const theme = useTheme()

  // State for selected quote
  const [selectedQuoteIndex, setSelectedQuoteIndex] = React.useState(0)
  const selectedQuote = quotes[selectedQuoteIndex]

  if (quotes.length === 0 || selectedQuote == null) {
    return null
  }

  // Check if the currently selected quote is the best rate
  const isBestRate =
    bestQuoteOverall != null &&
    selectedQuote.pluginId === bestQuoteOverall.pluginId &&
    selectedQuote.paymentType === bestQuoteOverall.paymentType &&
    selectedQuote.fiatAmount === bestQuoteOverall.fiatAmount

  const fiatCurrencyCode = selectedQuote.fiatCurrencyCode.replace('iso:', '')

  // Get the icon for the payment type
  const paymentTypeIcon = getPaymentTypeIcon(selectedQuote.paymentType, theme)
  const icon = paymentTypeIcon ?? { uri: selectedQuote.partnerIcon }

  // Determine custom title rendering
  const paymentType = selectedQuote.paymentType
  const customTitleKey = paymentTypeToCustomTitleKey[paymentType]
  const defaultTitle = getPaymentTypeDisplayName(paymentType)

  // Render custom title based on payment type
  let titleComponent: React.ReactNode
  switch (customTitleKey) {
    case 'applepay':
      // Per Apple branding guidelines, "Pay with" is NOT to be translated
      titleComponent = (
        <TitleAppleContainer>
          <TitleText numberOfLines={1}>
            {/* eslint-disable-next-line react-native/no-raw-text */}
            {'Pay with '}
          </TitleText>
          <TitleAppleLogo source={paymentTypeLogoApplePay} />
        </TitleAppleContainer>
      )
      break
    default:
      titleComponent = <TitleText numberOfLines={1}>{defaultTitle}</TitleText>
  }

  // Handle provider press - show modal to select between providers
  const handleProviderPress = async () => {
    if (quotes.length <= 1) {
      // No other providers to choose from
      return
    }

    // TODO: Show modal to select provider
    // For now, cycle through providers
    const nextIndex = (selectedQuoteIndex + 1) % quotes.length
    setSelectedQuoteIndex(nextIndex)
  }

  return (
    <PaymentOptionCard
      title={titleComponent}
      icon={icon}
      totalAmount={sprintf(
        lstrings.string_total_amount_s,
        `${selectedQuote.fiatAmount} ${fiatCurrencyCode} → ${selectedQuote.cryptoAmount} ${selectedQuote.displayCurrencyCode}`
      )}
      settlementTime={formatSettlementTime(selectedQuote.settlementRange)}
      partner={{
        displayName: selectedQuote.pluginDisplayName,
        icon: { uri: selectedQuote.partnerIcon }
      }}
      renderRight={isBestRate ? () => <BestRateBadge /> : undefined}
      onPress={async () => {
        await onPress(selectedQuote)
      }}
      onProviderPress={handleProviderPress}
    />
  )
}

// Styled components for Apple Pay title
const TitleAppleContainer = styled(View)(() => ({
  flexDirection: 'row' as const,
  justifyContent: 'flex-start' as const,
  alignItems: 'flex-end' as const,
  flexShrink: 1
}))

const TitleText = styled(EdgeText)(theme => ({
  fontFamily: theme.fontFaceMedium
}))

const TitleAppleLogo = styled(Image)(theme => ({
  height: theme.rem(1),
  width: 'auto' as any,
  aspectRatio: 150 / 64,
  resizeMode: 'contain' as const,
  marginBottom: 1
}))

const ShimmerCard = styled(View)(theme => ({
  height: theme.rem(10),
  marginHorizontal: theme.rem(0.5),
  marginVertical: theme.rem(0.25),
  borderRadius: theme.cardBorderRadius,
  position: 'relative'
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
