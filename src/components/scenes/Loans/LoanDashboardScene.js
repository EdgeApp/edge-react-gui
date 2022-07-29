// @flow
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, TouchableOpacity } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { makeAaveBorrowPlugin, makeAaveKovanBorrowPlugin } from '../../../plugins/borrow-plugins/plugins/aave/index'
import { type TempBorrowInfo, filterActiveBorrowInfos, getAaveBorrowInfo, getAaveBorrowInfos } from '../../../plugins/helpers/getAaveBorrowPlugins'
import { useEffect, useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp } from '../../../types/routerTypes'
import { type Theme } from '../../../types/Theme'
import { type FlatListItem } from '../../../types/types'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { translateError } from '../../../util/translateError'
import { Card } from '../../cards/Card'
import { LoanSummaryCard } from '../../cards/LoanSummaryCard'
import { FillLoader } from '../../common/FillLoader'
import { SceneWrapper } from '../../common/SceneWrapper'
import { WalletListModal } from '../../modals/WalletListModal'
import { Airship, redText, showError } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanDashboard'>
}

const borrowPlugins = [makeAaveKovanBorrowPlugin(), makeAaveBorrowPlugin()]

export const LoanDashboardScene = (props: Props) => {
  const { navigation } = props

  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(0.5, 0), theme.rem))
  const styles = getStyles(theme)

  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const wallets = useWatch(account, 'currencyWallets')

  const hardWalletPluginId = 'ethereum'
  const iconUri = getCurrencyIconUris(
    hardWalletPluginId,
    guessFromCurrencyCode(account, { currencyCode: 'AAVE', pluginId: hardWalletPluginId }).tokenId
  ).symbolImage

  const isWalletsLoaded = sortedWalletList.every(walletListItem => walletListItem.wallet != null)

  // Borrow Info
  const [refreshCount, setRefreshCount] = useState(0)
  const [borrowInfos, borrowInfosError] = useAsyncValue(async () => {
    return isWalletsLoaded ? await getAaveBorrowInfos(borrowPlugins, account).then(filterActiveBorrowInfos) : null
  }, [account, isWalletsLoaded, refreshCount])
  useEffect(() => {
    setTimeout(() => setRefreshCount(count => ++count), 10000)
  }, [borrowInfos, borrowInfosError])

  const [isNewLoanLoading, setIsNewLoanLoading] = useState(false)

  // TODO: When new loan dApps are added, we will need a way to specify a way to select which dApp to add a new loan for.
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
        const wallet = wallets[walletId]

        if (borrowInfos != null) {
          const existingBorrowInfo = borrowInfos.find(borrowInfo => borrowInfo.borrowEngine.currencyWallet.id === walletId)
          if (existingBorrowInfo != null) {
            navigation.navigate('loanDetails', { borrowEngine: existingBorrowInfo.borrowEngine, borrowPlugin: existingBorrowInfo.borrowPlugin })
            return
          }
        }

        setIsNewLoanLoading(true)

        getAaveBorrowInfo(wallet.currencyInfo.pluginId === hardWalletPluginId ? makeAaveBorrowPlugin() : makeAaveKovanBorrowPlugin(), wallet)
          .then((borrowInfo: TempBorrowInfo) => {
            setIsNewLoanLoading(false)
            navigation.navigate('loanCreate', { borrowEngine: borrowInfo.borrowEngine, borrowPlugin: borrowInfo.borrowPlugin })
          })
          .catch(err => {
            redText(err.message)
          })
          .finally(() => setIsNewLoanLoading(false))
      }
    })
  })

  const renderLoanCard = useHandler((item: FlatListItem<TempBorrowInfo>) => {
    const borrowInfo: TempBorrowInfo = item.item
    const handleLoanPress = () => {
      navigation.navigate('loanDetails', { borrowEngine: borrowInfo.borrowEngine, borrowPlugin: borrowInfo.borrowPlugin })
    }
    return <LoanSummaryCard onPress={handleLoanPress} borrowEngine={borrowInfo.borrowEngine} iconUri={iconUri} exchangeRates={exchangeRates} />
  })

  const footer = isNewLoanLoading ? (
    // Render a loading card in place of the "New Loan" button while initializing a new loan
    <Card marginRem={[0, 0.5, 0, 0.5, 0]}>
      <FillLoader />
    </Card>
  ) : (
    <TouchableOpacity onPress={handleAddLoan} style={styles.addButtonsContainer}>
      <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
      <EdgeText style={[styles.addItem, styles.addItemText]}>{s.strings.loan_new_loan}</EdgeText>
    </TouchableOpacity>
  )

  if (borrowInfosError != null)
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SceneHeader underline title={s.strings.loan_dashboard_title} />
        <Alert title={s.strings.loan_error_title} type="error" message={translateError(borrowInfosError)} />
      </SceneWrapper>
    )

  if (borrowInfos == null) {
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SceneHeader underline title={s.strings.loan_dashboard_title} />
        <FillLoader />
      </SceneWrapper>
    )
  }

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader underline title={s.strings.loan_dashboard_title} />
      <EdgeText style={styles.textSectionHeader}>{s.strings.loan_active_loans_title}</EdgeText>
      <FlatList
        data={borrowInfos}
        keyboardShouldPersistTaps="handled"
        renderItem={renderLoanCard}
        style={margin}
        ListFooterComponent={footer}
        keyExtractor={(borrowInfo: TempBorrowInfo) => borrowInfo.borrowEngine.currencyWallet.id ?? '0'}
      />
    </SceneWrapper>
  )
}

export const getToken = (wallet: EdgeCurrencyWallet, tokenIdStr: string) => {
  const allTokens = wallet.currencyConfig.allTokens
  if (!Object.keys(allTokens).find(tokenKey => tokenKey === tokenIdStr)) {
    showError(`Could not find tokenId ${tokenIdStr}`)
  } else {
    return allTokens[tokenIdStr]
  }
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
    cardEmptyContainer: {
      marginLeft: theme.rem(1),
      marginRight: theme.rem(1)
    },
    textSectionHeader: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75),
      marginTop: theme.rem(0.5),
      marginLeft: theme.rem(1)
    }
  }
})
