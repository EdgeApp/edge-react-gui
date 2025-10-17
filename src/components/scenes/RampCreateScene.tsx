import { useFocusEffect } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { div, gt, mul, round, toBns } from 'biggystring'
import * as React from 'react'
import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'
import Feather from 'react-native-vector-icons/Feather'
import { sprintf } from 'sprintf-js'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import {
  setRampCryptoSelection,
  setRampFiatCurrencyCode
} from '../../actions/SettingsActions'
import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES, FIAT_COUNTRY } from '../../constants/CountryConstants'
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
import { DECIMAL_PRECISION, mulToPrecision } from '../../util/utils'
import { DropdownInputButton } from '../buttons/DropdownInputButton'
import { EdgeButton } from '../buttons/EdgeButton'
import { PillButton } from '../buttons/PillButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { ErrorCard } from '../cards/ErrorCard'
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

// Helper function to determine which input types should be disabled
interface AmountTypeSupport {
  fiatInputDisabled: boolean
  cryptoInputDisabled: boolean
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
  const [userInput, setUserInput] = useState('')
  const [lastUsedInput, setLastUsedInput] = useState<'fiat' | 'crypto' | null>(
    null
  )
  const [isMaxAmount, setIsMaxAmount] = useState(false)
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
  const { fiatInputDisabled, cryptoInputDisabled } =
    getAmountTypeSupport(supportedPlugins)

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
      if (abort) return
      // Don't override if the user has started typing or fiat input is disabled
      if (
        hasAppliedInitialAmount.current ||
        fiatInputDisabled ||
        userInput !== '' ||
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
      setUserInput(initialFiat)
      setLastUsedInput('fiat')
    }

    applyInitial().catch(() => {})
    return () => {
      abort = true
    }
  }, [
    fiatInputDisabled,
    isLightAccount,
    lastUsedInput,
    selectedWallet,
    selectedCryptoCurrencyCode,
    selectedFiatCurrencyCode,
    shouldShowRegionSelect,
    userInput,
    fiatUsdRate
  ])

  // Create rampQuoteRequest based on current form state
  const rampQuoteRequest: RampQuoteRequest | null = React.useMemo(() => {
    if (
      selectedWallet == null ||
      selectedCryptoCurrencyCode == null ||
      lastUsedInput == null ||
      (userInput === '' && !isMaxAmount) ||
      countryCode === ''
    ) {
      return null
    }

    // Guard against creating request with disabled input type
    if (
      (lastUsedInput === 'fiat' && fiatInputDisabled) ||
      (lastUsedInput === 'crypto' && cryptoInputDisabled)
    ) {
      return null
    }

    return {
      wallet: selectedWallet,
      pluginId: selectedWallet.currencyInfo.pluginId,
      tokenId: selectedCrypto?.tokenId ?? null,
      displayCurrencyCode: selectedCryptoCurrencyCode,
      exchangeAmount: isMaxAmount ? { max: true } : userInput,
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
    userInput,
    isMaxAmount,
    selectedFiatCurrencyCode,
    lastUsedInput,
    countryCode,
    stateProvinceCode,
    fiatInputDisabled,
    cryptoInputDisabled,
    direction
  ])

  // Fetch quotes using the custom hook
  const {
    quotes: sortedQuotes,
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
  const bestQuote = sortedQuotes.find((_, index) => index === 0)

  // For Max flow, select the quote with the largest supported amount
  const maxQuoteForMaxFlow = React.useMemo(() => {
    if (!isMaxAmount || sortedQuotes.length === 0) return null

    const picked = sortedQuotes.reduce((a, b): RampQuote => {
      const aAmount = lastUsedInput === 'crypto' ? a.cryptoAmount : a.fiatAmount
      const bAmount = lastUsedInput === 'crypto' ? b.cryptoAmount : b.fiatAmount
      return gt(bAmount, aAmount) ? b : a
    })
    return picked
  }, [isMaxAmount, sortedQuotes, lastUsedInput])

  // Calculate exchange rate from best quote
  const quoteExchangeRate = React.useMemo(() => {
    if (bestQuote?.cryptoAmount == null || bestQuote.fiatAmount == null)
      return 0

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

  // Helper function to convert crypto amount to fiat using quote rate
  const convertCryptoToFiat = React.useCallback(
    (cryptoAmt: string): string => {
      if (cryptoAmt === '' || quoteExchangeRate === 0) return ''

      try {
        return div(mul(cryptoAmt, quoteExchangeRate.toString()), '1', 2)
      } catch {
        return ''
      }
    },
    [quoteExchangeRate]
  )

  // Helper function to convert fiat amount to crypto using quote rate
  const convertFiatToCrypto = React.useCallback(
    (fiatAmt: string): string => {
      if (fiatAmt === '' || quoteExchangeRate === 0) return ''

      const decimals =
        denomination != null
          ? mulToPrecision(denomination.multiplier)
          : DECIMAL_PRECISION
      try {
        return div(fiatAmt, quoteExchangeRate.toString(), decimals)
      } catch {
        return ''
      }
    },
    [denomination, quoteExchangeRate]
  )

  // Derived state for display values
  const displayFiatAmount = React.useMemo(() => {
    // Don't show any value if fiat input is disabled
    if (fiatInputDisabled) return ''

    if (isMaxAmount && maxQuoteForMaxFlow != null) {
      return maxQuoteForMaxFlow.fiatAmount ?? ''
    }
    if (userInput === '' || lastUsedInput === null) return ''

    if (lastUsedInput === 'fiat') {
      // User entered fiat, show raw value (FilledTextInput will format it)
      return userInput
    } else {
      // User entered crypto, convert to fiat only if we have a quote
      return convertCryptoToFiat(userInput)
    }
  }, [
    userInput,
    lastUsedInput,
    convertCryptoToFiat,
    isMaxAmount,
    maxQuoteForMaxFlow,
    fiatInputDisabled
  ])

  const displayCryptoAmount = React.useMemo(() => {
    // Don't show any value if crypto input is disabled
    if (cryptoInputDisabled) return ''

    if (isMaxAmount && maxQuoteForMaxFlow != null) {
      return maxQuoteForMaxFlow.cryptoAmount ?? ''
    }
    if (userInput === '' || lastUsedInput === null) return ''

    if (lastUsedInput === 'crypto') {
      // User entered crypto, show raw value (FilledTextInput will format it)
      return userInput
    } else {
      // User entered fiat, convert to crypto only if we have a quote
      return convertFiatToCrypto(userInput)
    }
  }, [
    userInput,
    lastUsedInput,
    convertFiatToCrypto,
    isMaxAmount,
    maxQuoteForMaxFlow,
    cryptoInputDisabled
  ])

  // Log the quote event only when the scene is focused
  useFocusEffect(() => {
    logEvent(direction === 'buy' ? 'Buy_Quote' : 'Sell_Quote')
  })

  //
  // Handlers
  //

  const handleRegionSelect = useHandler(async () => {
    if (account != null) {
      await dispatch(
        showCountrySelectionModal({
          account,
          countryCode: countryCode !== '' ? countryCode : '',
          stateProvinceCode
        })
      )
      // After selection, the settings will update and shouldShowRegionSelect will recompute to false
    }
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
      (userInput === '' && !isMaxAmount) ||
      rampQuoteRequest == null
    ) {
      return
    }

    if (isLightAccount) {
      // This should have loaded by now
      if (fiatUsdRate == null || bestQuote == null) return
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

    logEvent(direction === 'buy' ? 'Buy_Quote_Next' : 'Sell_Quote_Next')

    navigation.navigate('rampSelectOption', {
      rampQuoteRequest
    })
  })

  const exchangeRateText = React.useMemo(() => {
    return getRateFromRampQuoteResult(bestQuote, selectedFiatCurrencyCode)
  }, [bestQuote, selectedFiatCurrencyCode])

  const handleFiatChangeText = useHandler((text: string) => {
    setIsMaxAmount(false)
    setUserInput(text)
    setLastUsedInput('fiat')
  })

  const handleCryptoChangeText = useHandler((text: string) => {
    setIsMaxAmount(false)
    setUserInput(text)
    setLastUsedInput('crypto')
  })

  const handleMaxPress = useHandler(() => {
    // Preconditions to submit a max request
    if (
      selectedWallet == null ||
      selectedCryptoCurrencyCode == null ||
      countryCode === ''
    ) {
      return
    }

    // Trigger a transient max flow: request quotes with {max:true} and auto-navigate when ready
    setPendingMaxNav(true)
    setIsMaxAmount(true)
    setLastUsedInput('fiat')
    setUserInput('')
  })

  // Auto-navigate once a best quote arrives for the transient max flow
  React.useEffect(() => {
    const isMaxRequest =
      rampQuoteRequest != null &&
      typeof rampQuoteRequest.exchangeAmount !== 'string'
    if (
      pendingMaxNav &&
      isMaxAmount &&
      isMaxRequest &&
      maxQuoteForMaxFlow != null &&
      !isLoadingQuotes
    ) {
      // Persist the chosen amount so it remains after returning
      if (!fiatInputDisabled && maxQuoteForMaxFlow.fiatAmount != null) {
        setLastUsedInput('fiat')
        setUserInput(maxQuoteForMaxFlow.fiatAmount)
      } else if (
        !cryptoInputDisabled &&
        maxQuoteForMaxFlow.cryptoAmount != null
      ) {
        setLastUsedInput('crypto')
        setUserInput(maxQuoteForMaxFlow.cryptoAmount)
      }

      navigation.navigate('rampSelectOption', {
        rampQuoteRequest
      })
      // Reset transient state to avoid leaving the scene in a max "mode"
      setPendingMaxNav(false)
      setIsMaxAmount(false)
    }
  }, [
    pendingMaxNav,
    isMaxAmount,
    maxQuoteForMaxFlow,
    isLoadingQuotes,
    rampQuoteRequest,
    navigation,
    fiatInputDisabled,
    cryptoInputDisabled
  ])

  const headerTitle =
    direction === 'buy' ? lstrings.buy_crypto : lstrings.sell_crypto

  // This means we're still loading all the data needed before showing a result (quote or error)
  const isResultLoading =
    isPluginsLoading || isCheckingSupport || isLoadingQuotes || isFetchingQuotes

  // Render region selection view
  if (shouldShowRegionSelect) {
    return (
      <SceneWrapper scroll hasTabs>
        <SceneContainer headerTitle={headerTitle}>
          <EdgeText style={styles.subtitleText}>
            {lstrings.trade_region_select_start_steps}
          </EdgeText>

          <View style={styles.stepsCard}>
            <View style={styles.stepRow}>
              <EdgeText style={styles.stepNumberText}>
                {sprintf(lstrings.step_prefix_s, '1')}
              </EdgeText>
              <EdgeText style={styles.stepText} numberOfLines={0}>
                {lstrings.trade_region_select_step_1}
              </EdgeText>
            </View>
            <View style={styles.stepRow}>
              <EdgeText style={styles.stepNumberText}>
                {sprintf(lstrings.step_prefix_s, '2')}
              </EdgeText>
              <EdgeText style={styles.stepText} numberOfLines={0}>
                {lstrings.trade_region_select_step_2}
              </EdgeText>
            </View>
            <View style={styles.stepRow}>
              <EdgeText style={styles.stepNumberText}>
                {sprintf(lstrings.step_prefix_s, '3')}
              </EdgeText>
              <EdgeText style={styles.stepText} numberOfLines={0}>
                {lstrings.trade_region_select_step_3}
              </EdgeText>
            </View>
            <View style={styles.stepRow}>
              <EdgeText style={styles.stepNumberText}>
                {sprintf(lstrings.step_prefix_s, '4')}
              </EdgeText>
              <EdgeText style={styles.stepText} numberOfLines={0}>
                {lstrings.trade_region_select_step_4}
              </EdgeText>
            </View>
          </View>

          <EdgeTouchableOpacity
            style={styles.regionButton}
            onPress={handleRegionSelect}
          >
            {flagUri != null ? (
              <FastImage
                style={styles.flagIconLarge}
                source={{ uri: flagUri }}
              />
            ) : (
              <Feather
                style={styles.globeIcon}
                name="globe"
                color={theme.iconTappable}
                size={theme.rem(1.5)}
              />
            )}
            <EdgeText
              style={styles.regionButtonText}
              disableFontScaling
              ellipsizeMode="tail"
              numberOfLines={1}
            >
              {getRegionText()}
            </EdgeText>
            <Feather
              name="chevron-right"
              color={theme.iconTappable}
              size={theme.rem(1.25)}
            />
          </EdgeTouchableOpacity>
        </SceneContainer>
      </SceneWrapper>
    )
  }

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
              disabled={isMaxAmount || fiatInputDisabled}
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
                  disabled={
                    isLoadingPersistedCryptoSelection ||
                    isMaxAmount ||
                    cryptoInputDisabled
                  }
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
                <Text style={styles.maxButtonText}>
                  {lstrings.trade_create_max}
                </Text>
              </EdgeTouchableOpacity>
            </View>
          )}

          {/* Exchange Rate */}
          {selectedCrypto == null ||
          selectedWallet == null ||
          denomination == null ||
          (userInput === '' && !isMaxAmount) ||
          lastUsedInput == null ||
          (!isLoadingQuotes && sortedQuotes.length === 0) ? null : (
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
          {!isResultLoading &&
          supportedPlugins.length === 0 &&
          userInput !== '' &&
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
          ) : null}

          {!isResultLoading &&
          sortedQuotes.length === 0 &&
          supportedPlugins.length > 0 &&
          (userInput !== '' || isMaxAmount) ? (
            supportedPluginsError != null ? (
              // Supported plugin error
              <ErrorCard error={supportedPluginsError} />
            ) : quoteErrors.length > 0 ? (
              // Quote errors
              <ErrorCard
                error={getBestQuoteError(
                  quoteErrors.map(quoteError => quoteError.error),
                  lastUsedInput === 'crypto'
                    ? selectedCryptoCurrencyCode ??
                        selectedFiatCurrencyCode ??
                        ''
                    : selectedFiatCurrencyCode,
                  direction
                )}
              />
            ) : null
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
          (userInput === '' && !isMaxAmount) ||
          lastUsedInput === null ||
          supportedPlugins.length === 0 ||
          sortedQuotes.length === 0 ||
          (lastUsedInput === 'fiat' && fiatInputDisabled) ||
          (lastUsedInput === 'crypto' && cryptoInputDisabled)
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
    // TODO: Uncomment this when we have a max feature's bugs fixed and ready to ship
    display: 'none',
    padding: theme.rem(0.25),
    borderRadius: theme.rem(0.5),
    borderColor: theme.escapeButtonText
  },
  maxButtonText: {
    color: theme.escapeButtonText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.75),
    includeFontPadding: false as const
  },
  exchangeRateTitle: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    textAlign: 'center' as const,
    marginBottom: theme.rem(0.5),
    marginTop: theme.rem(1)
  },
  exchangeRateValueText: {
    fontSize: theme.rem(1.125),
    fontWeight: 'bold' as const,
    color: theme.primaryText,
    textAlign: 'center' as const,
    marginBottom: theme.rem(1)
  },
  stepsCard: {
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(0.5),
    padding: theme.rem(1),
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.rem(0.5),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor
  },
  stepRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginVertical: theme.rem(0.25),
    gap: theme.rem(0.5)
  },
  stepNumberText: {
    fontWeight: '600' as const,
    minWidth: theme.rem(1.25)
  },
  stepText: {
    flex: 1
  },
  regionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.cardBaseColor,
    borderRadius: theme.rem(0.5),
    margin: theme.rem(0.5),
    padding: theme.rem(1),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.cardBorderColor,
    gap: theme.rem(0.5)
  },
  regionButtonText: {
    flexShrink: 1,
    color: theme.primaryText,
    fontSize: theme.rem(1.1),
    fontFamily: theme.fontFaceDefault
  },
  globeIcon: {
    marginRight: theme.rem(0.75)
  },
  subtitleText: {
    color: theme.primaryText,
    fontSize: theme.rem(1.25),
    fontFamily: theme.fontFaceDefault,
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5),
    marginHorizontal: theme.rem(0.5)
  },
  shadowedIcon: {
    width: theme.rem(1.5),
    height: theme.rem(1.5),
    borderRadius: theme.rem(0.75),
    backgroundColor: theme.iconShadow.shadowColor,
    ...theme.iconShadow
  }
}))

function getAmountTypeSupport(
  supportedPlugins: SupportedPluginResult[]
): AmountTypeSupport {
  if (supportedPlugins.length === 0) {
    return { fiatInputDisabled: false, cryptoInputDisabled: false }
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
    fiatInputDisabled: onlyCrypto,
    cryptoInputDisabled: onlyFiat
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
