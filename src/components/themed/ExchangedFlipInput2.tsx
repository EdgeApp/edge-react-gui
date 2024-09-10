import { div, log10, mul, round } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import React, { useMemo, useState } from 'react'
import { Platform, ReturnKeyType } from 'react-native'

import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { useHandler } from '../../hooks/useHandler'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, getDenomFromIsoCode, maxPrimaryCurrencyConversionDecimals, precisionAdjust, removeIsoPrefix } from '../../util/utils'
import { CryptoIcon } from '../icons/CryptoIcon'
import { EdgeRow } from '../rows/EdgeRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { FieldNum, FlipInput2, FlipInputFieldInfos, FlipInputRef } from './FlipInput2'

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
  wallet: EdgeCurrencyWallet
  tokenId: EdgeTokenId
  startNativeAmount?: string
  keyboardVisible?: boolean
  headerText: string
  forceField?: 'fiat' | 'crypto'
  returnKeyType?: ReturnKeyType
  editable?: boolean
  inputAccessoryViewID?: string
  headerCallback?: () => void | Promise<void>
  onAmountChanged: (amounts: ExchangedFlipInputAmounts) => unknown
  onBlur?: () => void
  onFocus?: () => void
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
    wallet,
    tokenId,
    onBlur,
    onFocus,
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

  const exchangeRates = useSelector(state => state.exchangeRates)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const flipInputRef = React.useRef<FlipInputRef>(null)

  const pluginId = wallet.currencyInfo.pluginId
  const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
  const cryptoExchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
  const cryptoDisplayDenom = useDisplayDenom(wallet.currencyConfig, tokenId)
  const fiatDenom = getDenomFromIsoCode(defaultIsoFiat)

  const precisionAdjustVal = precisionAdjust({
    primaryExchangeMultiplier: cryptoExchangeDenom.multiplier,
    secondaryExchangeMultiplier: fiatDenom.multiplier,
    exchangeSecondaryToPrimaryRatio: exchangeRates[`${cryptoCurrencyCode}_${defaultIsoFiat}`]
  })
  const cryptoMaxPrecision = maxPrimaryCurrencyConversionDecimals(log10(cryptoDisplayDenom.multiplier), precisionAdjustVal)
  const fieldInfos: FlipInputFieldInfos = [
    { currencyName: cryptoDisplayDenom.name, maxEntryDecimals: log10(cryptoDisplayDenom.multiplier) },
    { currencyName: removeIsoPrefix(fiatDenom.name), maxEntryDecimals: log10(fiatDenom.multiplier) }
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
    const fiatAmountLong = convertCurrency(exchangeAmount, cryptoCurrencyCode, defaultIsoFiat)
    const fiatAmount = round(fiatAmountLong, -2)
    return { fiatAmount, exchangeAmount, displayAmount }
  })

  const convertFromFiat = useHandler((fiatAmount: string) => {
    if (fiatAmount === '') return { nativeAmount: '', exchangeAmount: '', displayAmount: '' }
    const exchangeAmountLong = convertCurrency(fiatAmount, defaultIsoFiat, cryptoCurrencyCode)
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

  const convertValue = useHandler(async (fieldNum: number, amount: string): Promise<string | undefined> => {
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

  React.useEffect(() => {
    const { exchangeAmount, displayAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    const initFiat = convertCurrency(exchangeAmount, cryptoCurrencyCode, defaultIsoFiat)
    setRenderDisplayAmount(displayAmount)
    setRenderFiatAmount(initFiat)
  }, [convertCurrency, convertFromCryptoNative, cryptoCurrencyCode, defaultIsoFiat, startNativeAmount])

  React.useImperativeHandle(ref, () => ({
    setAmount: (field, value) => {
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
    () => (convertCurrency('100', cryptoCurrencyCode, defaultIsoFiat) === '0' ? 'crypto' : forceField),
    [convertCurrency, cryptoCurrencyCode, defaultIsoFiat, forceField]
  )

  return (
    <>
      <EdgeRow onPress={headerCallback} icon={<CryptoIcon marginRem={[0, 0.5, 0, 0]} pluginId={pluginId} sizeRem={1.5} tokenId={tokenId} />}>
        <EdgeText style={styles.headerText}>{headerText}</EdgeText>
      </EdgeRow>

      <FlipInput2
        onBlur={onBlur}
        onFocus={onFocus}
        onNext={onNext}
        ref={flipInputRef}
        convertValue={convertValue}
        disabled={editable}
        fieldInfos={fieldInfos}
        returnKeyType={returnKeyType}
        forceFieldNum={forceFieldMap[overrideForceField]}
        inputAccessoryViewID={inputAccessoryViewID}
        keyboardVisible={keyboardVisible}
        startAmounts={[renderDisplayAmount ?? '', renderFiatAmount]}
      />
    </>
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
