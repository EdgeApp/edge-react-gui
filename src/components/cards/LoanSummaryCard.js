// @flow
import { add, div, mul } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { formatFiatString } from '../../hooks/useFiatText'
import { toPercentString } from '../../locales/intl'
import s from '../../locales/strings'
import { type BorrowEngine } from '../../plugins/borrow-plugins/types'
import { memo } from '../../types/reactHooks.js'
import { type Theme } from '../../types/Theme'
import { type GuiExchangeRates } from '../../types/types'
import { DECIMAL_PRECISION, zeroString } from '../../util/utils'
import { showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { EdgeText } from '../themed/EdgeText'
import { TappableCard } from './TappableCard'

const LoanSummaryCardComponent = ({
  borrowEngine,
  iconUri,
  exchangeRates,
  onPress
}: {
  borrowEngine: BorrowEngine,
  iconUri: string,
  exchangeRates: GuiExchangeRates,
  onPress: () => void
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  try {
    const { currencyWallet, collaterals, debts } = borrowEngine
    const isoFiatCurrencyCode = currencyWallet.fiatCurrencyCode
    const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
    const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)

    const collateralTotal = collaterals.reduce((accumulator, collateral) => {
      return add(accumulator, calculateFiatValue(currencyWallet, collateral.tokenId, isoFiatCurrencyCode, collateral.nativeAmount, exchangeRates) ?? '0')
    }, '0')

    const displayCollateralTotal = `${fiatSymbol}${formatFiatString({ autoPrecision: true, fiatAmount: collateralTotal, noGrouping: true })}`

    const displayBorrowTotal = formatFiatString({
      autoPrecision: true,
      fiatAmount: debts.reduce((accumulator, debt) => {
        return add(accumulator, calculateFiatValue(currencyWallet, debt.tokenId, isoFiatCurrencyCode, debt.nativeAmount, exchangeRates) ?? '0')
      }, '0'),
      noGrouping: true
    })

    // TODO: Calculate amount-adjusted cumulative interest for multiple debt asset currencies and amounts.
    const displayInterestTotal = toPercentString(debts[0].apr)

    return (
      <TappableCard marginRem={0.5} onPress={onPress}>
        <View style={styles.cardContainer}>
          <View style={styles.row}>
            <FastImage style={styles.icon} source={{ uri: iconUri }} />
            <EdgeText style={styles.textMain}>{displayBorrowTotal}</EdgeText>
            <EdgeText>{fiatCurrencyCode}</EdgeText>
          </View>
          <View style={styles.spacedRow}>
            <View style={styles.column}>
              <EdgeText style={styles.textSecondary}>{s.strings.loan_collateral_value}</EdgeText>
              <EdgeText style={styles.textPrimary}>{displayCollateralTotal}</EdgeText>
            </View>
            <View style={styles.column}>
              <EdgeText style={styles.textSecondary}>{s.strings.loan_interest_rate}</EdgeText>
              <EdgeText style={styles.textPrimary}>{displayInterestTotal}</EdgeText>
            </View>
          </View>
        </View>
      </TappableCard>
    )
  } catch (err) {
    showError(err.message)

    // Render a failed card
    return <Alert marginRem={[0.5, 0.5, 0.5, 0.5]} title={s.strings.send_scene_error_title} message={s.strings.loan_dashboard_failed_loan} type="error" />
  }
}

export const getToken = (wallet: EdgeCurrencyWallet, tokenIdStr: string) => {
  const allTokens = wallet.currencyConfig.allTokens
  if (!Object.keys(allTokens).find(tokenKey => tokenKey === tokenIdStr)) {
    showError(`Could not find tokenId ${tokenIdStr ?? '[undefined]'}`)
  } else {
    return allTokens[tokenIdStr]
  }
}

// TODO: Integrate Matt or Eliran's future hack-a--roni implementation to calculate exchange totals.
export const calculateFiatValue = (
  wallet: EdgeCurrencyWallet,
  tokenIdStr?: string,
  isoFiatCurrencyCode: string,
  nativeAmount: string,
  exchangeRates: GuiExchangeRates
) => {
  if (tokenIdStr == null) return '0'
  const token = getToken(wallet, tokenIdStr)
  if (token == null) return '0'
  const { currencyCode, denominations } = token
  const [denomination] = denominations
  const cryptoAmount = div(nativeAmount, denomination.multiplier, DECIMAL_PRECISION)
  const key = `${isoFiatCurrencyCode}_${currencyCode}`
  const assetFiatPrice = Object.keys(exchangeRates).some(erKey => erKey === key) ? exchangeRates[key] : '0'

  if (zeroString(assetFiatPrice)) showError(`No exchange rate for ${key}`)
  return mul(cryptoAmount, assetFiatPrice)
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    cardContainer: {
      flex: 1,
      margin: theme.rem(0.5)
    },
    column: {
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    icon: {
      alignSelf: 'center',
      height: theme.rem(2),
      width: theme.rem(2)
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row'
    },
    spacedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginTop: theme.rem(1.5)
    },
    textMain: {
      fontFamily: theme.fontFaceMedium,
      fontSize: theme.rem(2),
      marginRight: theme.rem(0.5),
      marginLeft: theme.rem(0.5)
    },
    textPrimary: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75)
    },
    textSecondary: {
      fontSize: theme.rem(0.75)
    }
  }
})

export const LoanSummaryCard = memo(LoanSummaryCardComponent)
