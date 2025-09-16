import { div, mul } from 'biggystring'
import * as React from 'react'
import { useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Feather from 'react-native-vector-icons/Feather'
import { sprintf } from 'sprintf-js'

import { showCountrySelectionModal } from '../../actions/CountryListActions'
import { FLAG_LOGO_URL } from '../../constants/CdnConstants'
import { COUNTRY_CODES, FIAT_COUNTRY } from '../../constants/CountryConstants'
import { useHandler } from '../../hooks/useHandler'
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
  RampQuoteRequest
} from '../../plugins/ramps/rampPluginTypes'
import { getDefaultFiat } from '../../selectors/SettingsSelectors'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { BuyTabSceneProps, NavigationBase } from '../../types/routerTypes'
import type { GuiFiatType } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, mulToPrecision } from '../../util/utils'
import { DropDownInputButton } from '../buttons/DropDownInputButton'
import { PillButton } from '../buttons/PillButton'
import { AlertCardUi4 } from '../cards/AlertCard'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SceneWrapper } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
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
import { Airship } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'

export interface RampCreateParams {
  forcedWalletResult?: WalletListWalletResult
  regionCode?: string
}

interface Props extends BuyTabSceneProps<'pluginListBuy'> {}

// Helper function to determine which input types should be disabled
interface AmountTypeSupport {
  fiatInputDisabled: boolean
  cryptoInputDisabled: boolean
}

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

export const RampCreateScene: React.FC<Props> = (props: Props) => {
  const { navigation, route } = props
  const { regionCode: initialRegionCode, forcedWalletResult } =
    route?.params ?? {}

  const theme = useTheme()
  const dispatch = useDispatch()

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  // State for trade form
  const [userInput, setUserInput] = useState('')
  const [lastUsedInput, setLastUsedInput] = useState<'fiat' | 'crypto' | null>(
    null
  )
  const [isMaxAmount, setIsMaxAmount] = useState(false)

  // Selected currencies
  const defaultFiat = useSelector(state => getDefaultFiat(state))
  const [selectedFiatCurrencyCode, setSelectedFiatCurrencyCode] =
    useState<string>(defaultFiat)

  // Get first wallet as default if no forcedWalletResult
  const firstWallet = React.useMemo((): WalletListWalletResult | undefined => {
    const walletIds = Object.keys(currencyWallets)
    if (walletIds.length > 0) {
      return {
        type: 'wallet',
        walletId: walletIds[0],
        tokenId: null
      }
    }
    return undefined
  }, [currencyWallets])

  const [selectedCrypto, setSelectedCrypto] = useState<
    WalletListWalletResult | undefined
  >(forcedWalletResult ?? firstWallet)

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
    direction: 'buy'
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
      direction: 'buy',
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
    cryptoInputDisabled
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

  // Get the best quote
  const bestQuote = sortedQuotes[0]

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

    if (isMaxAmount && bestQuote != null) {
      return bestQuote.fiatAmount
    }
    if (userInput === '' || lastUsedInput === null) return ''

    if (lastUsedInput === 'fiat') {
      return userInput // User entered fiat, show as-is
    } else {
      // User entered crypto, convert to fiat only if we have a quote
      return convertCryptoToFiat(userInput)
    }
  }, [
    userInput,
    lastUsedInput,
    convertCryptoToFiat,
    isMaxAmount,
    bestQuote,
    fiatInputDisabled
  ])

  const displayCryptoAmount = React.useMemo(() => {
    // Don't show any value if crypto input is disabled
    if (cryptoInputDisabled) return ''

    if (isMaxAmount && bestQuote != null) {
      return bestQuote.cryptoAmount
    }
    if (userInput === '' || lastUsedInput === null) return ''

    if (lastUsedInput === 'crypto') {
      return userInput // User entered crypto, show as-is
    } else {
      // User entered fiat, convert to crypto only if we have a quote
      return convertFiatToCrypto(userInput)
    }
  }, [
    userInput,
    lastUsedInput,
    convertFiatToCrypto,
    isMaxAmount,
    bestQuote,
    cryptoInputDisabled
  ])

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
      const { walletId, tokenId } = result
      const wallet = account.currencyWallets[walletId]
      if (wallet != null) {
        setSelectedCrypto({
          type: 'wallet',
          walletId,
          tokenId
        })
      }
    }
  })

  const handleFiatDropdown = useHandler(async () => {
    const result = await Airship.show<GuiFiatType>(bridge => (
      <FiatListModal bridge={bridge} />
    ))
    if (result != null) {
      setSelectedFiatCurrencyCode(result.value)
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

    navigation.navigate('rampSelectOption', {
      rampQuoteRequest
    })
  })

  const exchangeRateText = React.useMemo(() => {
    return sprintf(
      '1 %s = %s %s',
      selectedCryptoCurrencyCode,
      quoteExchangeRate.toFixed(2),
      selectedFiatCurrencyCode
    )
  }, [selectedCryptoCurrencyCode, quoteExchangeRate, selectedFiatCurrencyCode])

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
    if (isMaxAmount) {
      // Toggle off max mode
      setIsMaxAmount(false)
      setUserInput('')
      // Keep lastUsedInput as is so the UI remains focused on the same field
    } else {
      // Toggle on max mode
      setIsMaxAmount(true)
      setLastUsedInput('fiat')
      setUserInput('') // Clear input when using max
    }
  })

  // Render region selection view
  if (shouldShowRegionSelect) {
    return (
      <SceneWrapper scroll hasTabs>
        <SceneContainer headerTitle={lstrings.buy_crypto}>
          <SubtitleText>
            {lstrings.trade_region_select_start_steps}
          </SubtitleText>

          <StepsCard>
            <StepContainer>
              <StepRow>
                <StepNumberText>
                  {sprintf(lstrings.step_prefix_s, '1')}
                </StepNumberText>
                <StepText numberOfLines={0}>
                  {lstrings.trade_region_select_step_1}
                </StepText>
              </StepRow>
              <StepRow>
                <StepNumberText>
                  {sprintf(lstrings.step_prefix_s, '2')}
                </StepNumberText>
                <StepText numberOfLines={0}>
                  {lstrings.trade_region_select_step_2}
                </StepText>
              </StepRow>
              <StepRow>
                <StepNumberText>
                  {sprintf(lstrings.step_prefix_s, '3')}
                </StepNumberText>
                <StepText numberOfLines={0}>
                  {lstrings.trade_region_select_step_3}
                </StepText>
              </StepRow>
              <StepRow>
                <StepNumberText>
                  {sprintf(lstrings.step_prefix_s, '4')}
                </StepNumberText>
                <StepText numberOfLines={0}>
                  {lstrings.trade_region_select_step_4}
                </StepText>
              </StepRow>
            </StepContainer>
          </StepsCard>

          <RegionButton onPress={handleRegionSelect}>
            <RegionButtonContent>
              {flagUri != null ? (
                <FlagIcon source={{ uri: flagUri }} sizeRem={1.5} />
              ) : (
                <GlobeIcon
                  name="globe"
                  color={theme.iconTappable}
                  size={theme.rem(1.5)}
                />
              )}
              <RegionButtonText>{getRegionText()}</RegionButtonText>
              <Feather
                name="chevron-right"
                color={theme.iconTappable}
                size={theme.rem(1.25)}
              />
            </RegionButtonContent>
          </RegionButton>
        </SceneContainer>
      </SceneWrapper>
    )
  }

  // Render trade form view
  return (
    <>
      <SceneWrapper scroll hasTabs>
        <SceneContainer
          headerTitle={lstrings.buy_crypto}
          headerTitleChildren={
            <PillButton
              icon={() =>
                flagUri != null ? <FlagIcon source={{ uri: flagUri }} /> : null
              }
              label={getRegionText()}
              onPress={handleRegionSelect}
            />
          }
        >
          {/* Amount Inputs */}
          <InputsView>
            {/* Top Input (Fiat) */}
            <InputRowView>
              <DropDownInputButton onPress={handleFiatDropdown}>
                {selectedFiatFlagUri !== '' ? (
                  <FlagIcon
                    sizeRem={1.5}
                    source={{ uri: selectedFiatFlagUri }}
                  />
                ) : (
                  <FiatIcon
                    sizeRem={1.5}
                    fiatCurrencyCode={selectedFiatCurrencyCode}
                  />
                )}
              </DropDownInputButton>

              <InputColumnView>
                <FilledTextInput
                  value={displayFiatAmount}
                  onChangeText={handleFiatChangeText}
                  placeholder={sprintf(
                    lstrings.trade_create_amount_s,
                    selectedFiatCurrencyCode
                  )}
                  keyboardType="decimal-pad"
                  numeric
                  showSpinner={isFetchingQuotes && lastUsedInput === 'crypto'}
                  disabled={fiatInputDisabled}
                />
              </InputColumnView>
            </InputRowView>

            {/* Bottom Input (Crypto by design) */}
            <InputRowView>
              <DropDownInputButton onPress={handleCryptDropdown}>
                {selectedCrypto == null || selectedWallet == null ? null : (
                  <CryptoIcon
                    sizeRem={1.5}
                    pluginId={selectedWallet?.currencyInfo.pluginId ?? ''}
                    tokenId={selectedCrypto.tokenId}
                  />
                )}
              </DropDownInputButton>

              <InputColumnView>
                <FilledTextInput
                  value={displayCryptoAmount}
                  onChangeText={handleCryptoChangeText}
                  placeholder={sprintf(
                    lstrings.trade_create_amount_s,
                    selectedCryptoCurrencyCode
                  )}
                  keyboardType="decimal-pad"
                  numeric
                  showSpinner={isFetchingQuotes && lastUsedInput === 'fiat'}
                  disabled={cryptoInputDisabled}
                />
                {/* MAX Button */}
                <MaxButton onPress={handleMaxPress}>
                  <MaxButtonText>{lstrings.trade_create_max}</MaxButtonText>
                </MaxButton>
              </InputColumnView>
            </InputRowView>
          </InputsView>

          {/* Exchange Rate */}
          {selectedCrypto == null ||
          selectedWallet == null ||
          denomination == null ||
          (userInput === '' && !isMaxAmount) ||
          lastUsedInput == null ||
          (!isLoadingQuotes && sortedQuotes.length === 0) ? null : (
            <ExchangeRateContainer>
              <ExchangeRateTitle>
                {lstrings.trade_create_exchange_rate}
              </ExchangeRateTitle>
              {bestQuote != null ? (
                <ExchangeRateValueText>
                  {exchangeRateText}
                </ExchangeRateValueText>
              ) : null}
              <ActivityIndicator
                style={{ opacity: isFetchingQuotes ? 1 : 0 }}
              />
            </ExchangeRateContainer>
          )}

          {/* Alert for no supported plugins */}
          {!isCheckingSupport &&
          supportedPlugins.length === 0 &&
          userInput !== '' &&
          lastUsedInput != null &&
          selectedWallet != null &&
          selectedCryptoCurrencyCode != null ? (
            <AlertCardUi4
              type="warning"
              title={lstrings.trade_buy_unavailable_title}
              body={sprintf(
                lstrings.trade_buy_unavailable_body_2s,
                selectedCryptoCurrencyCode,
                selectedFiatCurrencyCode
              )}
            />
          ) : null}

          {/* Error Alert for Failed Quotes */}
          {!isFetchingQuotes &&
          !isCheckingSupport &&
          supportedPluginsError != null &&
          quoteErrors.length > 0 &&
          sortedQuotes.length === 0 &&
          supportedPlugins.length > 0 &&
          (userInput !== '' || isMaxAmount) ? (
            <AlertCardUi4
              type="error"
              title={lstrings.trade_buy_unavailable_title}
              body={sprintf(
                lstrings.trade_buy_unavailable_body_2s,
                selectedCryptoCurrencyCode,
                selectedFiatCurrencyCode
              )}
            />
          ) : null}
        </SceneContainer>
      </SceneWrapper>
      {/* Next Button - Must be sibling of SceneWrapper for proper keyboard positioning */}
      <KavButton
        label={lstrings.trade_create_next}
        onPress={handleNext}
        hasTabs
        disabled={
          selectedWallet == null ||
          selectedCryptoCurrencyCode == null ||
          (userInput === '' && !isMaxAmount) ||
          lastUsedInput === null ||
          isPluginsLoading ||
          isCheckingSupport ||
          supportedPlugins.length === 0 ||
          isLoadingQuotes ||
          sortedQuotes.length === 0 ||
          (lastUsedInput === 'fiat' && fiatInputDisabled) ||
          (lastUsedInput === 'crypto' && cryptoInputDisabled)
        }
      />
    </>
  )
}

const FlagIcon = styled(FastImage)<{ sizeRem?: number }>(
  theme =>
    ({ sizeRem = 1 }) => ({
      width: theme.rem(sizeRem),
      height: theme.rem(sizeRem),
      borderRadius: theme.rem(0.75)
    })
)

const InputsView = styled(View)(theme => ({
  paddingHorizontal: theme.rem(0.5),
  gap: theme.rem(1)
}))

const InputRowView = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: theme.rem(1)
}))

const MaxButton = styled(EdgeTouchableOpacity)(theme => ({
  alignSelf: 'flex-end',
  padding: theme.rem(0.25),
  margin: theme.rem(0.25),
  borderRadius: theme.rem(0.5),
  borderColor: theme.escapeButtonText
}))

const MaxButtonText = styled(Text)(theme => ({
  color: theme.escapeButtonText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(0.75),
  includeFontPadding: false
}))

const ExchangeRateContainer = styled(View)(theme => ({
  paddingHorizontal: theme.rem(1),
  paddingVertical: theme.rem(2),
  alignItems: 'center'
}))

const ExchangeRateTitle = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1),
  color: theme.primaryText,
  textAlign: 'center',
  marginBottom: theme.rem(0.5)
}))

const ExchangeRateValueText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(1.125),
  fontWeight: 'bold',
  color: theme.primaryText,
  textAlign: 'center',
  marginBottom: theme.rem(0.5)
}))

const InputColumnView = styled(View)(() => ({
  flex: 1
}))

//
// Region Select Primitives
//

const StepsCard = styled(View)(theme => ({
  margin: theme.rem(1),
  marginHorizontal: theme.rem(0.5),
  padding: theme.rem(1),
  backgroundColor: theme.cardBaseColor,
  borderRadius: theme.rem(0.5),
  borderWidth: theme.thinLineWidth,
  borderColor: theme.cardBorderColor
}))

const StepContainer = styled(View)(theme => ({
  gap: theme.rem(0.75)
}))

const StepRow = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: theme.rem(0.5)
}))

const StepNumberText = styled(EdgeText)(theme => ({
  fontWeight: '600',
  minWidth: theme.rem(1.25)
}))
const StepText = styled(EdgeText)(() => ({
  flex: 1
}))

const RegionButton = styled(EdgeTouchableOpacity)(theme => ({
  marginTop: theme.rem(1.5),
  marginHorizontal: theme.rem(0.5)
}))

const RegionButtonContent = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: theme.cardBaseColor,
  borderRadius: theme.rem(0.5),
  padding: theme.rem(1),
  borderWidth: theme.thinLineWidth,
  borderColor: theme.cardBorderColor,
  gap: theme.rem(0.5)
}))

const GlobeIcon = styled(Feather)(theme => ({
  marginRight: theme.rem(0.75)
}))

const SubtitleText = styled(EdgeText)(theme => ({
  color: theme.primaryText,
  fontSize: theme.rem(1.25),
  fontFamily: theme.fontFaceDefault,
  marginTop: theme.rem(1),
  marginBottom: theme.rem(0.5),
  marginHorizontal: theme.rem(0.5)
}))

const RegionButtonText = styled(EdgeText)(theme => ({
  flex: 1,
  color: theme.primaryText,
  fontSize: theme.rem(1.1),
  fontFamily: theme.fontFaceDefault
}))
