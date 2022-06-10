// @flow
import { add, div, mul } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { getSymbolFromCurrency } from '../../../constants/WalletAndCurrencyConstants'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useHandler } from '../../../hooks/useHandler'
import { useWatchAccount } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { makeAaveBorrowPlugin, makeAaveKovanBorrowPlugin } from '../../../plugins/borrow-plugins/plugins/aave/index'
import { filterActiveBorrowEngines, getAaveBorrowEngines } from '../../../plugins/helpers/getAaveBorrowPlugins'
import { useEffect, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { type Theme } from '../../../types/Theme'
import { type FlatListItem } from '../../../types/types'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { DECIMAL_PRECISION, truncateDecimals, zeroString } from '../../../util/utils'
import { TappableCard } from '../../cards/TappableCard'
import { FillLoader } from '../../common/FillLoader'
import { SceneWrapper } from '../../common/SceneWrapper'
import { WalletListModal } from '../../modals/WalletListModal'
import { Airship, showError } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

export const LoanDashboardScene = () => {
  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(0.5, 0), theme.rem))
  const styles = getStyles(theme)

  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const wallets = useWatchAccount(account, 'currencyWallets')

  const hardWalletPluginId = 'ethereum'
  const iconUri = getCurrencyIconUris(
    hardWalletPluginId,
    guessFromCurrencyCode(account, { currencyCode: 'AAVE', pluginId: hardWalletPluginId }).tokenId
  ).symbolImage

  const isWalletsLoaded = sortedWalletList.every(walletListItem => walletListItem.wallet != null)
  const [isLoading, setIsLoading] = useState(true)
  const [borrowEngines, setBorrowEngines] = useState([])

  useEffect(() => {
    // Initialize AAVE ETH and ETH Kovan borrow engines
    if (isWalletsLoaded && isLoading) {
      getAaveBorrowEngines([makeAaveKovanBorrowPlugin(), makeAaveBorrowPlugin()], account)
        .then(filterActiveBorrowEngines)
        .then(borrowEngines => {
          setBorrowEngines(borrowEngines)
          setIsLoading(false)
        })
    }
  }, [account, borrowEngines, isLoading, isWalletsLoaded, wallets])

  const handleAddLoan = useHandler(() => {
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
        allowedAssets={[{ pluginId: hardWalletPluginId }, { pluginId: 'kovan' }]}
        showCreateWallet
      />
    )).then(({ walletId }) => {
      if (walletId != null) {
        getAaveBorrowEngines([makeAaveKovanBorrowPlugin(), makeAaveBorrowPlugin()], account).then(borrowEngines => {
          if (borrowEngines.length > 0) {
            // TODO: After LoanDetailsScene implementation
            // navigation.navigate('loanDetails', borrowEngines[0])
          } else {
            showError('Failed to initialize borrow engine')
          }
        })
      }
    })
  })

  const renderLoanCard = useHandler((item: FlatListItem<any>) => {
    const { currencyWallet: wallet, collaterals, debts } = item.item
    const isoFiatCurrencyCode = wallet.fiatCurrencyCode
    const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')

    try {
      const styles = getStyles(theme)
      const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)

      // Calculate fiat totals
      const collateralTotal = collaterals.reduce((accumulator, collateral) => {
        return add(accumulator, calculateFiatValue(wallet, collateral.tokenId, isoFiatCurrencyCode, collateral.nativeAmount) ?? '0')
      }, '0')
      const displayCollateralTotal = `${fiatSymbol}${formatFiatString({ autoPrecision: true, fiatAmount: collateralTotal, noGrouping: true })}`
      const displayBorrowTotal = formatFiatString({
        autoPrecision: true,
        fiatAmount: debts.reduce((accumulator, debt) => {
          return add(accumulator, calculateFiatValue(wallet, debt.tokenId, isoFiatCurrencyCode, debt.nativeAmount))
        }, '0'),
        noGrouping: true
      })

      // TODO: Calculate amount-adjusted cumulative interest
      const displayInterestTotal = `${truncateDecimals((debts[0].apr * 100).toString(), 1)}%`

      return (
        <TappableCard
          onPress={() => {
            // TODO: After LoanDetailsScene implementation
            // navigation.navigate('loanDashboard', item.item)
          }}
        >
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
      return null
    }
  })

  const getToken = (wallet: EdgeCurrencyWallet, tokenIdStr: string) => {
    const allTokens = wallet.currencyConfig.allTokens
    if (!Object.keys(allTokens).find(tokenKey => tokenKey === tokenIdStr)) {
      showError(`Could not find tokenId ${tokenIdStr}`)
    } else {
      return allTokens[tokenIdStr]
    }
  }

  const calculateFiatValue = (wallet: EdgeCurrencyWallet, tokenIdStr: string, isoFiatCurrencyCode: string, nativeAmount: string) => {
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

  const footer = (
    <TouchableOpacity onPress={handleAddLoan} style={styles.addButtonsContainer}>
      <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
      <EdgeText style={[styles.addItem, styles.addItemText]}>{s.strings.loan_dashboard_new_loan}</EdgeText>
    </TouchableOpacity>
  )

  if (isLoading)
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SceneHeader underline title={s.strings.loan_dashboard_title} />
        <FillLoader />
      </SceneWrapper>
    )
  else
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SceneHeader underline title={s.strings.loan_dashboard_title} />
        <EdgeText style={styles.textSectionHeader}>{s.strings.loan_dashboard_active_loans_title}</EdgeText>
        <FlatList data={borrowEngines} keyboardShouldPersistTaps="handled" renderItem={renderLoanCard} style={margin} ListFooterComponent={footer} />
      </SceneWrapper>
    )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    addButtonsContainer: {
      alignItems: 'center',
      backgroundColor: theme.tileBackground,
      flex: 1,
      flexDirection: 'row',
      height: theme.rem(3.25),
      justifyContent: 'center'
    },
    addItem: {
      color: theme.textLink,
      fontFamily: theme.addButtonFont,
      margin: theme.rem(0.25)
    },
    addItemText: {
      flexShrink: 1
    },
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
    textSectionHeader: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75),
      marginTop: theme.rem(0.5),
      marginLeft: theme.rem(1)
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
