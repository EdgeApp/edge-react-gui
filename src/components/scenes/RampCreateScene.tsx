import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { div, gt, mul, round, toBns } from 'biggystring'
import type {
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'
import { useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'
import { sprintf } from 'sprintf-js'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import {
  setRampCryptoSelection,
  setRampFiatCurrencyCode
} from '../../actions/SettingsActions'
import { COUNTRY_CODES, FIAT_COUNTRY } from '../../constants/CountryConstants'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useRampLastCryptoSelection } from '../../hooks/useRampLastCryptoSelection'
import { useRampPlugins } from '../../hooks/useRampPlugins'
import { useRampPreferredProviders } from '../../hooks/useRampPreferredProviders'
import { useRampQuotes } from '../../hooks/useRampQuotes'
import {
  type SupportedPluginResult,
  useSupportedPlugins
} from '../../hooks/useSupportedPlugins'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import type { FiatPaymentType } from '../../plugins/gui/fiatPluginTypes'
import type {
  RampPlugin,
  RampQouteAmount,
  RampQuote,
  RampQuoteRequest
} from '../../plugins/ramps/rampPluginTypes'
import { getBestQuoteError } from '../../plugins/ramps/utils/getBestError'
import { getRateFromRampQuoteResult } from '../../plugins/ramps/utils/getRateFromRampQuoteResult'
import {
  getBestRateRampQuote,
  rampQuoteHasAmounts,
  type RampQuotePriority
} from '../../plugins/ramps/utils/rampQuotePriority'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type {
  BuySellTabSceneProps,
  NavigationBase
} from '../../types/routerTypes'
import type { GuiFiatType } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getHistoricalFiatRate } from '../../util/exchangeRates'
import { isAssetNativeToChain } from '../../util/isAbstractedAssetChain'
import { logEvent } from '../../util/tracking'
import {
  convertNativeToDenomination,
  DECIMAL_PRECISION,
  mulToPrecision
} from '../../util/utils'
import { DropdownInputButton } from '../buttons/DropdownInputButton'
import { EdgeButton } from '../buttons/EdgeButton'
import { KavButtons } from '../buttons/KavButtons'
import { CountryStateButton } from '../buttons/RegionButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { ErrorCard, I18nError } from '../cards/ErrorCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { FiatIcon } from '../icons/FiatIcon'
import { SceneContainer } from '../layout/SceneContainer'
import { FiatListModal } from '../modals/FiatListModal'
import {
  WalletListModal,
  type WalletListResult,
  type WalletListWalletResult
} from '../modals/WalletListModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'
import { RampRegionSelect } from './RampCreateScene/RampRegionSelect'

export interface RampCreateParams {
  forcedWalletResult?: WalletListWalletResult
  regionCode?: string
  /**
   * Ramp provider to pin to the top of the quote results for this navigation
   * only, from an `edge://buy/<providerId>` style deep link. Nothing is written
   * to the account referral state, and a provider that returns no quotes falls
   * back to the normal ordering.
   */
  providerId?: string
  /** Payment type to pin to the top, with the same link-scoped semantics. */
  paymentType?: FiatPaymentType
}

type Props = (
  | BuySellTabSceneProps<'pluginListBuy'>
  | BuySellTabSceneProps<'pluginListSell'>
) & {
  direction: 'buy' | 'sell'
}

export const RampCreateScene: React.FC<Props> = (props: Props) => {
  const { direction, navigation, route } = props
  const {
    regionCode: initialRegionCode,
    forcedWalletResult,
    providerId: pinnedProviderId,
    paymentType: pinnedPaymentType
  } = route?.params ?? {}

  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const isLightAccount = account.username == null

  const rampLastFiatCurrencyCode = useSelector(
    state => state.ui.settings.rampLastFiatCurrencyCode
  )

  // State for trade form
  const [amountQuery, setAmountQuery] = useState<
    RampQouteAmount | { empty: true }
  >({ empty: true })
  const [lastUsedInput, setLastUsedInput] = useState<'fiat' | 'crypto' | null>(
    null
  )
  const [pendingMaxNav, setPendingMaxNav] = useState(false)
  // A monotonic id for the in-flight max flow, bumped synchronously (unlike the
  // `pendingMaxNav` state). handleMaxPress captures the id for its request; any
  // later Max, or a wallet/fiat switch that cancels the flow, increments it.
  // The async sell max handler applies its result only if its captured id is
  // still current, so a stale in-flight getMaxSpendExchangeAmount (e.g. for a
  // since-switched asset, or a superseded earlier request) is discarded. A
  // plain boolean cannot distinguish which request is current.
  const maxRequestIdRef = React.useRef(0)
  // True while a wallet/fiat picker modal is open. The transient max flow's
  // auto-navigation is suspended while a picker is open so a max quote that
  // resolves mid-selection cannot navigate out from under the modal; the max
  // keeps computing and navigates once the picker closes. A counter (not a
  // bare boolean) tolerates overlapping shows without clearing early.
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const pickerOpenCountRef = React.useRef(0)
  // True while the (possibly slow) sell max amount is being computed, so the
  // Max control can show a spinner and disable itself instead of leaving the
  // scene blank and Max re-tappable during the await.
  const [isComputingMax, setIsComputingMax] = useState(false)
  const hasAppliedInitialAmount = React.useRef(false)

  // Selected currencies
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const selectedFiatCurrencyCode = rampLastFiatCurrencyCode ?? defaultFiat

  const {
    selection: rampLastCryptoSelection,
    isLoading: isLoadingPersistedCryptoSelection
  } = useRampLastCryptoSelection()

  const selectedCrypto = forcedWalletResult ?? rampLastCryptoSelection

  const [selectedWallet, selectedCryptoCurrencyCode] =
    selectedCrypto != null
      ? [
          currencyWallets[selectedCrypto.walletId],
          getCurrencyCode(
            currencyWallets[selectedCrypto.walletId],
            selectedCrypto?.tokenId ?? null
          )
        ]
      : [undefined, undefined]

  // Append chain name for tokens and L2-native assets like Optimism ETH
  function getSelectedCryptoDisplay(): string | undefined {
    if (selectedCrypto == null) return
    if (selectedWallet == null) return
    if (selectedCryptoCurrencyCode == null) return

    return isAssetNativeToChain(
      selectedWallet.currencyInfo,
      selectedCrypto.tokenId
    )
      ? selectedCryptoCurrencyCode
      : `${selectedCryptoCurrencyCode} (${selectedWallet.currencyInfo.displayName})`
  }

  // Get the select crypto denomination for exchange rate
  const denomination = React.useMemo(() => {
    if (selectedCrypto == null || selectedWallet == null) return null
    if (selectedCrypto.tokenId == null) {
      return selectedWallet.currencyInfo.denominations[0]
    } else {
      return selectedWallet.currencyConfig.allTokens[selectedCrypto.tokenId]
        .denominations[0]
    }
  }, [selectedCrypto, selectedWallet])

  //  Get user's current country settings
  const { countryCode, stateProvinceCode } = useSelector(
    state => state.ui.settings
  )

  const countryData = COUNTRY_CODES.find(c => c['alpha-2'] === countryCode)

  // Determine whether to show the region selection scene variant.
  // Show if: no country, invalid country, or country requires state but none selected
  const countryRequiresState = countryData?.stateProvinces != null
  const shouldShowRegionSelect =
    initialRegionCode == null &&
    (countryCode === '' ||
      countryData == null ||
      (countryRequiresState && stateProvinceCode == null))

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

  // Use supported plugins hook
  const {
    supportedPlugins,
    isLoading: isCheckingSupport,
    error: supportedPluginsError
  } = useSupportedPlugins({
    selectedWallet,
    selectedCrypto:
      selectedCrypto != null && selectedWallet != null
        ? {
            pluginId: selectedWallet.currencyInfo.pluginId,
            tokenId: selectedCrypto.tokenId
          }
        : undefined,
    selectedFiatCurrencyCode, // Without 'iso:' prefix
    countryCode,
    stateProvinceCode,
    plugins: rampPlugins,
    direction
  })

  // Compute fiat flag URL for selected fiat currency code
  const selectedFiatFlagUri = React.useMemo(() => {
    const info = FIAT_COUNTRY[selectedFiatCurrencyCode?.toUpperCase() ?? '']
    return info?.logoUrl ?? ''
  }, [selectedFiatCurrencyCode])

  // Determine which input types should be disabled
  const amountTypeSupport = getAmountTypeSupport(supportedPlugins)

  const { data: fiatUsdRate } = useQuery({
    queryKey: ['fiatUsdRate', selectedFiatCurrencyCode],
    queryFn: async () => {
      const isoNow = new Date().toISOString()
      const rate = await getHistoricalFiatRate(
        selectedFiatCurrencyCode,
        'iso:USD',
        isoNow
      ).catch(() => 1)
      // Avoid division by zero
      if (rate === 0) return '1'
      return toBns(rate)
    }
  })

  // On first entry, initialize the fiat amount to approximately $500 USD
  React.useEffect(() => {
    if (fiatUsdRate == null) return
    let abort = false
    const applyInitial = async (): Promise<void> => {
      if (abort || direction !== 'buy') return
      // Don't override if the user has started typing or fiat input is disabled
      if (
        hasAppliedInitialAmount.current ||
        amountTypeSupport.onlyCrypto ||
        !('empty' in amountQuery) ||
        lastUsedInput != null ||
        shouldShowRegionSelect
      ) {
        return
      }

      // Only apply when we have a wallet and crypto code to fetch quotes against
      if (selectedWallet == null || selectedCryptoCurrencyCode == null) return

      const startingFiatAmount = isLightAccount ? '50' : '500'

      // Convert from USD default into local fiat using legacy rounding rules
      const initialFiat = getRoundedFiatEquivalent(
        startingFiatAmount,
        fiatUsdRate
      )

      hasAppliedInitialAmount.current = true
      setAmountQuery({ exchangeAmount: initialFiat })
      setLastUsedInput('fiat')
    }

    applyInitial().catch(() => {})
    return () => {
      abort = true
    }
  }, [
    amountTypeSupport.onlyCrypto,
    isLightAccount,
    lastUsedInput,
    selectedWallet,
    selectedCryptoCurrencyCode,
    selectedFiatCurrencyCode,
    shouldShowRegionSelect,
    fiatUsdRate,
    amountQuery,
    direction
  ])

  // Create rampQuoteRequest based on current form state
  const rampQuoteRequest: RampQuoteRequest | null = React.useMemo(() => {
    if (
      selectedWallet == null ||
      selectedCryptoCurrencyCode == null ||
      lastUsedInput == null ||
      'empty' in amountQuery ||
      countryCode === ''
    ) {
      return null
    }

    // Guard against creating request with disabled input type
    if (
      (lastUsedInput === 'fiat' && amountTypeSupport.onlyCrypto) ||
      (lastUsedInput === 'crypto' && amountTypeSupport.onlyFiat)
    ) {
      return null
    }

    // Early-branch: For sell with crypto-entered amount exceeding balance, do not fetch quotes
    if (
      direction === 'sell' &&
      lastUsedInput === 'crypto' &&
      denomination != null &&
      !('max' in amountQuery || 'maxExchangeAmount' in amountQuery)
    ) {
      const tokenId: EdgeTokenId = selectedCrypto?.tokenId ?? null
      const nativeBalance = selectedWallet.balanceMap.get(tokenId) ?? '0'
      const walletCryptoAmount = convertNativeToDenomination(
        denomination.multiplier
      )(nativeBalance)
      if (gt(amountQuery.exchangeAmount, walletCryptoAmount)) return null
    }

    return {
      wallet: selectedWallet,
      pluginId: selectedWallet.currencyInfo.pluginId,
      tokenId: selectedCrypto?.tokenId ?? null,
      displayCurrencyCode: selectedCryptoCurrencyCode,
      amountQuery,
      fiatCurrencyCode: selectedFiatCurrencyCode,
      amountType: lastUsedInput,
      direction,
      regionCode: {
        countryCode,
        stateProvinceCode
      }
    }
  }, [
    selectedWallet,
    selectedCryptoCurrencyCode,
    selectedCrypto,
    amountQuery,
    selectedFiatCurrencyCode,
    lastUsedInput,
    countryCode,
    stateProvinceCode,
    amountTypeSupport.onlyCrypto,
    amountTypeSupport.onlyFiat,
    direction,
    denomination
  ])

  // Providers this account's affiliation prefers, from the info server
  const preferredProviderIds = useRampPreferredProviders(direction)

  // A provider pinned by the deep link outranks the affiliate preference
  const quotePriority: RampQuotePriority = React.useMemo(
    () => ({
      preferPluginIds:
        pinnedProviderId == null
          ? preferredProviderIds
          : [
              pinnedProviderId,
              ...preferredProviderIds.filter(id => id !== pinnedProviderId)
            ],
      preferPaymentType: pinnedPaymentType
    }),
    [pinnedProviderId, pinnedPaymentType, preferredProviderIds]
  )

  // Fetch quotes using the custom hook
  const {
    quotes: allQuotes,
    isLoading: isLoadingQuotes,
    isFetching: isFetchingQuotes,
    errors: quoteErrors
  } = useRampQuotes({
    rampQuoteRequest,
    plugins: Object.fromEntries(
      supportedPlugins.map(result => [result.plugin.pluginId, result.plugin])
    ),
    priority: quotePriority
  })

  // The scene's exchange rate and light-account purchase limit are claims about
  // the rate, so they read the best-rate quote rather than the first
  // prioritized one, which is whatever the link or the affiliate config pinned.
  const bestQuote = React.useMemo(
    () => getBestRateRampQuote(allQuotes, direction),
    [allQuotes, direction]
  )

  // For Max flow, select the quote with the largest supported amount
  const maxQuoteForMaxFlow = React.useMemo(() => {
    if (
      !('max' in amountQuery || 'maxExchangeAmount' in amountQuery) ||
      allQuotes.length === 0
    )
      return null

    const quotesWithAmounts = allQuotes.filter(rampQuoteHasAmounts)
    if (quotesWithAmounts.length === 0) return null

    const picked = quotesWithAmounts.reduce((a, b): RampQuote => {
      const aAmount = lastUsedInput === 'crypto' ? a.cryptoAmount : a.fiatAmount
      const bAmount = lastUsedInput === 'crypto' ? b.cryptoAmount : b.fiatAmount
      return gt(bAmount, aAmount) ? b : a
    })
    return picked
  }, [amountQuery, allQuotes, lastUsedInput])

  // Calculate exchange rate from best quote
  const quoteExchangeRate = React.useMemo(() => {
    if (bestQuote == null || !rampQuoteHasAmounts(bestQuote)) return 0

    try {
      const cryptoAmount = parseFloat(bestQuote.cryptoAmount)
      const fiatAmount = parseFloat(bestQuote.fiatAmount)

      // Check for division by zero or invalid numbers
      if (
        cryptoAmount === 0 ||
        !isFinite(cryptoAmount) ||
        !isFinite(fiatAmount)
      ) {
        return 0
      }

      return fiatAmount / cryptoAmount
    } catch {
      return 0
    }
  }, [bestQuote])

  // Compute insufficient funds error for non-max sell path
  const insufficientFundsError = React.useMemo(() => {
    if (direction !== 'sell') return null
    if (selectedWallet == null) return null
    if (selectedCrypto == null) return null
    if (denomination == null) return null
    if ('empty' in amountQuery) return null
    if ('max' in amountQuery) return null
    if ('maxExchangeAmount' in amountQuery) return null
    if (lastUsedInput == null) return null

    // Determine requested crypto amount
    let requestedCryptoAmount: string | null = null
    if (lastUsedInput === 'crypto') {
      requestedCryptoAmount = amountQuery.exchangeAmount
    } else if (lastUsedInput === 'fiat') {
      if (quoteExchangeRate === 0) return null
      requestedCryptoAmount = div(
        amountQuery.exchangeAmount,
        quoteExchangeRate.toString(),
        DECIMAL_PRECISION
      )
    }
    if (requestedCryptoAmount == null) return null

    const tokenId: EdgeTokenId = selectedCrypto.tokenId ?? null
    const nativeBalance = selectedWallet.balanceMap.get(tokenId) ?? '0'
    const walletCryptoAmount = convertNativeToDenomination(
      denomination.multiplier
    )(nativeBalance)

    if (gt(requestedCryptoAmount, walletCryptoAmount)) {
      return new I18nError(
        lstrings.exchange_insufficient_funds_title,
        lstrings.exchange_insufficient_funds_below_balance
      )
    }
    return null
  }, [
    direction,
    selectedWallet,
    selectedCrypto,
    denomination,
    amountQuery,
    lastUsedInput,
    quoteExchangeRate
  ])

  // Derived state for display values
  const displayFiatAmount = React.useMemo(() => {
    // Don't show any value if fiat input is disabled
    if (amountTypeSupport.onlyCrypto) return ''
    if ('empty' in amountQuery) return ''

    if ('max' in amountQuery || 'maxExchangeAmount' in amountQuery) {
      return maxQuoteForMaxFlow?.fiatAmount ?? ''
    }

    if (lastUsedInput === 'fiat') {
      // User entered fiat, show raw value (FilledTextInput will format it)
      return amountQuery.exchangeAmount
    } else if (lastUsedInput === 'crypto') {
      // Avoid division by zero
      if (quoteExchangeRate === 0) return ''
      // User entered crypto, convert to fiat only if we have a quote
      return div(
        mul(amountQuery.exchangeAmount, quoteExchangeRate.toString()),
        '1',
        2
      )
    } else {
      return ''
    }
  }, [
    amountTypeSupport.onlyCrypto,
    maxQuoteForMaxFlow,
    amountQuery,
    lastUsedInput,
    quoteExchangeRate
  ])

  const displayCryptoAmount = React.useMemo(() => {
    // Don't show any value if crypto input is disabled
    if (amountTypeSupport.onlyFiat) return ''
    if ('empty' in amountQuery || lastUsedInput === null) return ''

    if ('max' in amountQuery) {
      return maxQuoteForMaxFlow?.cryptoAmount ?? ''
    }
    if ('maxExchangeAmount' in amountQuery) {
      return maxQuoteForMaxFlow?.cryptoAmount ?? amountQuery.maxExchangeAmount
    }

    if (lastUsedInput === 'crypto') {
      // User entered crypto, show raw value (FilledTextInput will format it)
      return amountQuery.exchangeAmount
    } else if (lastUsedInput === 'fiat') {
      // Avoid division by zero
      if (quoteExchangeRate === 0) return ''
      const decimals =
        denomination != null
          ? mulToPrecision(denomination.multiplier)
          : DECIMAL_PRECISION
      // User entered fiat, convert to crypto only if we have a quote
      return div(
        amountQuery.exchangeAmount,
        quoteExchangeRate.toString(),
        decimals
      )
    } else {
      return ''
    }
  }, [
    amountTypeSupport.onlyFiat,
    maxQuoteForMaxFlow,
    amountQuery,
    lastUsedInput,
    quoteExchangeRate,
    denomination
  ])

  // Log the quote event only when the scene is focused
  useFocusEffect(() => {
    dispatch(logEvent(direction === 'buy' ? 'Buy_Quote' : 'Sell_Quote'))
  })

  // Drop the deep link pin when the user leaves the buy/sell tab. React
  // Navigation keeps route params on the tab's route for the whole app
  // session, so leaving them in place would pin every later visit to the tab,
  // not just the flow the link opened. The listener is on the TAB, so stepping
  // forward to the option list and back keeps the pin: only leaving the tab
  // ends it. Subscribing on `navigation` alone (never on the params) also
  // keeps a warm deep link that arrives while the tab is focused from being
  // cleared by a re-subscription.
  // The pins are read through a ref so the guard below can see them without
  // entering the dep array, which is what the `navigation`-only subscription
  // above depends on.
  const pinsRef = React.useRef({ pinnedProviderId, pinnedPaymentType })
  pinsRef.current = { pinnedProviderId, pinnedPaymentType }

  React.useEffect(() => {
    const tabNavigation = navigation.getParent()
    if (tabNavigation == null) return
    return tabNavigation.addListener('blur', () => {
      const { pinnedProviderId, pinnedPaymentType } = pinsRef.current
      // Nothing to drop: tab switching is the app's most-travelled path, and a
      // user who never tapped a deep link would otherwise pay a params update
      // plus a re-render every time they leave the tab.
      if (pinnedProviderId == null && pinnedPaymentType == null) return
      navigation.setParams({
        providerId: undefined,
        paymentType: undefined
      })
    })
  }, [navigation])

  //
  // Handlers
  //

  // Cancel any in-flight transient max flow: bump the request id so a pending
  // getMaxSpendExchangeAmount is discarded when it resolves, and reset the
  // transient UI state (auto-nav arm + computing spinner). Centralized so every
  // cancel path (manual edit, wallet/fiat switch) clears the spinner too,
  // rather than leaving it up until the superseded (possibly slow) max resolves.
  const cancelPendingMax = (): void => {
    maxRequestIdRef.current += 1
    setPendingMaxNav(false)
    setIsComputingMax(false)
  }

  // Run an async operation that opens a modal while marking a picker as open,
  // so the transient max flow's auto-navigation effect stays suspended for the
  // modal's lifetime. A counter (not a bare boolean) tolerates overlapping
  // shows without clearing early.
  const withPickerOpen = async <T,>(run: () => Promise<T>): Promise<T> => {
    pickerOpenCountRef.current += 1
    setIsPickerOpen(true)
    try {
      return await run()
    } finally {
      pickerOpenCountRef.current -= 1
      if (pickerOpenCountRef.current === 0) setIsPickerOpen(false)
    }
  }

  // Show an Airship picker modal under withPickerOpen (see above).
  const showPickerModal = async <T,>(
    render: (bridge: AirshipBridge<T>) => React.ReactElement
  ): Promise<T> =>
    await withPickerOpen(async () => await Airship.show<T>(render))

  const handleRegionSelect = useHandler(async () => {
    // Track the region modal as an open picker too, so a max quote resolving
    // mid-selection can't auto-navigate out from under it.
    await withPickerOpen(async () => {
      await dispatch(
        showCountrySelectionModal({
          account,
          countryCode: countryCode !== '' ? countryCode : '',
          stateProvinceCode
        })
      )
    })
  })

  const handleCryptDropdown = useHandler(async () => {
    if (account == null) return
    const result = await showPickerModal<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={navigation as NavigationBase}
        headerTitle={lstrings.select_wallet}
        showCreateWallet
        allowKeysOnlyMode
        filterActivation
      />
    ))
    if (result?.type === 'wallet') {
      if (
        rampLastCryptoSelection?.walletId === result.walletId &&
        rampLastCryptoSelection?.tokenId === result.tokenId
      ) {
        return
      }

      // Clear amount and max state when switching crypto assets in sell mode
      cancelPendingMax()
      if (direction === 'sell') {
        setAmountQuery({ empty: true })
        setLastUsedInput(null)
      }

      await dispatch(
        setRampCryptoSelection(account, {
          walletId: result.walletId,
          tokenId: result.tokenId
        })
      )
    }
  })

  const handleFiatDropdown = useHandler(async () => {
    if (account == null) return
    const result = await showPickerModal<GuiFiatType>(bridge => (
      <FiatListModal bridge={bridge} />
    ))
    if (result != null && account != null) {
      // Compare against the resolved displayed fiat, not the raw persisted
      // rampLastFiatCurrencyCode (which is unset while the default fiat is
      // shown). Otherwise re-selecting the displayed default would read as a
      // change and wrongly cancel an in-flight Max.
      if (result.value !== selectedFiatCurrencyCode) {
        // Cancel any in-flight max flow only on a confirmed fiat change, so
        // opening then dismissing the picker (or re-selecting the same fiat)
        // leaves a pending Max running (mirrors handleCryptDropdown).
        cancelPendingMax()
        await dispatch(setRampFiatCurrencyCode(account, result.value))
      }
    }
  })

  const handleNext = useHandler(() => {
    // This handler shouldn't be invoked if these conditions aren't met:
    if (
      selectedWallet == null ||
      selectedCryptoCurrencyCode == null ||
      lastUsedInput == null ||
      'empty' in amountQuery ||
      rampQuoteRequest == null
    ) {
      return
    }

    if (isLightAccount) {
      // This should have loaded by now
      if (fiatUsdRate == null || bestQuote == null) return
      if (!rampQuoteHasAmounts(bestQuote)) return
      const maximumFiatAmount = getRoundedFiatEquivalent('50', fiatUsdRate)
      if (gt(bestQuote.fiatAmount, maximumFiatAmount)) {
        showToast(
          sprintf(
            lstrings.fiat_plugin_purchase_limit_error_2s,
            maximumFiatAmount,
            selectedFiatCurrencyCode
          )
        )
        return
      }
    }

    dispatch(
      logEvent(direction === 'buy' ? 'Buy_Quote_Next' : 'Sell_Quote_Next')
    )

    navigation.navigate('rampSelectOption', {
      rampQuoteRequest,
      providerId: pinnedProviderId,
      paymentType: pinnedPaymentType
    })
  })

  const exchangeRateText = React.useMemo(() => {
    return getRateFromRampQuoteResult(bestQuote, selectedFiatCurrencyCode)
  }, [bestQuote, selectedFiatCurrencyCode])

  const handleFiatChangeText = useHandler((amount: string) => {
    // A manual edit supersedes any in-flight max: cancel it so a delayed max
    // result can't overwrite the typed amount or auto-navigate on the max.
    // (Programmatic clears in handleMaxPress use setNativeProps and do not
    // fire onChangeText, so this only runs on real user input.)
    cancelPendingMax()
    setAmountQuery(amount === '' ? { empty: true } : { exchangeAmount: amount })
    setLastUsedInput('fiat')
  })

  const handleCryptoChangeText = useHandler((amount: string) => {
    // See handleFiatChangeText: a manual edit cancels any in-flight max.
    cancelPendingMax()
    setAmountQuery(amount === '' ? { empty: true } : { exchangeAmount: amount })
    setLastUsedInput('crypto')
  })

  const handleMaxPress = useHandler(async () => {
    // Preconditions to submit a max request
    if (
      countryCode === '' ||
      denomination == null ||
      selectedCrypto == null ||
      selectedCryptoCurrencyCode == null ||
      selectedWallet == null
    ) {
      return
    }
    // Ignore taps while a sell max is already computing (the button is also
    // disabled meanwhile) so overlapping max requests can't stack up.
    if (isComputingMax) return

    // Trigger a transient max flow: request quotes and auto-navigate when ready.
    // Do NOT flip `lastUsedInput` before the amount query is set to the max
    // marker. For sell, computing the max is async; if `lastUsedInput` became
    // 'crypto' while `amountQuery` still held the previously entered fiat
    // amount, `displayCryptoAmount` would render that fiat value in the crypto
    // field (e.g. "100 USD" shown as "100 BTC"). Set the max amount query first
    // so the display memos take their max branch, then set the input type.
    const maxRequestId = ++maxRequestIdRef.current
    setPendingMaxNav(true)

    if (direction === 'sell') {
      // Clear the entered amount synchronously so the scene shows no stale
      // fiat quote and Next stays disabled while the (possibly slow) max
      // computes. Without this the pre-Max fiat amount keeps rampQuoteRequest
      // live, so Next could navigate on the old amount mid-await and the flow
      // could auto-navigate on both the old and the max quotes.
      setAmountQuery({ empty: true })
      setLastUsedInput(null)
      setIsComputingMax(true)
      try {
        const maxSpendExchangeAmount = await getMaxSpendExchangeAmount(
          selectedWallet,
          selectedCrypto.tokenId,
          denomination
        )
        // Discard the result if a newer Max, or a wallet/fiat switch that
        // cancelled the flow, superseded this request while
        // getMaxSpendExchangeAmount was in flight: this (now stale) max belongs
        // to the previously selected asset.
        if (maxRequestIdRef.current !== maxRequestId) return
        setAmountQuery({
          maxExchangeAmount: maxSpendExchangeAmount
        })
        setLastUsedInput('crypto')
      } catch (error) {
        // getMaxSpendExchangeAmount can reject (e.g. wallet RPC failure). The
        // amount was cleared synchronously above, so without recovery the
        // scene would be stuck empty with auto-nav still armed. Cancel the
        // pending max and surface the error so the user can retry. Skip if a
        // newer request already superseded this one (it owns the state now).
        if (maxRequestIdRef.current !== maxRequestId) return
        setPendingMaxNav(false)
        showError(error)
      } finally {
        // Always clear the computing spinner: only one max computes at a time
        // (the entry guard + disabled button prevent overlap), so there is no
        // newer compute whose spinner this could wrongly clear. An unconditional
        // clear also prevents a stuck spinner when a wallet/fiat switch bumps the
        // request id mid-await (that path never resets isComputingMax itself).
        setIsComputingMax(false)
      }
    } else {
      setAmountQuery({
        max: true
      })
      setLastUsedInput('fiat')
    }
  })

  // Auto-navigate once a best quote arrives for the transient max flow
  React.useEffect(() => {
    const isMaxRequest =
      rampQuoteRequest != null &&
      ('max' in rampQuoteRequest.amountQuery ||
        'maxExchangeAmount' in rampQuoteRequest.amountQuery)
    if (
      pendingMaxNav &&
      isMaxRequest &&
      maxQuoteForMaxFlow != null &&
      !isLoadingQuotes &&
      // Hold navigation while a picker modal is open so the max flow can't
      // navigate out from under it; the effect re-runs and navigates once the
      // picker closes (isPickerOpen returns to false).
      !isPickerOpen
    ) {
      navigation.navigate('rampSelectOption', {
        rampQuoteRequest,
        providerId: pinnedProviderId,
        paymentType: pinnedPaymentType
      })
      // Reset transient state to avoid leaving the scene in a max "mode"
      setPendingMaxNav(false)
    }
  }, [
    pinnedProviderId,
    pinnedPaymentType,
    pendingMaxNav,
    isPickerOpen,
    maxQuoteForMaxFlow,
    isLoadingQuotes,
    rampQuoteRequest,
    navigation,
    amountTypeSupport.onlyCrypto,
    amountTypeSupport.onlyFiat,
    amountQuery,
    selectedWallet,
    selectedCrypto
  ])

  const headerTitle =
    direction === 'buy' ? lstrings.buy_crypto : lstrings.sell_crypto

  // This means we're still loading all the data needed before showing a result (quote or error)
  const isResultLoading =
    isPluginsLoading || isCheckingSupport || isLoadingQuotes || isFetchingQuotes

  const errorForDisplay = React.useMemo(() => {
    // Prioritize showing insufficient funds on sell flow even while loading
    if (insufficientFundsError != null) return insufficientFundsError

    if (
      isResultLoading ||
      allQuotes.length !== 0 ||
      supportedPlugins.length === 0 ||
      'empty' in amountQuery
    ) {
      return null
    }

    // Prefer specific supported-plugins error if present
    if (supportedPluginsError != null) return supportedPluginsError

    if (quoteErrors.length > 0) {
      const best = getBestQuoteError(
        quoteErrors.map(quoteError => quoteError.error),
        lastUsedInput === 'crypto'
          ? selectedCryptoCurrencyCode ?? selectedFiatCurrencyCode ?? ''
          : selectedFiatCurrencyCode,
        direction
      )

      return best
    }

    return null
  }, [
    isResultLoading,
    allQuotes.length,
    supportedPlugins.length,
    amountQuery,
    supportedPluginsError,
    quoteErrors,
    lastUsedInput,
    selectedCryptoCurrencyCode,
    selectedFiatCurrencyCode,
    direction,
    insufficientFundsError
  ])

  // Render region selection view
  if (shouldShowRegionSelect) {
    return (
      <RampRegionSelect
        headerTitle={headerTitle}
        onRegionSelect={handleRegionSelect}
      />
    )
  }

  const fiatInputDisabled = amountTypeSupport.onlyCrypto
  const cryptoInputDisabled =
    isLoadingPersistedCryptoSelection || amountTypeSupport.onlyFiat

  // Render trade form view
  return (
    <SceneWrapper
      scroll
      hasTabs
      dockProps={{
        keyboardVisibleOnly: false,
        children: (
          <KavButtons
            primary={{
              label: lstrings.trade_create_next,
              onPress: handleNext,
              disabled:
                isResultLoading ||
                selectedWallet == null ||
                selectedCryptoCurrencyCode == null ||
                'empty' in amountQuery ||
                lastUsedInput === null ||
                supportedPlugins.length === 0 ||
                allQuotes.length === 0 ||
                (lastUsedInput === 'fiat' && amountTypeSupport.onlyCrypto) ||
                (lastUsedInput === 'crypto' && amountTypeSupport.onlyFiat)
            }}
          />
        )
      }}
    >
      <SceneContainer
        headerTitle={headerTitle}
        headerTitleChildren={
          <CountryStateButton onPress={handleRegionSelect} />
        }
      >
        {/* Amount Inputs */}
        {/* Top Input (Fiat) */}
        <View style={styles.inputRowView}>
          <DropdownInputButton
            onPress={handleFiatDropdown}
            testID="rampFiatDropdown"
          >
            {selectedFiatFlagUri !== '' ? (
              <ShadowedView style={styles.shadowedIcon}>
                <FastImage
                  style={styles.flagIconLarge}
                  source={{ uri: selectedFiatFlagUri }}
                />
              </ShadowedView>
            ) : (
              // Shouldn't be possible to reach this case, but just in case:
              // show the fiat currency code as the placeholder
              <FiatIcon
                sizeRem={1.5}
                fiatCurrencyCode={selectedFiatCurrencyCode}
              />
            )}
          </DropdownInputButton>

          <FilledTextInput
            value={displayFiatAmount}
            onChangeText={handleFiatChangeText}
            placeholder={sprintf(
              lstrings.trade_create_amount_s,
              selectedFiatCurrencyCode
            )}
            keyboardType="decimal-pad"
            numeric
            maxDecimals={2}
            returnKeyType="done"
            showSpinner={isFetchingQuotes && lastUsedInput === 'crypto'}
            disabled={fiatInputDisabled}
            expand
          />
        </View>

        {/* Bottom Input (Crypto by design) */}
        <View style={styles.inputRowView}>
          {selectedCryptoCurrencyCode == null &&
          !isLoadingPersistedCryptoSelection ? (
            <EdgeButton
              type="secondary"
              onPress={handleCryptDropdown}
              label={
                direction === 'buy'
                  ? lstrings.select_recv_wallet
                  : lstrings.select_src_wallet
              }
            />
          ) : (
            <>
              <DropdownInputButton
                onPress={handleCryptDropdown}
                testID="rampCryptoDropdown"
              >
                {isLoadingPersistedCryptoSelection ? (
                  <ActivityIndicator />
                ) : selectedCrypto == null || selectedWallet == null ? null : (
                  <CryptoIcon
                    sizeRem={1.5}
                    pluginId={selectedWallet?.currencyInfo.pluginId ?? ''}
                    tokenId={selectedCrypto.tokenId}
                  />
                )}
              </DropdownInputButton>

              <FilledTextInput
                value={displayCryptoAmount}
                onChangeText={handleCryptoChangeText}
                placeholder={sprintf(
                  lstrings.trade_create_amount_s,
                  getSelectedCryptoDisplay() ?? selectedCryptoCurrencyCode
                )}
                keyboardType="decimal-pad"
                numeric
                maxDecimals={6}
                returnKeyType="done"
                showSpinner={isFetchingQuotes && lastUsedInput === 'fiat'}
                disabled={cryptoInputDisabled}
                expand
              />
            </>
          )}
        </View>

        {/* Wallet Name and MAX Button Row */}
        {selectedWallet == null ? null : (
          <View style={styles.walletNameMaxRowView}>
            {selectedWallet?.name != null ? (
              <EdgeText style={styles.walletNameText} numberOfLines={1}>
                {selectedWallet.name}
              </EdgeText>
            ) : null}
            <EdgeTouchableOpacity
              style={styles.maxButton}
              onPress={handleMaxPress}
              disabled={isComputingMax}
            >
              {isComputingMax ? (
                <ActivityIndicator color={theme.iconTappable} />
              ) : (
                <EdgeText style={styles.maxButtonText}>
                  {lstrings.trade_create_max}
                </EdgeText>
              )}
            </EdgeTouchableOpacity>
          </View>
        )}

        {/* Exchange Rate */}
        {selectedCrypto == null ||
        selectedWallet == null ||
        denomination == null ||
        'empty' in amountQuery ||
        lastUsedInput == null ||
        (!isLoadingQuotes &&
          !isFetchingQuotes &&
          allQuotes.length === 0) ? null : (
          <>
            <EdgeText style={styles.exchangeRateTitle}>
              {lstrings.trade_create_exchange_rate}
            </EdgeText>
            {bestQuote != null ? (
              <EdgeText style={styles.exchangeRateValueText}>
                {exchangeRateText}
              </EdgeText>
            ) : null}
            <ActivityIndicator style={{ opacity: isFetchingQuotes ? 1 : 0 }} />
          </>
        )}

        {/* Alert for no supported plugins */}
        {
          // Nothing is loading
          !isResultLoading &&
          // Nothing was returned
          allQuotes.length === 0 &&
          quoteErrors.length === 0 &&
          // No other error to show (e.g., insufficient funds)
          errorForDisplay == null &&
          // User has queried
          !('empty' in amountQuery) &&
          lastUsedInput != null &&
          selectedWallet != null &&
          selectedCryptoCurrencyCode != null ? (
            <AlertCardUi4
              type="warning"
              title={
                direction === 'buy'
                  ? lstrings.trade_buy_unavailable_title
                  : lstrings.trade_sell_unavailable_title
              }
              body={getUnavailableWarningBody({
                direction,
                cryptoDisplay:
                  getSelectedCryptoDisplay() ?? selectedCryptoCurrencyCode,
                selectedFiatCurrencyCode,
                countryData
              })}
            />
          ) : null
        }

        {errorForDisplay != null ? <ErrorCard error={errorForDisplay} /> : null}
      </SceneContainer>
    </SceneWrapper>
  )
}

// Export separate components for buy and sell routes
export const RampCreateBuyScene: React.FC<
  BuySellTabSceneProps<'pluginListBuy'>
> = props => <RampCreateScene {...props} direction="buy" />
export const RampCreateSellScene: React.FC<
  BuySellTabSceneProps<'pluginListSell'>
> = props => <RampCreateScene {...props} direction="sell" />

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  flagIconLarge: {
    width: theme.rem(1.5),
    height: theme.rem(1.5),
    borderRadius: theme.rem(0.75)
  },
  flagIconSmall: {
    width: theme.rem(1),
    height: theme.rem(1),
    borderRadius: theme.rem(0.75)
  },
  inputRowView: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: theme.rem(1),
    margin: theme.rem(0.5)
  },
  walletNameMaxRowView: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: theme.rem(0.5)
  },
  walletNameText: {
    padding: theme.rem(0.25),
    color: theme.secondaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.75),
    marginRight: theme.rem(0.5)
  },
  maxButton: {
    padding: theme.rem(0.25),
    borderRadius: theme.rem(0.5),
    borderColor: theme.escapeButtonText
  },
  maxButtonText: {
    color: theme.escapeButtonText,
    fontFamily: theme.fontFaceDefault,
    includeFontPadding: false
  },
  exchangeRateTitle: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    textAlign: 'center',
    marginBottom: theme.rem(0.5),
    marginTop: theme.rem(1)
  },
  exchangeRateValueText: {
    fontSize: theme.rem(1.125),
    fontWeight: 'bold',
    color: theme.primaryText,
    textAlign: 'center',
    marginBottom: theme.rem(1)
  },
  shadowedIcon: {
    width: theme.rem(1.5),
    height: theme.rem(1.5),
    borderRadius: theme.rem(0.75),
    backgroundColor: theme.iconShadow.shadowColor,
    ...theme.iconShadow
  }
}))

// Helper function to determine which input types should be disabled
interface AmountTypeSupport {
  onlyCrypto: boolean
  onlyFiat: boolean
}

function getAmountTypeSupport(
  supportedPlugins: SupportedPluginResult[]
): AmountTypeSupport {
  if (supportedPlugins.length === 0) {
    return { onlyCrypto: false, onlyFiat: false }
  }

  // Collect all supported amount types from all plugins
  const allSupportedTypes = new Set<'fiat' | 'crypto'>()

  for (const { supportResult } of supportedPlugins) {
    if (supportResult.supportedAmountTypes != null) {
      for (const type of supportResult.supportedAmountTypes) {
        allSupportedTypes.add(type)
      }
    } else {
      // If a plugin doesn't specify supported types, assume both are supported
      allSupportedTypes.add('fiat')
      allSupportedTypes.add('crypto')
    }
  }

  // If all plugins only support fiat, disable crypto input
  const onlyFiat =
    allSupportedTypes.has('fiat') && !allSupportedTypes.has('crypto')
  // If all plugins only support crypto, disable fiat input
  const onlyCrypto =
    allSupportedTypes.has('crypto') && !allSupportedTypes.has('fiat')

  return {
    onlyCrypto,
    onlyFiat
  }
}

/**
 * Calculates a default fiat amount in the user's local (foreign) currency,
 * matching the value of a given default USD amount using a given exchange rate.
 *  Attempts to produce a visually appealing, rounded whole number in the
 * local currency for use as a starting input value.
 */
function getRoundedFiatEquivalent(fiatAmount: string, rate: string): string {
  let usdAmount = div(fiatAmount, rate, DECIMAL_PRECISION)
  // Round out all decimals
  usdAmount = round(usdAmount, 0)
  // Keep only the first decimal place (i.e., round to a nice whole-ish number)
  usdAmount = round(usdAmount, usdAmount.length - 1)
  return usdAmount
}

async function getMaxSpendExchangeAmount(
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId,
  denomination: EdgeDenomination
): Promise<string> {
  async function getDummyAddress(): Promise<string> {
    const pluginId = wallet.currencyInfo.pluginId
    const dummyPublicAddress =
      getSpecialCurrencyInfo(pluginId).dummyPublicAddress
    if (dummyPublicAddress != null) {
      return dummyPublicAddress
    }
    const addresses = await wallet.getAddresses({ tokenId: null })
    return addresses.length > 0 ? addresses[0].publicAddress : ''
  }
  const maxSpendNativeAmount = await wallet.getMaxSpendable({
    tokenId,
    spendTargets: [{ publicAddress: await getDummyAddress() }]
  })
  const maxSpendExchangeAmount = convertNativeToDenomination(
    denomination.multiplier
  )(maxSpendNativeAmount)
  return maxSpendExchangeAmount
}

/**
 * Generates the unavailable warning body, optionally appending a suggestion
 * to check for quotes in the user's native currency if the selected fiat
 * is not one of their native currencies.
 */
function getUnavailableWarningBody(params: {
  direction: 'buy' | 'sell'
  cryptoDisplay: string
  selectedFiatCurrencyCode: string
  countryData: (typeof COUNTRY_CODES)[number] | undefined
}): string {
  const { direction, cryptoDisplay, selectedFiatCurrencyCode, countryData } =
    params

  const baseMessage = sprintf(
    direction === 'buy'
      ? lstrings.trade_buy_unavailable_body_2s
      : lstrings.trade_sell_unavailable_body_1_2s,
    cryptoDisplay,
    selectedFiatCurrencyCode
  )

  // Check if we can suggest native currencies
  const nativeFiats = countryData?.nativeIsoFiats
  if (nativeFiats == null || nativeFiats.length === 0) {
    return baseMessage
  }

  // If the selected fiat is already a native currency, no suggestion needed
  if (nativeFiats.includes(selectedFiatCurrencyCode)) {
    return baseMessage
  }

  // Append native currency suggestion
  const nativeFiatsDisplay = nativeFiats.join(', ')
  const suggestionMessage = sprintf(
    lstrings.trade_check_fiat_1s,
    nativeFiatsDisplay
  )

  return `${baseMessage} ${suggestionMessage}`
}
