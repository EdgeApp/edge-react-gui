// @flow
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { useHandler } from '../../../hooks/useHandler'
import { useWatchAccount } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { makeAaveBorrowPlugin, makeAaveKovanBorrowPlugin } from '../../../plugins/borrow-plugins/plugins/aave/index'
import { type BorrowEngine } from '../../../plugins/borrow-plugins/types'
import { getAaveBorrowEngine, getAaveBorrowEngines } from '../../../plugins/helpers/getAaveBorrowPlugins'
import { useEffect, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp } from '../../../types/routerTypes'
import { type Theme } from '../../../types/Theme'
import { type FlatListItem } from '../../../types/types'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { TappableCard } from '../../cards/TappableCard'
import { FillLoader } from '../../common/FillLoader'
import { SceneWrapper } from '../../common/SceneWrapper'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanDashboard'>
}

export const LoanDashboardScene = (props: Props) => {
  const { navigation } = props
  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(0.5, 0), theme.rem))
  const styles = getStyles(theme)

  const walletId = '' // add
  const hardWalletPluginId = 'ethereum'
  const borrowAmount = '10,000'
  const collateralValue = '$ 15,000 USD'
  const interestRate = '12.4%'
  const fiatCurrencyCode = 'USD'

  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const account = useSelector(state => state.core.account)
  const wallets = useWatchAccount(account, 'currencyWallets')
  const iconUri = getCurrencyIconUris(
    hardWalletPluginId,
    guessFromCurrencyCode(account, { currencyCode: 'AAVE', pluginId: hardWalletPluginId }).tokenId
  ).symbolImage

  const isWalletsLoaded = sortedWalletList.every(walletListItem => walletListItem.wallet != null)
  const [isLoading, setIsLoading] = useState(true)
  const [borrowEngines, setBorrowEngines] = useState([])

  useEffect(() => {
    // Initialize borrow engines
    if (isWalletsLoaded && isLoading) {
      // const initBorrowEngines = []
      // const promises = Object.keys(wallets).map(async walletId => {
      //   const wallet = wallets[walletId]

      //   // Try to initialize an engine on either Kovan or mainnet
      //   initBorrowEngines.push(
      //     await getAaveBorrowEngine(makeAaveBorrowPlugin(), wallet).catch(
      //       async _err =>
      //         await getAaveBorrowEngine(makeAaveKovanBorrowPlugin(), wallet).catch(err =>
      //           console.log('\x1b[37m\x1b[41m' + `err: ${JSON.stringify(err, null, 2)}` + '\x1b[0m')
      //         )
      //     )
      //   )
      // })
      // promises.forEach(promise => Promise.resolve(promise))
      // setBorrowEngines(initBorrowEngines)
      // console.log('\x1b[30m\x1b[42m' + `borrowEngines: ${JSON.stringify(borrowEngines.length, null, 2)}` + '\x1b[0m')

      getAaveBorrowEngines([makeAaveKovanBorrowPlugin(), makeAaveBorrowPlugin()], account).then(borrowEngines => {
        console.log('\x1b[37m\x1b[44m' + `borrowEngines: ${JSON.stringify(borrowEngines, null, 2)}` + '\x1b[0m')
        setBorrowEngines(borrowEngines)
        setIsLoading(false)
      })
    }
  }, [account, borrowEngines, isLoading, isWalletsLoaded, wallets])

  const handleAddLoan = useHandler(() => {
    navigation.navigate('loanDetails')
  })

  const renderLoanCard = useHandler((item: FlatListItem<any>) => {
    const styles = getStyles(theme)
    const { currencyWallet: wallet, collaterals, debts } = item.item

    // const { borrowValue, collateralVlaue, fiatCurrencyCode, interestRate } = item.item
    const borrowValue = debts.map(debt=>{

    }

    return (
      <TappableCard
        onPress={() => {
          navigation.navigate('loanDashboard')
        }}
      >
        <View style={styles.cardContainer}>
          <View style={styles.row}>
            <FastImage style={styles.icon} source={{ uri: iconUri }} />
            <EdgeText style={styles.textMain}>{borrowValue}</EdgeText>
            <EdgeText>{fiatCurrencyCode}</EdgeText>
          </View>
          <View style={styles.spacedRow}>
            <View style={styles.column}>
              <EdgeText style={styles.textSecondary}>{s.strings.loan_collateral_value}</EdgeText>
              <EdgeText style={styles.textPrimary}>{collateralValue}</EdgeText>
            </View>
            <View style={styles.column}>
              <EdgeText style={styles.textSecondary}>{s.strings.loan_interest_rate}</EdgeText>
              <EdgeText style={styles.textPrimary}>{interestRate}</EdgeText>
            </View>
          </View>
        </View>
      </TappableCard>
    )
  })

  const footer = (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleAddLoan} style={styles.addButtonsContainer}>
        <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
        <EdgeText style={[styles.addItem, styles.addItemText]}>{s.strings.loan_dashboard_new_loan}</EdgeText>
      </TouchableOpacity>
    </View>
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

        <EdgeText style={styles.textHeader}>{s.strings.loan_dashboard_active_loans_title}</EdgeText>
        <FlatList data={borrowEngines} keyboardShouldPersistTaps="handled" renderItem={renderLoanCard} style={margin} ListFooterComponent={footer} />
      </SceneWrapper>
    )
}

const getStyles = cacheStyles((theme: Theme) => {
  // TODO:remove debug
  const border = { borderColor: 'white', borderWidth: 0 }

  return {
    // TODO: condense this section
    container: {
      alignItems: 'stretch',
      flex: 1,
      flexDirection: 'row'
    },
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
    /// ////////////////////////////
    addButton: {
      marginRight: theme.rem(0.5)
    },
    cardContainer: {
      flex: 1
    },
    column: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      ...border
    },
    icon: {
      alignSelf: 'center',
      height: theme.rem(2),
      width: theme.rem(2),
      ...border
    },
    row: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      ...border
    },
    spacedRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      marginTop: theme.rem(1.5),
      ...border
    },
    textHeader: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75),
      marginTop: theme.rem(0.5),
      marginLeft: theme.rem(1)
    },
    textMain: {
      fontFamily: theme.fontFaceMedium,
      fontSize: theme.rem(2),
      marginRight: theme.rem(0.5),
      marginLeft: theme.rem(0.5),
      ...border
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
