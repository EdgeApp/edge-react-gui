import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { div, eq, gt, mul, round, toBns } from 'biggystring'
import type {
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'
import { useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'
import { sprintf } from 'sprintf-js'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import {
  setRampCryptoSelection,
  setRampFiatCurrencyCode
} from '../../actions/SettingsActions'
import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES, FIAT_COUNTRY } from '../../constants/CountryConstants'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useRampLastCryptoSelection } from '../../hooks/useRampLastCryptoSelection'
import { useRampPlugins } from '../../hooks/useRampPlugins'
import { useRampQuotes } from '../../hooks/useRampQuotes'
import {
  type SupportedPluginResult,
  useSupportedPlugins
} from '../../hooks/useSupportedPlugins'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import type {
  RampPlugin,
  RampQouteAmount,
  RampQuote,
  RampQuoteRequest
} from '../../plugins/ramps/rampPluginTypes'
import { getBestQuoteError } from '../../plugins/ramps/utils/getBestError'
import { getRateFromRampQuoteResult } from '../../plugins/ramps/utils/getRateFromRampQuoteResult'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type {
  BuySellTabSceneProps,
  NavigationBase
} from '../../types/routerTypes'
import type { GuiFiatType } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getHistoricalFiatRate } from '../../util/exchangeRates'
import { logEvent } from '../../util/tracking'
import {
  convertNativeToDenomination,
  DECIMAL_PRECISION,
  mulToPrecision
} from '../../util/utils'
import { DropdownInputButton } from '../buttons/DropdownInputButton'
import { EdgeButton } from '../buttons/EdgeButton'
import { PillButton } from '../buttons/PillButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { ErrorCard, I18nError } from '../cards/ErrorCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { FiatIcon } from '../icons/FiatIcon'
import { KavButton } from '../keyboard/KavButton'
import { SceneContainer } from '../layout/SceneContainer'
import { FiatListModal } from '../modals/FiatListModal'
import {
  WalletListModal,
  type WalletListResult,
  type WalletListWalletResult
} from '../modals/WalletListModal'
import { Airship, showToast } from '../services/AirshipInstance'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'
import { RampRegionSelect } from './RampCreateScene/RampRegionSelect'

export interface RampCreateParams {
  forcedWalletResult?: WalletListWalletResult
  regionCode?: string
}

type Props = (
  | BuySellTabSceneProps<'pluginListBuy'>
  | BuySellTabSceneProps<'pluginListSell'>
) & {
  direction: 'buy' | 'sell'
}

export const RampCreateScene: React.FC<Props> = (props: Props) => {
  const { direction, navigation, route } = props
  const { regionCode: initialRegionCode, forcedWalletResult } =
    route?.params ?? {}

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
  const [exchangeAmount, setExchangeAmount] = useState<
    RampQouteAmount | { empty: true }
  >({ empty: true })
  const [lastUsedInput, setLastUsedInput] = useState<'fiat' | 'crypto' | null>(
    null
  )
  const [pendingMaxNav, setPendingMaxNav] = useState(false)
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

  // Determine whether to show the region selection scene variant
  const shouldShowRegionSelect =
    initialRegionCode == null && (countryCode === '' || countryData == null)

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

  const getRegionText = (): string => {
    if (countryCode === '' || countryData == null) {
      return lstrings.buy_sell_crypto_select_country_button
    }

    if (stateProvinceCode != null && countryData.stateProvinces != null) {
      const stateProvince = countryData.stateProvinces.find(
        sp => sp['alpha-2'] === stateProvinceCode
      )
      if (stateProvince != null) {
        return `${stateProvince.name}, ${countryData['alpha-3']}`
      }
    }

    return countryData.name
  }

  const flagUri =
    countryData != null
      ? `${FLAG_LOGO_URL}/${
          countryData.filename ??
          countryData.name.toLowerCase().replace(' ', '-')
        }.png`
      : null

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
        !('empty' in exchangeAmount) ||
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
      setExchangeAmount({ amount: initialFiat })
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
    exchangeAmount,
    direction
  ])

  // Create rampQuoteRequest based on current form state
  const rampQuoteRequest: RampQuoteRequest | null = React.useMemo(() => {
    if (
      selectedWallet == null ||
      selectedCryptoCurrencyCode == null ||
      lastUsedInput == null ||
      'empty' in exchangeAmount ||
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
      !('max' in exchangeAmount)
    ) {
      const tokenId: EdgeTokenId = selectedCrypto?.tokenId ?? null
      const nativeBalance = selectedWallet.balanceMap.get(tokenId) ?? '0'
      const walletCryptoAmount = convertNativeToDenomination(
        denomination.multiplier
      )(nativeBalance)
      if (gt(exchangeAmount.amount, walletCryptoAmount)) return null
    }

    return {
      wallet: selectedWallet,
      pluginId: selectedWallet.currencyInfo.pluginId,
      tokenId: selectedCrypto?.tokenId ?? null,
      displayCurrencyCode: selectedCryptoCurrencyCode,
      exchangeAmount,
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
    exchangeAmount,
    selectedFiatCurrencyCode,
    lastUsedInput,
    countryCode,
    stateProvinceCode,
    amountTypeSupport.onlyCrypto,
    amountTypeSupport.onlyFiat,
    direction,
    denomination
  ])

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
    )
  })

  // Get the best quote using .find because we want to preserve undefined in its type
  const bestQuote = allQuotes.find((_, index) => index === 0)

  // For Max flow, select the quote with the largest supported amount
  const maxQuoteForMaxFlow = React.useMemo(() => {
    if (!('max' in exchangeAmount) || allQuotes.length === 0) return null

    const quotesWithAmounts = allQuotes.filter(rampQuoteHasAmounts)
    if (quotesWithAmounts.length === 0) return null

    const picked = quotesWithAmounts.reduce((a, b): RampQuote => {
      const aAmount = lastUsedInput === 'crypto' ? a.cryptoAmount : a.fiatAmount
      const bAmount = lastUsedInput === 'crypto' ? b.cryptoAmount : b.fiatAmount
      return gt(bAmount, aAmount) ? b : a
    })
    return picked
  }, [exchangeAmount, allQuotes, lastUsedInput])

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
    if ('empty' in exchangeAmount) return null
    if ('max' in exchangeAmount) return null
    if (lastUsedInput == null) return null

    // Determine requested crypto amount
    let requestedCryptoAmount: string | null = null
    if (lastUsedInput === 'crypto') {
      requestedCryptoAmount = exchangeAmount.amount
    } else if (lastUsedInput === 'fiat') {
      if (quoteExchangeRate === 0) return null
      requestedCryptoAmount = div(
        exchangeAmount.amount,
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
    exchangeAmount,
    lastUsedInput,
    quoteExchangeRate
  ])

  // Derived state for display values
  const displayFiatAmount = React.useMemo(() => {
    // Don't show any value if fiat input is disabled
    if (amountTypeSupport.onlyCrypto) return ''
    if ('empty' in exchangeAmount) return ''

    if ('max' in exchangeAmount) {
      return maxQuoteForMaxFlow?.fiatAmount ?? ''
    }

    if (lastUsedInput === 'fiat') {
      // User entered fiat, show raw value (FilledTextInput will format it)
      return exchangeAmount.amount
    } else if (lastUsedInput === 'crypto') {
      // Avoid division by zero
      if (quoteExchangeRate === 0) return ''
      // User entered crypto, convert to fiat only if we have a quote
      return div(
        mul(exchangeAmount.amount, quoteExchangeRate.toString()),
        '1',
        2
      )
    } else {
      return ''
    }
  }, [
    amountTypeSupport.onlyCrypto,
    maxQuoteForMaxFlow,
    exchangeAmount,
    lastUsedInput,
    quoteExchangeRate
  ])

  const displayCryptoAmount = React.useMemo(() => {
    // Don't show any value if crypto input is disabled
    if (amountTypeSupport.onlyFiat) return ''
    if ('empty' in exchangeAmount || lastUsedInput === null) return ''

    if ('max' in exchangeAmount) {
      return (
        maxQuoteForMaxFlow?.cryptoAmount ??
        (typeof exchangeAmount.max === 'string' ? exchangeAmount.max : '')
      )
    }

    if (lastUsedInput === 'crypto') {
      // User entered crypto, show raw value (FilledTextInput will format it)
      return exchangeAmount.amount
    } else if (lastUsedInput === 'fiat') {
      // Avoid division by zero
      if (quoteExchangeRate === 0) return ''
      const decimals =
        denomination != null
          ? mulToPrecision(denomination.multiplier)
          : DECIMAL_PRECISION
      // User entered fiat, convert to crypto only if we have a quote
      return div(exchangeAmount.amount, quoteExchangeRate.toString(), decimals)
    } else {
      return ''
    }
  }, [
    amountTypeSupport.onlyFiat,
    maxQuoteForMaxFlow,
    exchangeAmount,
    lastUsedInput,
    quoteExchangeRate,
    denomination
  ])

  // Log the quote event only when the scene is focused
  useFocusEffect(() => {
    dispatch(logEvent(direction === 'buy' ? 'Buy_Quote' : 'Sell_Quote'))
  })

  //
  // Handlers
  //

  const handleRegionSelect = useHandler(async () => {
    await dispatch(
      showCountrySelectionModal({
        account,
        countryCode: countryCode !== '' ? countryCode : '',
        stateProvinceCode
      })
    )
  })

  const handleCryptDropdown = useHandler(async () => {
    if (account == null) return
    const result = await Airship.show<WalletListResult>(bridge => (
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
      setPendingMaxNav(false)
      if (direction === 'sell') {
        setExchangeAmount({ empty: true })
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
    setPendingMaxNav(false)
    const result = await Airship.show<GuiFiatType>(bridge => (
      <FiatListModal bridge={bridge} />
    ))
    if (result != null && account != null) {
      if (result.value !== rampLastFiatCurrencyCode) {
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
      'empty' in exchangeAmount ||
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
      rampQuoteRequest
    })
  })

  const exchangeRateText = React.useMemo(() => {
    return getRateFromRampQuoteResult(bestQuote, selectedFiatCurrencyCode)
  }, [bestQuote, selectedFiatCurrencyCode])

  const handleFiatChangeText = useHandler((amount: string) => {
    setExchangeAmount(amount === '' ? { empty: true } : { amount })
    setLastUsedInput('fiat')
  })

  const handleCryptoChangeText = useHandler((amount: string) => {
    setExchangeAmount(amount === '' ? { empty: true } : { amount })
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

    // Trigger a transient max flow: request quotes with {max:true} and auto-navigate when ready
    setPendingMaxNav(true)
    setLastUsedInput(direction === 'buy' ? 'fiat' : 'crypto')

    if (direction === 'sell') {
      const maxSpendExchangeAmount = await getMaxSpendExchangeAmount(
        selectedWallet,
        selectedCrypto.tokenId,
        denomination
      )
      setExchangeAmount({
        max: maxSpendExchangeAmount
      })
    } else {
      setExchangeAmount({
        max: true
      })
    }
  })

  // Auto-navigate once a best quote arrives for the transient max flow
  React.useEffect(() => {
    const isMaxRequest =
      rampQuoteRequest != null && 'max' in rampQuoteRequest.exchangeAmount
    if (
      pendingMaxNav &&
      'max' in exchangeAmount &&
      isMaxRequest &&
      maxQuoteForMaxFlow != null &&
      !isLoadingQuotes
    ) {
      navigation.navigate('rampSelectOption', {
        rampQuoteRequest
      })
      // Reset transient state to avoid leaving the scene in a max "mode"
      setPendingMaxNav(false)
    }
  }, [
    pendingMaxNav,
    maxQuoteForMaxFlow,
    isLoadingQuotes,
    rampQuoteRequest,
    navigation,
    amountTypeSupport.onlyCrypto,
    amountTypeSupport.onlyFiat,
    exchangeAmount,
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
      'empty' in exchangeAmount
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
    exchangeAmount,
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
    <>
      <SceneWrapper scroll hasTabs>
        <SceneContainer
          headerTitle={headerTitle}
          headerTitleChildren={
            <PillButton
              aroundRem={0}
              leftRem={0.5}
              icon={() =>
                flagUri != null ? (
                  <FastImage
                    style={styles.flagIconSmall}
                    source={{ uri: flagUri }}
                  />
                ) : null
              }
              label={getRegionText()}
              onPress={handleRegionSelect}
            />
          }
        >
          {/* Amount Inputs */}
          {/* Top Input (Fiat) */}
          <View style={styles.inputRowView}>
            <DropdownInputButton onPress={handleFiatDropdown}>
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
                <DropdownInputButton onPress={handleCryptDropdown}>
                  {isLoadingPersistedCryptoSelection ? (
                    <ActivityIndicator />
                  ) : selectedCrypto == null ||
                    selectedWallet == null ? null : (
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
                    selectedCryptoCurrencyCode
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
              >
                <EdgeText style={styles.maxButtonText}>
                  {lstrings.trade_create_max}
                </EdgeText>
              </EdgeTouchableOpacity>
            </View>
          )}

          {/* Exchange Rate */}
          {selectedCrypto == null ||
          selectedWallet == null ||
          denomination == null ||
          'empty' in exchangeAmount ||
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
              <ActivityIndicator
                style={{ opacity: isFetchingQuotes ? 1 : 0 }}
              />
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
            !('empty' in exchangeAmount) &&
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
                body={sprintf(
                  direction === 'buy'
                    ? lstrings.trade_buy_unavailable_body_2s
                    : lstrings.trade_sell_unavailable_body_2s,
                  selectedCryptoCurrencyCode,
                  selectedFiatCurrencyCode
                )}
              />
            ) : null
          }

          {errorForDisplay != null ? (
            <ErrorCard error={errorForDisplay} />
          ) : null}
        </SceneContainer>
      </SceneWrapper>
      {/* Next Button - Must be sibling of SceneWrapper for proper keyboard positioning */}
      <KavButton
        label={lstrings.trade_create_next}
        onPress={handleNext}
        hasTabs
        disabled={
          isResultLoading ||
          selectedWallet == null ||
          selectedCryptoCurrencyCode == null ||
          'empty' in exchangeAmount ||
          lastUsedInput === null ||
          supportedPlugins.length === 0 ||
          allQuotes.length === 0 ||
          (lastUsedInput === 'fiat' && amountTypeSupport.onlyCrypto) ||
          (lastUsedInput === 'crypto' && amountTypeSupport.onlyFiat)
        }
      />
    </>
  )
}

// Export separate components for buy and sell routes
export const RampCreateBuyScene = (
  props: BuySellTabSceneProps<'pluginListBuy'>
): React.ReactElement => <RampCreateScene {...props} direction="buy" />
export const RampCreateSellScene = (
  props: BuySellTabSceneProps<'pluginListSell'>
): React.ReactElement => <RampCreateScene {...props} direction="sell" />

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

const rampQuoteHasAmounts = (quote: RampQuote): boolean =>
  !eq(quote.fiatAmount, '0') || !eq(quote.cryptoAmount, '0')
