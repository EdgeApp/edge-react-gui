import { add, div } from 'biggystring'
import { EdgeSwapQuote } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useCryptoText } from '../../hooks/useCryptoText'
import { formatFiatString, useFiatText } from '../../hooks/useFiatText'
import { useTokenDisplayData } from '../../hooks/useTokenDisplayData'
import { lstrings } from '../../locales/strings'
import { convertCurrency } from '../../selectors/WalletSelectors'
import { useSelector } from '../../types/reactRedux'
import { getWalletTokenId } from '../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { DECIMAL_PRECISION, removeIsoPrefix } from '../../util/utils'
import { EdgeCard } from '../cards/EdgeCard'
import { CurrencyRow } from '../rows/CurrencyRow'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  fromTo: 'from' | 'to'
  quote: EdgeSwapQuote
  showFeeWarning?: boolean | null
}

export const ExchangeQuote = (props: Props) => {
  const { fromTo, quote, showFeeWarning } = props
  const { request, fromNativeAmount, toNativeAmount, networkFee } = quote
  const { fromWallet, fromTokenId, toWallet, toTokenId } = request

  const theme = useTheme()
  const styles = getStyles(theme)

  const isFrom = fromTo === 'from'
  const nativeAmount = isFrom ? fromNativeAmount : toNativeAmount

  // Fees are assumed to be denominated in the native currency
  const feeNativeAmount = networkFee.nativeAmount
  const feeTokenId = getWalletTokenId(fromWallet, networkFee.currencyCode)
  const feeCryptoText = useCryptoText({ wallet: fromWallet, nativeAmount: feeNativeAmount, tokenId: feeTokenId, withSymbol: false })
  const { denomination: feeDenomination, isoFiatCurrencyCode } = useTokenDisplayData({
    wallet: fromWallet,
    tokenId: feeTokenId
  })

  const { currencyCode: fromCurrencyCode, denomination: fromDenomination } = useTokenDisplayData({
    wallet: fromWallet,
    tokenId: fromTokenId
  })

  const feeFiatText = useFiatText({
    autoPrecision: true,
    cryptoCurrencyCode: networkFee.currencyCode,
    cryptoExchangeMultiplier: feeDenomination.multiplier,
    isoFiatCurrencyCode,
    nativeCryptoAmount: feeNativeAmount,
    hideFiatSymbol: true,
    subCentTruncation: true
  })

  const feeFiatAmount = useSelector(state => {
    const cryptoAmount = div(feeNativeAmount, feeDenomination.multiplier, DECIMAL_PRECISION)
    return convertCurrency(state, networkFee.currencyCode, isoFiatCurrencyCode, cryptoAmount)
  })

  const fromFiatAmount = useSelector(state => {
    const cryptoAmount = div(fromNativeAmount, fromDenomination.multiplier, DECIMAL_PRECISION)
    return convertCurrency(state, fromCurrencyCode, isoFiatCurrencyCode, cryptoAmount)
  })

  const fiatCurrencyCode = removeIsoPrefix(isoFiatCurrencyCode)
  const totalFiatText = `${formatFiatString({ fiatAmount: add(feeFiatAmount, fromFiatAmount) })} ${fiatCurrencyCode}`

  const renderRow = (label: React.ReactNode, value: React.ReactNode, style: any = {}) => {
    return (
      <View style={[styles.row, style]}>
        <View style={styles.label}>{label}</View>
        <View style={styles.value}>{value}</View>
      </View>
    )
  }

  const renderBottom = () => {
    if (fromTo === 'from') {
      const feeTextStyle = showFeeWarning ? styles.bottomWarningText : styles.bottomText

      return (
        <View style={styles.bottomContainer}>
          {renderRow(
            <EdgeText style={feeTextStyle}>{lstrings.mining_fee}</EdgeText>,
            <EdgeText style={feeTextStyle}>{`${feeCryptoText} (${feeFiatText} ${fiatCurrencyCode})`}</EdgeText>,
            {
              ...sidesToMargin(mapSides(fixSides([0.75, 0, 0], 0), theme.rem))
            }
          )}
          {renderRow(
            <EdgeText style={styles.bottomText}>{lstrings.string_total_amount}</EdgeText>,
            <EdgeText style={styles.bottomText}>{totalFiatText}</EdgeText>
          )}
        </View>
      )
    }
    return null
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
