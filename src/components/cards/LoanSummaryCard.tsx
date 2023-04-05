import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { formatFiatString } from '../../hooks/useFiatText'
import { useWatch } from '../../hooks/useWatch'
import { toPercentString } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { BorrowEngine } from '../../plugins/borrow-plugins/types'
import { useSelector } from '../../types/reactRedux'
import { Theme } from '../../types/Theme'
import { Peek } from '../layout/Peek'
import { Space } from '../layout/Space'
import { Shimmer } from '../progress-indicators/Shimmer'
import { useFiatTotal } from '../scenes/Loans/LoanDetailsScene'
import { showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { Alert } from '../themed/Alert'
import { EdgeText } from '../themed/EdgeText'
import { TappableCard } from './TappableCard'

const LoanSummaryCardComponent = ({ borrowEngine, iconUri, onPress }: { borrowEngine: BorrowEngine; iconUri: string; onPress: (() => void) | undefined }) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { currencyWallet } = borrowEngine
  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')
  const syncRatio = useWatch(borrowEngine, 'syncRatio')
  const isLoading = syncRatio < 1

  const isoFiatCurrencyCode = currencyWallet.fiatCurrencyCode
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')
  const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)

  const collateralTotal = useFiatTotal(currencyWallet, collaterals)
  const displayCollateralTotal = `${fiatSymbol}${formatFiatString({ autoPrecision: true, fiatAmount: collateralTotal })}`

  const borrowTotal = useFiatTotal(
    currencyWallet,
    debts.map(debt => ({ tokenId: debt.tokenId, nativeAmount: debt.nativeAmount }))
  )
  const displayBorrowTotal = formatFiatString({
    autoPrecision: true,
    fiatAmount: borrowTotal
  })

  const isDevMode = useSelector(state => state.ui.settings.developerModeOn)

  try {
    // TODO: Calculate amount-adjusted cumulative interest
    const displayInterestTotal = toPercentString(debts.length === 0 ? '0' : debts[0].apr)

    return (
      <Space around={0.5}>
        <Shimmer isShown={isLoading} />
        <Peek isShown={!isLoading}>
          <TappableCard onPress={onPress}>
            <View style={styles.cardContainer}>
              {isDevMode ? <EdgeText>{`${currencyWallet.name}`}</EdgeText> : null}
              <View style={styles.row}>
                <FastImage style={styles.icon} source={{ uri: iconUri }} />
                <EdgeText style={styles.textMain}>{displayBorrowTotal}</EdgeText>
                <EdgeText>{fiatCurrencyCode}</EdgeText>
              </View>
              <View style={styles.spacedRow}>
                <View style={styles.column}>
                  <EdgeText style={styles.textSecondary}>{lstrings.loan_collateral_value}</EdgeText>
                  <EdgeText style={styles.textPrimary}>{displayCollateralTotal}</EdgeText>
                </View>
                <View style={styles.column}>
                  <EdgeText style={styles.textSecondary}>{lstrings.loan_interest_rate}</EdgeText>
                  <EdgeText style={styles.textPrimary}>{displayInterestTotal}</EdgeText>
                </View>
              </View>
            </View>
          </TappableCard>
        </Peek>
      </Space>
    )
  } catch (err: any) {
    showError(err.message)

    // Render a failed card
    return <Alert marginRem={[0.5, 0.5, 0.5, 0.5]} title={lstrings.send_scene_error_title} message={lstrings.loan_failed_loan} type="error" />
  }
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    cardContainer: {
      flex: 1
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
      fontSize: theme.rem(0.75),
      marginRight: theme.rem(1)
    }
  }
})

export const LoanSummaryCard = React.memo(LoanSummaryCardComponent)
