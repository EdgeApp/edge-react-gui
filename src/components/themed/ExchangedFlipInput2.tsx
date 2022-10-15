import { div, log10, mul, toFixed } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import React, { useState } from 'react'
import { ActivityIndicator, Platform, TouchableOpacity } from 'react-native'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useExchangeDenom } from '../../hooks/useExchangeDenom'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, getDenomFromIsoCode, maxPrimaryCurrencyConversionDecimals, precisionAdjust } from '../../util/utils'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { FlipInput2, FlipInputFieldInfo, FlipInputGetMethodsResponse } from './FlipInput2'
import { RightChevronButton } from './ThemedButtons'

export type ExchangeFlipInputFields = 'fiat' | 'crypto'

export interface ExchangedFlipInputGetMethodsResponse {
  setAmount: (field: ExchangeFlipInputFields, value: string) => void
}

export type ExchangedFlipInputAmounts = {
  exchangeAmount: string
  nativeAmount: string
  fiatAmount: string
  fieldChanged: 'fiat' | 'crypto'
}

export type ExchangedFlipInputProps = {
  walletId: string
  tokenId?: string
  startNativeAmount?: string
  headerText: string
  headerCallback?: () => void
  onAmountChanged: (amounts: ExchangedFlipInputAmounts) => unknown
  getMethods?: (methods: ExchangedFlipInputGetMethodsResponse) => void
}

// ExchangedFlipInput2 wraps FlipInput2
// 1. It accepts native crypto amounts from the parent for initial amount and setAmount
// 2. Has FlipInput2 only show "display" amounts (ie. sats, bits, mETH)
// 3. Returns values to parent in fiat exchange amt, crypto exchange amt, and crypto native amt

export const ExchangedFlipInput2 = React.memo((props: ExchangedFlipInputProps) => {
  const { walletId, tokenId, startNativeAmount, onAmountChanged, getMethods, headerText, headerCallback } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const coreWallet: EdgeCurrencyWallet | undefined = currencyWallets[walletId]
  const fiatCurrencyCode = useWatch(coreWallet, 'fiatCurrencyCode')
  let methods: FlipInputGetMethodsResponse | undefined

  const pluginId = coreWallet?.currencyInfo.pluginId ?? ''
  const cryptoCurrencyCode = getCurrencyCode(coreWallet, tokenId)
  const cryptoExchangeDenom = useExchangeDenom(pluginId, cryptoCurrencyCode)
  const cryptoDisplayDenom = useDisplayDenom(pluginId, cryptoCurrencyCode)
  const fiatDenom = getDenomFromIsoCode(fiatCurrencyCode)

  const precisionAdjustVal = precisionAdjust({
    primaryExchangeMultiplier: cryptoExchangeDenom.multiplier,
    secondaryExchangeMultiplier: fiatDenom.multiplier,
    exchangeSecondaryToPrimaryRatio: exchangeRates[`${cryptoCurrencyCode}_${fiatCurrencyCode}`]
  })
  const cryptoMaxPrecision = maxPrimaryCurrencyConversionDecimals(log10(cryptoDisplayDenom.multiplier), precisionAdjustVal)
  const fieldInfos: FlipInputFieldInfo[] = [
    { currencyName: cryptoDisplayDenom.name, maxEntryDecimals: log10(cryptoDisplayDenom.multiplier) },
    { currencyName: fiatDenom.name.replace('iso:', ''), maxEntryDecimals: log10(fiatDenom.multiplier) }
  ]

  const convertCurrency = (amount: string, fromCurrencyCode: string, toCurrencyCode: string): string => {
    const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
    const rate = exchangeRates[rateKey] ?? '0'
    return mul(amount, rate)
  }

  const getFlipInputMethods = useHandler(m => {
    methods = m
  })

  const convertFromCryptoNative = useHandler((nativeAmount: string) => {
    const exchangeAmount = div(nativeAmount, cryptoExchangeDenom.multiplier, DECIMAL_PRECISION)
    const displayAmount = div(nativeAmount, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)
    const fiatAmount = convertCurrency(exchangeAmount, cryptoCurrencyCode, fiatCurrencyCode)
    return { fiatAmount, exchangeAmount, displayAmount }
  })

  const convertFromFiat = useHandler((fiatAmount: string) => {
    const exchangeAmountLong = convertCurrency(fiatAmount, fiatCurrencyCode, cryptoCurrencyCode)
    const nativeAmountLong = mul(exchangeAmountLong, cryptoExchangeDenom.multiplier)
    const displayAmountLong = div(nativeAmountLong, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)

    // Apply cryptoMaxPrecision to remove extraneous sub-penny precision
    const displayAmount = toFixed(displayAmountLong, 0, cryptoMaxPrecision)

    // Convert back to native and exchange amounts after cryptoMaxPrecision has been applied
    const nativeAmount = mul(displayAmount, cryptoDisplayDenom.multiplier)
    const exchangeAmount = div(nativeAmount, cryptoExchangeDenom.multiplier, DECIMAL_PRECISION)
    return { displayAmount, nativeAmount, exchangeAmount }
  })

  const [renderDisplayAmount, setRenderDisplayAmount] = useState<string>(() => {
    const { displayAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    return displayAmount
  })
  const [renderFiatAmount, setRenderFiatAmount] = useState<string>(() => {
    const { fiatAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    return fiatAmount
  })

  const convertValueSync = useHandler((fieldNum: number, amount: string): string | undefined => {
    if (amount === '') {
      onAmountChanged({
        exchangeAmount: '',
        nativeAmount: '',
        fiatAmount: '',
        fieldChanged: fieldNum ? 'fiat' : 'crypto'
      })
      return ''
    }
    if (fieldNum === 0) {
      const nativeAmount = mul(amount, cryptoDisplayDenom.multiplier)
      const { fiatAmount, exchangeAmount } = convertFromCryptoNative(nativeAmount)
      onAmountChanged({
        exchangeAmount,
        nativeAmount,
        fiatAmount,
        fieldChanged: 'crypto'
      })

      return fiatAmount
    } else {
      const { nativeAmount, exchangeAmount, displayAmount } = convertFromFiat(amount)
      onAmountChanged({
        exchangeAmount,
        nativeAmount,
        fiatAmount: amount,
        fieldChanged: 'fiat'
      })
      return displayAmount
    }
  })

  const convertValue = async (fieldNum: number, amount: string): Promise<string | undefined> => convertValueSync(fieldNum, amount)

  React.useEffect(() => {
    const { exchangeAmount, displayAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    const initFiat = convertCurrency(exchangeAmount, cryptoCurrencyCode, fiatCurrencyCode)
    setRenderDisplayAmount(displayAmount)
    setRenderFiatAmount(initFiat)
    if (getMethods != null) {
      getMethods({
        setAmount: (field, value) => {
          console.log(field, value)
          if (field === 'crypto') {
            const { displayAmount, fiatAmount } = convertFromCryptoNative(value)
            methods?.setAmounts([displayAmount, fiatAmount])
          } else if (field === 'fiat') {
            const { displayAmount } = convertFromFiat(value)
            methods?.setAmounts([displayAmount, value])
          }
        }
      })
    }
  }, [])

  return (
    <>
      {coreWallet != null ? (
        <>
          <TouchableOpacity onPress={headerCallback} style={styles.headerContainer}>
            <CryptoIcon pluginId={pluginId} currencyCode={cryptoCurrencyCode} marginRem={[0, 1, 0, 0]} sizeRem={1.5} />
            {headerCallback ? <RightChevronButton text={headerText} onPress={headerCallback} /> : <EdgeText style={styles.headerText}>{headerText}</EdgeText>}
          </TouchableOpacity>

          <FlipInput2
            convertValue={convertValue}
            fieldInfos={fieldInfos}
            getMethods={getFlipInputMethods}
            startAmounts={[renderDisplayAmount ?? '', renderFiatAmount]}
          />
        </>
      ) : (
        <ActivityIndicator />
      )}
    </>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  // Header
  headerContainer: {
    marginRight: Platform.OS === 'ios' ? theme.rem(3.5) : theme.rem(1.5), // Different because adjustsFontSizeToFit behaves differently on android vs ios
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.rem(1)
  },
  headerText: {
    fontWeight: '600',
    fontSize: theme.rem(1.0)
  }
}))
