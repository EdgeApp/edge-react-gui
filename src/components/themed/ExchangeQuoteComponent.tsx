import { add, div } from 'biggystring'
import type { EdgeSwapQuote } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useCryptoText } from '../../hooks/useCryptoText'
import { formatFiatString, useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { lstrings } from '../../locales/strings'
import { convertCurrency } from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { DECIMAL_PRECISION, removeIsoPrefix } from '../../util/utils'
import { EdgeCard } from '../cards/EdgeCard'
import { CurrencyRow } from '../rows/CurrencyRow'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { FiatText } from '../text/FiatText'
import { EdgeText } from './EdgeText'

interface Props {
  fromTo: 'from' | 'to'
  quote: EdgeSwapQuote
  showFeeWarning?: boolean | null
}

export const ExchangeQuote: React.FC<Props> = props => {
  const { fromTo, quote, showFeeWarning } = props
  const { request, fromNativeAmount, toNativeAmount, networkFee } = quote
  const { fromWallet, fromTokenId, toWallet, toTokenId } = request

  const theme = useTheme()
  const styles = getStyles(theme)

  const isFrom = fromTo === 'from'
  const nativeAmount = isFrom ? fromNativeAmount : toNativeAmount

  // Fees are assumed to be denominated in the native currency
  const feeNativeAmount = networkFee.nativeAmount
  const feeTokenId = networkFee.tokenId
  const feeCryptoText = useCryptoText({
    wallet: fromWallet,
    nativeAmount: feeNativeAmount,
    tokenId: feeTokenId,
    withSymbol: false
  })
  const { denomination: feeDenomination, isoFiatCurrencyCode } =
    useTokenDisplayData({
      currencyConfig: fromWallet.currencyConfig,
      tokenId: feeTokenId
    })

  const { denomination: fromDenomination } = useTokenDisplayData({
    currencyConfig: fromWallet.currencyConfig,
    tokenId: fromTokenId
  })

  const feeFiatText = useFiatText({
    cryptoExchangeMultiplier: feeDenomination.multiplier,
    isoFiatCurrencyCode,
    nativeCryptoAmount: feeNativeAmount,
    pluginId: fromWallet.currencyInfo.pluginId,
    tokenId: feeTokenId,

    autoPrecision: true,
    hideFiatSymbol: true,
    subCentTruncation: true,
    displayZeroAsInteger: false
  })

  const feeFiatAmount = useSelector(state => {
    const cryptoAmount = div(
      feeNativeAmount,
      feeDenomination.multiplier,
      DECIMAL_PRECISION
    )
    return convertCurrency(
      state.exchangeRates,
      fromWallet.currencyInfo.pluginId,
      networkFee.tokenId,
      isoFiatCurrencyCode,
      cryptoAmount
    )
  })

  const fromFiatAmount = useSelector(state => {
    const cryptoAmount = div(
      fromNativeAmount,
      fromDenomination.multiplier,
      DECIMAL_PRECISION
    )
    return convertCurrency(
      state.exchangeRates,
      fromWallet.currencyInfo.pluginId,
      fromTokenId,
      isoFiatCurrencyCode,
      cryptoAmount
    )
  })

  const fiatCurrencyCode = removeIsoPrefix(isoFiatCurrencyCode)
  const totalFiatText = `${formatFiatString({
    fiatAmount: add(feeFiatAmount, fromFiatAmount)
  })} ${fiatCurrencyCode}`

  const minCryptoAmountText = useCryptoText({
    wallet: toWallet,
    tokenId: toTokenId,
    nativeAmount: quote.minReceiveAmount ?? '0',
    withSymbol: false
  })
  const minFiatAmountText = (
    <FiatText
      currencyConfig={toWallet.currencyConfig}
      tokenId={toTokenId}
      nativeCryptoAmount={quote.minReceiveAmount ?? '0'}
      hideFiatSymbol
      appendFiatCurrencyCode
    />
  )

  const renderRow = (
    label: React.ReactNode,
    value: React.ReactNode,
    style: any = {}
  ): React.ReactNode => {
    return (
      <View style={[styles.row, style]}>
        <View style={styles.label}>{label}</View>
        <View style={styles.value}>{value}</View>
      </View>
    )
  }

  const renderBottom = (): React.ReactNode => {
    if (fromTo === 'from') {
      const feeTextStyle =
        showFeeWarning === true ? styles.bottomWarningText : styles.bottomText

      return (
        <View style={styles.bottomContainer}>
          {renderRow(
            <EdgeText style={feeTextStyle}>{lstrings.mining_fee}</EdgeText>,
            <EdgeText
              style={feeTextStyle}
            >{`${feeCryptoText} (${feeFiatText} ${fiatCurrencyCode})`}</EdgeText>,
            {
              ...sidesToMargin(mapSides(fixSides([0.75, 0, 0], 0), theme.rem))
            }
          )}
          {renderRow(
            <EdgeText style={styles.bottomText}>
              {lstrings.string_total_amount}
            </EdgeText>,
            <EdgeText style={styles.bottomText}>{totalFiatText}</EdgeText>
          )}
        </View>
      )
    } else if (quote.minReceiveAmount != null) {
      // Show the minimum receive amount
      return (
        <View style={styles.bottomContainer}>
          {renderRow(
            <EdgeText style={styles.bottomText}>
              {lstrings.swap_minimum_receive_amount}
            </EdgeText>,
            <EdgeText style={styles.bottomText}>{minCryptoAmountText}</EdgeText>
          )}
          {renderRow(
            <></>,
            <EdgeText style={styles.bottomText}>({minFiatAmountText})</EdgeText>
          )}
        </View>
      )
    } else {
      return null
    }
  }

  return (
    <EdgeCard>
      <CurrencyRow
        wallet={isFrom ? fromWallet : toWallet}
        tokenId={isFrom ? fromTokenId : toTokenId}
        marginRem={0.5}
        nativeAmount={nativeAmount}
        hideBalance={false}
      />
      {renderBottom()}
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  value: {
    marginLeft: theme.rem(0.25),
    textAlign: 'right'
  },
  bottomContainer: {
    margin: theme.rem(0.5),
    marginTop: theme.rem(0)
  },
  bottomText: {
    marginTop: theme.rem(0.25),
    fontSize: theme.rem(0.75)
  },
  bottomWarningText: {
    fontSize: theme.rem(0.75),
    color: theme.warningText
  }
}))
