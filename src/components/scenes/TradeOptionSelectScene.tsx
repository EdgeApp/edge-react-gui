import * as React from 'react'
import { ActivityIndicator, Image, View } from 'react-native'
import { sprintf } from 'sprintf-js'

// TradeOptionSelectScene - Updated layout for design requirements
import paymentTypeLogoApplePay from '../../assets/images/paymentTypes/paymentTypeLogoApplePay.png'
import { useRampQuotes } from '../../hooks/useRampQuotes'
import { useSupportedPlugins } from '../../hooks/useSupportedPlugins'
import { lstrings } from '../../locales/strings'
import type {
  RampQuoteRequest,
  RampQuoteResult,
  SettlementRange
} from '../../plugins/ramps/rampPluginTypes'
import { useSelector } from '../../types/reactRedux'
import type { BuyTabSceneProps } from '../../types/routerTypes'
import { getPaymentTypeIcon } from '../../util/paymentTypeIcons'
import { getPaymentTypeDisplayName } from '../../util/paymentTypeUtils'
import { AlertCardUi4 } from '../cards/AlertCard'
import { PaymentOptionCard } from '../cards/PaymentOptionCard'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { styled } from '../hoc/styled'
import { BestRateBadge } from '../icons/BestRateBadge'
import { SceneContainer } from '../layout/SceneContainer'
import { RadioListModal } from '../modals/RadioListModal'
import { Shimmer } from '../progress-indicators/Shimmer'
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

export interface RampSelectOptionParams {
  rampQuoteRequest: RampQuoteRequest
  quotes?: RampQuoteResult[]
}

interface Props extends BuyTabSceneProps<'rampSelectOption'> {}

export const TradeOptionSelectScene = (props: Props): React.JSX.Element => {
  const { route } = props
  const { rampQuoteRequest, quotes: precomputedQuotes } = route.params

  const theme = useTheme()
  const rampPlugins = useSelector(state => state.rampPlugins.plugins)
  const isPluginsLoading = useSelector(state => state.rampPlugins.isLoading)

  // Use supported plugins hook only if no precomputed quotes
  const { supportedPlugins } = useSupportedPlugins({
    selectedWallet: rampQuoteRequest.wallet,
    selectedCrypto: rampQuoteRequest.wallet
      ? {
          pluginId: rampQuoteRequest.pluginId,
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

  // Use precomputed quotes if available, otherwise use supported plugins
  const pluginsToUse = precomputedQuotes
    ? rampPlugins
    : Object.fromEntries(
        supportedPlugins.map(plugin => [plugin.pluginId, plugin])
      )

  // Use the new hook with precomputed quotes
  const {
    quotes: allQuotes,
    isLoading: isLoadingQuotes,
    isFetching: isFetchingQuotes,
    errors: failedQuotes
  } = useRampQuotes({
    rampQuoteRequest,
    plugins: pluginsToUse,
    precomputedQuotes
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
    grouped.forEach(quotes => {
      quotes.sort((a, b) => {
        const rateA = parseFloat(a.fiatAmount) / parseFloat(a.cryptoAmount)
        const rateB = parseFloat(b.fiatAmount) / parseFloat(b.cryptoAmount)
        return rateA - rateB
      })
    })

    return grouped
  }, [allQuotes])

  // Only show loading state if we have no quotes to display
  const showLoadingState =
    isPluginsLoading || (isLoadingQuotes && allQuotes.length === 0)

  return (
    <SceneWrapper scroll hasTabs>
      <SceneContainer headerTitle={lstrings.trade_option_buy_title}>
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
            {failedQuotes.map(error => {
              const errorMessage =
                error.error instanceof Error
                  ? error.error.message
                  : String(error.error)

              return (
                <AlertCardUi4
                  key={`error-${error.pluginId}`}
                  type="error"
                  title={sprintf(
                    lstrings.trade_option_provider_failed_s,
                    error.pluginDisplayName
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
  const customTitleKey = paymentTypeToCustomTitleKey[selectedQuote.paymentType]
  const defaultTitle = getPaymentTypeDisplayName(selectedQuote.paymentType)

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

    // Create items array for the RadioListModal
    const items = quotes.map(quote => {
      // Format the crypto amount for each provider
      // const localeAmount = formatNumber(toFixed(quote.cryptoAmount, 0, 6))
      const amount =
        quote.direction === 'buy' ? quote.fiatAmount : quote.cryptoAmount
      const currencyCode =
        quote.direction === 'buy'
          ? quote.fiatCurrencyCode.replace('iso:', '')
          : quote.displayCurrencyCode
      const text = `(${amount} ${currencyCode})`

      return {
        name: quote.pluginDisplayName,
        icon: quote.partnerIcon, // Already full path
        text
      }
    })

    const selectedName = await Airship.show<string | undefined>(bridge => (
      <RadioListModal
        bridge={bridge}
        title={lstrings.trade_option_choose_provider}
        items={items}
        selected={selectedQuote.pluginDisplayName}
      />
    ))

    if (selectedName != null) {
      const selectedIndex = quotes.findIndex(
        quote => quote.pluginDisplayName === selectedName
      )
      if (selectedIndex !== -1) {
        setSelectedQuoteIndex(selectedIndex)
      }
    }
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
      disableProviderButton={quotes.length <= 1}
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
