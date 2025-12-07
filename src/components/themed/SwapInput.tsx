import { div, log10, mul, round } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import {
  getExchangeDenom,
  selectDisplayDenom
} from '../../selectors/DenominationSelectors'
import {
  convertCurrency,
  getExchangeRate
} from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import {
  DECIMAL_PRECISION,
  getDenomFromIsoCode,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  removeIsoPrefix
} from '../../util/utils'
import { PillButton } from '../buttons/PillButton'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import {
  type FieldNum,
  FlipInput2,
  type FlipInputFieldInfos,
  type FlipInputRef
} from './FlipInput2'

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
  keyboardVisible?: boolean
  placeholders?: [string, string]
  startNativeAmount?: string
  tokenId: EdgeTokenId
  wallet: EdgeCurrencyWallet
  walletPlaceholderText: string
  // Events:
  onAmountChanged: (amounts: SwapInputCardAmounts) => unknown
  onBlur?: () => void
  onFocus?: () => void
  onNext?: () => void
  onSelectWallet: () => Promise<void>
}

const forceFieldMap: { crypto: FieldNum; fiat: FieldNum } = {
  crypto: 0,
  fiat: 1
}

const SwapInputComponent = React.forwardRef<SwapInputCardInputRef, Props>(
  (props: Props, ref) => {
    const {
      disabled,
      forceField = 'crypto',
      heading,
      keyboardVisible = true,
      placeholders,
      startNativeAmount,
      tokenId,
      wallet,
      walletPlaceholderText,
      // Events:
      onAmountChanged,
      onSelectWallet,
      onBlur,
      onFocus,
      onNext
    } = props

    const theme = useTheme()
    const styles = getStyles(theme)

    const exchangeRates = useSelector(state => state.exchangeRates)
    const defaultIsoFiat = useSelector(
      state => state.ui.settings.defaultIsoFiat
    )
    const flipInputRef = React.useRef<FlipInputRef>(null)

    const cryptoDisplayDenom = useSelector(state =>
      selectDisplayDenom(state, wallet.currencyConfig, tokenId)
    )
    const fiatDenom = getDenomFromIsoCode(defaultIsoFiat)

    const fieldInfos: FlipInputFieldInfos = [
      {
        currencyName: cryptoDisplayDenom.name,
        maxEntryDecimals: log10(cryptoDisplayDenom.multiplier)
      },
      {
        currencyName: removeIsoPrefix(fiatDenom.name),
        maxEntryDecimals: log10(fiatDenom.multiplier)
      }
    ]

    const convertCurrencyHandler = useHandler(
      (
        amount: string,
        pluginId: string,
        tokenId: EdgeTokenId,
        isoFiatCode: string
      ): string => {
        return convertCurrency(
          exchangeRates,
          pluginId,
          tokenId,
          isoFiatCode,
          amount
        )
      }
    )

    const convertFromCryptoNative = useHandler((nativeAmount: string) => {
      if (nativeAmount === '')
        return { fiatAmount: '', exchangeAmount: '', displayAmount: '' }

      const cryptoExchangeDenom = getExchangeDenom(
        wallet.currencyConfig,
        tokenId
      )
      const exchangeAmount = div(
        nativeAmount,
        cryptoExchangeDenom.multiplier,
        DECIMAL_PRECISION
      )
      const displayAmount = div(
        nativeAmount,
        cryptoDisplayDenom.multiplier,
        DECIMAL_PRECISION
      )
      const fiatAmountLong = convertCurrencyHandler(
        exchangeAmount,
        wallet.currencyInfo.pluginId,
        tokenId,
        defaultIsoFiat
      )
      const fiatAmount = round(fiatAmountLong, -2)
      return { fiatAmount, exchangeAmount, displayAmount }
    })

    const convertFromFiat = useHandler((fiatAmount: string) => {
      if (fiatAmount === '')
        return { nativeAmount: '', exchangeAmount: '', displayAmount: '' }

      const cryptoExchangeDenom = getExchangeDenom(
        wallet.currencyConfig,
        tokenId
      )
      const exchangeRate = getExchangeRate(
        exchangeRates,
        wallet.currencyInfo.pluginId,
        tokenId,
        defaultIsoFiat
      )
      if (exchangeRate === 0) {
        return { nativeAmount: '0', exchangeAmount: '0', displayAmount: '0' }
      }
      const exchangeAmountLong = div(
        fiatAmount,
        exchangeRate,
        DECIMAL_PRECISION
      )
      const nativeAmountLong = mul(
        exchangeAmountLong,
        cryptoExchangeDenom.multiplier
      )
      const displayAmountLong = div(
        nativeAmountLong,
        cryptoDisplayDenom.multiplier,
        DECIMAL_PRECISION
      )

      const precisionAdjustVal = precisionAdjust({
        primaryExchangeMultiplier: cryptoExchangeDenom.multiplier,
        secondaryExchangeMultiplier: fiatDenom.multiplier,
        exchangeSecondaryToPrimaryRatio: getExchangeRate(
          exchangeRates,
          wallet.currencyInfo.pluginId,
          tokenId,
          defaultIsoFiat
        )
      })
      const cryptoMaxPrecision = maxPrimaryCurrencyConversionDecimals(
        log10(cryptoDisplayDenom.multiplier),
        precisionAdjustVal
      )

      // Apply cryptoMaxPrecision to remove extraneous sub-penny precision
      const displayAmount = round(displayAmountLong, -cryptoMaxPrecision)

      // Convert back to native and exchange amounts after cryptoMaxPrecision has been applied
      const nativeAmount = mul(displayAmount, cryptoDisplayDenom.multiplier)
      const exchangeAmount = div(
        nativeAmount,
        cryptoExchangeDenom.multiplier,
        DECIMAL_PRECISION
      )
      return { displayAmount, nativeAmount, exchangeAmount }
    })

    const convertValue = useHandler(
      async (fieldNum: number, amount: string): Promise<string | undefined> => {
        if (amount === '') {
          onAmountChanged({
            exchangeAmount: '',
            nativeAmount: '',
            fiatAmount: '',
            fieldChanged: fieldNum !== 0 ? 'fiat' : 'crypto'
          })
          return ''
        }
        if (fieldNum === 0) {
          const nativeAmount = mul(amount, cryptoDisplayDenom.multiplier)
          const { fiatAmount, exchangeAmount } =
            convertFromCryptoNative(nativeAmount)
          onAmountChanged({
            exchangeAmount,
            nativeAmount,
            fiatAmount,
            fieldChanged: 'crypto'
          })

          return fiatAmount
        } else {
          const { nativeAmount, exchangeAmount, displayAmount } =
            convertFromFiat(amount)
          onAmountChanged({
            exchangeAmount,
            nativeAmount,
            fiatAmount: amount,
            fieldChanged: 'fiat'
          })
          return displayAmount
        }
      }
    )

    const { initialExchangeAmount, initialDisplayAmount } =
      React.useMemo(() => {
        const { exchangeAmount, displayAmount } = convertFromCryptoNative(
          startNativeAmount ?? ''
        )
        return {
          initialExchangeAmount: exchangeAmount,
          initialDisplayAmount: displayAmount
        }
      }, [convertFromCryptoNative, startNativeAmount])

    const initialFiatAmount = React.useMemo(() => {
      const fiatAmount = convertCurrencyHandler(
        initialExchangeAmount,
        wallet.currencyInfo.pluginId,
        tokenId,
        defaultIsoFiat
      )
      return fiatAmount
    }, [
      convertCurrencyHandler,
      defaultIsoFiat,
      initialExchangeAmount,
      tokenId,
      wallet
    ])

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
      const fiatValue = convertCurrencyHandler(
        '100',
        wallet.currencyInfo.pluginId,
        tokenId,
        defaultIsoFiat
      )
      return fiatValue === '0' ? 'crypto' : forceField
    }, [convertCurrencyHandler, defaultIsoFiat, forceField, tokenId, wallet])

    const renderHeader = (): React.ReactNode => {
      return (
        <View style={styles.header}>
          <EdgeText style={styles.cardHeading}>{heading}</EdgeText>
          <PillButton
            label={walletPlaceholderText}
            onPress={onSelectWallet}
            icon={() => (
              <CryptoIcon
                pluginId={wallet.currencyInfo.pluginId}
                sizeRem={1}
                tokenId={tokenId}
              />
            )}
          />
        </View>
      )
    }

    const renderFooter = (): React.ReactNode => {
      return <View style={styles.footerSpace} />
    }

    return (
      <>
        <FlipInput2
          convertValue={convertValue}
          disabled={disabled}
          fieldInfos={fieldInfos}
          forceFieldNum={forceFieldMap[overrideForceField]}
          keyboardVisible={keyboardVisible}
          placeholders={placeholders}
          ref={flipInputRef}
          renderFooter={renderFooter}
          renderHeader={renderHeader}
          startAmounts={[initialDisplayAmount, initialFiatAmount]}
          // Events:
          onBlur={onBlur}
          onFocus={onFocus}
          onNext={onNext}
        />
      </>
    )
  }
)

export const SwapInput = React.memo(SwapInputComponent)

const getStyles = cacheStyles((theme: ReturnType<typeof useTheme>) => ({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: theme.rem(0.5),
    marginBottom: theme.rem(0.25)
  },
  cardHeading: {
    color: theme.secondaryText,
    margin: theme.rem(0.5)
  },
  // This space is used to give the FlipInput2 roughly 1 rem bottom padding to
  // match the top padding from the header.
  footerSpace: {
    height: theme.rem(0.5)
  }
}))
