import { div, log10, mul, round } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import React, { useMemo } from 'react'
import { ReturnKeyType, TouchableOpacity, View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { getExchangeDenom, selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, getDenomFromIsoCode, maxPrimaryCurrencyConversionDecimals, precisionAdjust, removeIsoPrefix } from '../../util/utils'
import { styled } from '../hoc/styled'
import { CryptoIcon } from '../icons/CryptoIcon'
import { Space } from '../layout/Space'
import { EdgeText } from './EdgeText'
import { FieldNum, FlipInput2, FlipInputFieldInfos, FlipInputRef } from './FlipInput2'

export type ExchangeFlipInputFields = 'fiat' | 'crypto'

export interface SwapInputCardInputRef {
  setAmount: (field: ExchangeFlipInputFields, value: string) => void
  triggerConvertValue: () => void
}

export interface SwapInputCardAmounts {
  exchangeAmount: string
  nativeAmount: string
  fiatAmount: string
  fieldChanged: 'fiat' | 'crypto'
}

export interface Props {
  disabled?: boolean
  heading: string
  forceField?: 'fiat' | 'crypto'
  inputAccessoryViewID?: string
  keyboardVisible?: boolean
  placeholders?: [string, string]
  returnKeyType?: ReturnKeyType
  startNativeAmount?: string
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
  walletPlaceholderText: string
  // Events:
  onAmountChanged: (amounts: SwapInputCardAmounts) => unknown
  onBlur?: () => void
  onFocus?: () => void
  onNext?: () => void
  onSelectWallet: () => void
}

const forceFieldMap: { crypto: FieldNum; fiat: FieldNum } = {
  crypto: 0,
  fiat: 1
}

const SwapInputComponent = React.forwardRef<SwapInputCardInputRef, Props>((props: Props, ref) => {
  const {
    disabled,
    forceField = 'crypto',
    heading,
    inputAccessoryViewID,
    keyboardVisible = true,
    placeholders,
    startNativeAmount,
    returnKeyType,
    tokenId,
    wallet,
    walletPlaceholderText,
    // Events:
    onAmountChanged,
    onBlur,
    onFocus,
    onNext
  } = props

  const exchangeRates = useSelector(state => state.exchangeRates)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const flipInputRef = React.useRef<FlipInputRef>(null)

  const cryptoDisplayDenom = useSelector(state => selectDisplayDenom(state, wallet.currencyConfig, tokenId))
  const fiatDenom = getDenomFromIsoCode(defaultIsoFiat)

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

    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const cryptoExchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
    const exchangeAmount = div(nativeAmount, cryptoExchangeDenom.multiplier, DECIMAL_PRECISION)
    const displayAmount = div(nativeAmount, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)
    const fiatAmountLong = convertCurrency(exchangeAmount, cryptoCurrencyCode, defaultIsoFiat)
    const fiatAmount = round(fiatAmountLong, -2)
    return { fiatAmount, exchangeAmount, displayAmount }
  })

  const convertFromFiat = useHandler((fiatAmount: string) => {
    if (fiatAmount === '') return { nativeAmount: '', exchangeAmount: '', displayAmount: '' }

    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const cryptoExchangeDenom = getExchangeDenom(wallet.currencyConfig, tokenId)
    const exchangeAmountLong = convertCurrency(fiatAmount, defaultIsoFiat, cryptoCurrencyCode)
    const nativeAmountLong = mul(exchangeAmountLong, cryptoExchangeDenom.multiplier)
    const displayAmountLong = div(nativeAmountLong, cryptoDisplayDenom.multiplier, DECIMAL_PRECISION)

    const precisionAdjustVal = precisionAdjust({
      primaryExchangeMultiplier: cryptoExchangeDenom.multiplier,
      secondaryExchangeMultiplier: fiatDenom.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRates[`${cryptoCurrencyCode}_${defaultIsoFiat}`]
    })
    const cryptoMaxPrecision = maxPrimaryCurrencyConversionDecimals(log10(cryptoDisplayDenom.multiplier), precisionAdjustVal)

    // Apply cryptoMaxPrecision to remove extraneous sub-penny precision
    const displayAmount = round(displayAmountLong, -cryptoMaxPrecision)

    // Convert back to native and exchange amounts after cryptoMaxPrecision has been applied
    const nativeAmount = mul(displayAmount, cryptoDisplayDenom.multiplier)
    const exchangeAmount = div(nativeAmount, cryptoExchangeDenom.multiplier, DECIMAL_PRECISION)
    return { displayAmount, nativeAmount, exchangeAmount }
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

  const handleWalletPlaceholderPress = () => {
    props.onSelectWallet()
  }

  const { initialExchangeAmount, initialDisplayAmount } = React.useMemo(() => {
    const { exchangeAmount, displayAmount } = convertFromCryptoNative(startNativeAmount ?? '')
    return { initialExchangeAmount: exchangeAmount, initialDisplayAmount: displayAmount }
  }, [convertFromCryptoNative, startNativeAmount])

  const initialFiatAmount = React.useMemo(() => {
    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const fiatAmount = convertCurrency(initialExchangeAmount, cryptoCurrencyCode, defaultIsoFiat)
    return fiatAmount
  }, [convertCurrency, defaultIsoFiat, initialExchangeAmount, tokenId, wallet])

  React.useImperativeHandle(ref, () => ({
    setAmount: (field, value) => {
      if (field === 'crypto') {
        const { displayAmount, fiatAmount } = convertFromCryptoNative(value)
        flipInputRef.current?.setAmounts([displayAmount, fiatAmount])
      } else if (field === 'fiat') {
        const { displayAmount } = convertFromFiat(value)
        flipInputRef.current?.setAmounts([displayAmount, value])
      }
    },
    triggerConvertValue: () => {
      flipInputRef.current?.triggerConvertValue()
    }
  }))

  /**
   * Override the 'forceField' prop in some cases.
   * If we set 'forceField' to fiat and we don't yet have exchange rates, ensure
   * that we force the user to input a crypto amount, even if the caller wanted
   * to initialize the focused flip input field with fiat.
   */
  const overrideForceField = useMemo(() => {
    const cryptoCurrencyCode = getCurrencyCode(wallet, tokenId)
    const fiatValue = convertCurrency('100', cryptoCurrencyCode, defaultIsoFiat)
    return fiatValue === '0' ? 'crypto' : forceField
  }, [convertCurrency, defaultIsoFiat, forceField, tokenId, wallet])

  const renderHeader = () => {
    return (
      <Header>
        <CardHeading>{heading}</CardHeading>
        <Space row>
          <WalletPlaceHolder onPress={handleWalletPlaceholderPress}>
            <CryptoIcon marginRem={[0, 0.25, 0, 0]} pluginId={wallet.currencyInfo.pluginId} sizeRem={1} tokenId={tokenId} />
            <WalletPlaceHolderText>{walletPlaceholderText}</WalletPlaceHolderText>
          </WalletPlaceHolder>
        </Space>
      </Header>
    )
  }

  const renderFooter = () => {
    return <FooterSpace />
  }

  return (
    <>
      <FlipInput2
        convertValue={convertValue}
        disabled={disabled}
        fieldInfos={fieldInfos}
        forceFieldNum={forceFieldMap[overrideForceField]}
        inputAccessoryViewID={inputAccessoryViewID}
        keyboardVisible={keyboardVisible}
        placeholders={placeholders}
        ref={flipInputRef}
        renderFooter={renderFooter}
        renderHeader={renderHeader}
        returnKeyType={returnKeyType}
        startAmounts={[initialDisplayAmount, initialFiatAmount]}
        // Events:
        onBlur={onBlur}
        onFocus={onFocus}
        onNext={onNext}
      />
    </>
  )
})

export const SwapInput = React.memo(SwapInputComponent)

const Header = styled(View)(theme => ({
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
  margin: theme.rem(1),
  marginBottom: theme.rem(0.25)
}))

const CardHeading = styled(EdgeText)(theme => ({
  color: theme.secondaryText
}))

const WalletPlaceHolder = styled(TouchableOpacity)(theme => ({
  alignItems: 'center',
  backgroundColor: theme.cardBaseColor,
  borderRadius: 100,
  flexDirection: 'row',
  paddingHorizontal: theme.rem(0.75),
  paddingVertical: theme.rem(0.25)
}))

const WalletPlaceHolderText = styled(EdgeText)(theme => ({
  fontSize: theme.rem(0.75),
  lineHeight: theme.rem(1.5)
}))

// This space is used to give the FlipInput2 roughly 1 rem bottom padding to
// match the top padding from the header.
const FooterSpace = styled(View)(theme => ({
  height: theme.rem(0.5)
}))
