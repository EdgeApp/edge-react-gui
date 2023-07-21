import { div, log10, mul, round } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Platform, ReturnKeyType, TouchableOpacity } from 'react-native'

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
import { FieldNum, FlipInput2, FlipInputFieldInfo, FlipInputRef } from './FlipInput2'
import { RightChevronButton } from './ThemedButtons'

export type ExchangeFlipInputFields = 'fiat' | 'crypto'

export interface ExchangedFlipInputRef {
  setAmount: (field: ExchangeFlipInputFields, value: string) => void
}

export interface ExchangedFlipInputAmounts {
  exchangeAmount: string
  nativeAmount: string
  fiatAmount: string
  fieldChanged: 'fiat' | 'crypto'
}

export interface Props {
  walletId: string
  tokenId?: string
  startNativeAmount?: string
  keyboardVisible?: boolean
  headerText: string
  forceField?: 'fiat' | 'crypto'
  returnKeyType?: ReturnKeyType
  editable?: boolean
  inputAccessoryViewID?: string
  headerCallback?: () => void
  onAmountChanged: (amounts: ExchangedFlipInputAmounts) => unknown
  onNext?: () => void
}

const forceFieldMap: { crypto: FieldNum; fiat: FieldNum } = {
  crypto: 0,
  fiat: 1
}

// ExchangedFlipInput2 wraps FlipInput2
// 1. It accepts native crypto amounts from the parent for initial amount and setAmount
// 2. Has FlipInput2 only show "display" amounts (ie. sats, bits, mETH)
// 3. Returns values to parent in fiat exchange amt, crypto exchange amt, and crypto native amt

const ExchangedFlipInput2Component = React.forwardRef<ExchangedFlipInputRef, Props>((props: Props, ref) => {
  const {
    walletId,
    tokenId,
    onNext,
    startNativeAmount,
    onAmountChanged,
    headerText,
    headerCallback,
    returnKeyType,
    forceField = 'crypto',
    keyboardVisible = true,
    editable,
    inputAccessoryViewID
  } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const coreWallet: EdgeCurrencyWallet | undefined = currencyWallets[walletId]
  const fiatCurrencyCode = useWatch(coreWallet, 'fiatCurrencyCode')
  const flipInputRef = React.useRef<FlipInputRef>(null)

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

  const convertCurrency = useHandler((amount: string, fromCurrencyCode: string, toCurrencyCode: string): string => {
    const rateKey = `${fromCurrencyCode}_${toCurrencyCode}`
    const rate = exchangeRates[rateKey] ?? '0'
    return mul(amount, rate)
  })

  const convertFromCryptoNative = useHandler((nativeAmount: string) => {
    if (nativeAmount === '') return { fiatAmount: '', exchangeAmount: '', displayAmount: '' }
    const exchangeAmount = div(nativeAmount, cryptoExchangeDenom.multiplier, DECIMAL_PRECISION)
    const displayAmount = div(nativeAmount, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)
    const fiatAmountLong = convertCurrency(exchangeAmount, cryptoCurrencyCode, fiatCurrencyCode)
    const fiatAmount = round(fiatAmountLong, -2)
    return { fiatAmount, exchangeAmount, displayAmount }
  })

  const convertFromFiat = useHandler((fiatAmount: string) => {
    if (fiatAmount === '') return { nativeAmount: '', exchangeAmount: '', displayAmount: '' }
    const exchangeAmountLong = convertCurrency(fiatAmount, fiatCurrencyCode, cryptoCurrencyCode)
    const nativeAmountLong = mul(exchangeAmountLong, cryptoExchangeDenom.multiplier)
    const displayAmountLong = div(nativeAmountLong, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)

    // Apply cryptoMaxPrecision to remove extraneous sub-penny precision
    const displayAmount = round(displayAmountLong, -cryptoMaxPrecision)

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
  }, [convertCurrency, convertFromCryptoNative, cryptoCurrencyCode, fiatCurrencyCode, startNativeAmount])

  React.useImperativeHandle(ref, () => ({
    setAmount: (field, value) => {
      console.log(field, value)
      if (field === 'crypto') {
        const { displayAmount, fiatAmount } = convertFromCryptoNative(value)
        flipInputRef.current?.setAmounts([displayAmount, fiatAmount])
      } else if (field === 'fiat') {
        const { displayAmount } = convertFromFiat(value)
        flipInputRef.current?.setAmounts([displayAmount, value])
      }
    }
  }))

  /**
   * Override the 'forceField' prop in some cases.
   * If we set 'forceField' to fiat and we don't yet have exchange rates, ensure
   * that we force the user to input a crypto amount, even if the caller wanted
   * to initialize the focused flip input field with fiat.
   */
  const overrideForceField = useMemo(
    () => (convertCurrency('100', cryptoCurrencyCode, fiatCurrencyCode) === '0' ? 'crypto' : forceField),
    [convertCurrency, cryptoCurrencyCode, fiatCurrencyCode, forceField]
  )

  return coreWallet != null ? (
    <>
      <TouchableOpacity accessible={false} onPress={headerCallback} style={styles.headerContainer}>
        <CryptoIcon marginRem={[0, 1, 0, 0]} pluginId={pluginId} sizeRem={1.5} tokenId={tokenId} />
        {headerCallback ? <RightChevronButton text={headerText} onPress={headerCallback} /> : <EdgeText style={styles.headerText}>{headerText}</EdgeText>}
      </TouchableOpacity>

      <FlipInput2
        onNext={onNext}
        ref={flipInputRef}
        convertValue={convertValue}
        editable={editable}
        fieldInfos={fieldInfos}
        returnKeyType={returnKeyType}
        forceFieldNum={forceFieldMap[overrideForceField]}
        inputAccessoryViewID={inputAccessoryViewID}
        keyboardVisible={keyboardVisible}
        startAmounts={[renderDisplayAmount ?? '', renderFiatAmount]}
      />
    </>
  ) : (
    <ActivityIndicator />
  )
})

export const ExchangedFlipInput2 = React.memo(ExchangedFlipInput2Component)

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
