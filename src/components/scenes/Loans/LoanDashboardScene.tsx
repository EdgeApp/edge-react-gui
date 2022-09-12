import * as React from 'react'
import { FlatList, TouchableOpacity } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { createWallet } from '../../../actions/CreateWalletActions'
import { LoanAccount } from '../../../controllers/loan-manager/types'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { borrowPlugins } from '../../../plugins/helpers/borrowPluginHelpers'
import { useState } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp } from '../../../types/routerTypes'
import { Theme } from '../../../types/Theme'
import { FlatListItem } from '../../../types/types'
import { getCurrencyIconUris } from '../../../util/CdnUris'
import { getCurrencyInfos, guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { Card } from '../../cards/Card'
import { LoanSummaryCard } from '../../cards/LoanSummaryCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { WalletListModal } from '../../modals/WalletListModal'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Airship, redText } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanDashboard'>
}
const HARD_WALLET_PLUGIN_ID = 'polygon'

export const LoanDashboardScene = (props: Props) => {
  const { navigation } = props

  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(0.5, 0), theme.rem))
  const styles = getStyles(theme)

  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const wallets = useWatch(account, 'currencyWallets')

  const iconUri = getCurrencyIconUris(
    HARD_WALLET_PLUGIN_ID,
    guessFromCurrencyCode(account, { currencyCode: 'AAVE', pluginId: HARD_WALLET_PLUGIN_ID }).tokenId
  ).symbolImage

  const isWalletsLoaded = sortedWalletList.every(walletListItem => walletListItem.wallet != null)

  const [isNewLoanLoading, setIsNewLoanLoading] = useState(false)

  // TODO: When new loan dApps are added, we will need a way to specify a way to select which dApp to add a new loan for.
  const hardPluginWalletIds = Object.keys(wallets).filter(walletId => wallets[walletId].currencyInfo.pluginId === HARD_WALLET_PLUGIN_ID)
  const handleAddLoan = useHandler(async () => {
    let newLoanWallet

    if (hardPluginWalletIds.length > 1) {
      // Only show the wallet picker if the user owns more than one polygon wallet.
      const { walletId: newWalletId } = await Airship.show(bridge => (
        <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedAssets={[{ pluginId: HARD_WALLET_PLUGIN_ID }]} />
      ))
      newLoanWallet = newWalletId != null ? wallets[newWalletId] : null
    } else if (hardPluginWalletIds.length === 1) {
      // If the user owns one polygon wallet, auto-select that wallet for the loan creation
      newLoanWallet = wallets[hardPluginWalletIds[0]]
    } else {
      // If the user owns no polygon wallets, auto-create one
      const hardCurrencyInfo = getCurrencyInfos(account).find(currencyInfo => currencyInfo.pluginId === HARD_WALLET_PLUGIN_ID)
      if (hardCurrencyInfo == null) throw new Error(`Could not auto-create ${HARD_WALLET_PLUGIN_ID} wallet`)
      newLoanWallet = await createWallet(account, { walletName: `AAVE ${hardCurrencyInfo.displayName}`, walletType: hardCurrencyInfo.walletType })
    }

    if (newLoanWallet != null) {
      // Initialize new loan with the wallet from any of the above sources
      setIsNewLoanLoading(true)
      const newLoanWalletPluginId = newLoanWallet.currencyInfo.pluginId
      const newBorrowPlugin = borrowPlugins.find(borrowPlugin => borrowPlugin.borrowInfo.currencyPluginId === newLoanWalletPluginId)
      if (newBorrowPlugin == null) throw new Error('Unable to find compatible borrow plugin for ' + newLoanWalletPluginId)
      newBorrowPlugin
        .makeBorrowEngine(newLoanWallet)
        .then(newBorrowEngine => {
          setIsNewLoanLoading(false)
          navigation.navigate('loanCreate', { borrowEngine: newBorrowEngine, borrowPlugin: newBorrowPlugin })
        })
        .catch(err => {
          redText(err.message)
        })
        .finally(() => setIsNewLoanLoading(false))
    }
  })

  const renderLoanCard = useHandler((item: FlatListItem<LoanAccount>) => {
    const loanAccount: LoanAccount = item.item

    const handleLoanPress = () => {
      navigation.navigate('loanDetails', { loanAccountId: loanAccount.id })
    }
    return (
      <LoanSummaryCard onPress={handleLoanPress} borrowEngine={loanAccount.borrowEngine} iconUri={iconUri} exchangeRates={exchangeRates} key={loanAccount.id} />
    )
  })

  const isCompatibleWalletsAvailable =
    hardPluginWalletIds.length === 0 ||
    hardPluginWalletIds.some(walletId => Object.keys(loanAccounts).find(loanAccountWalletId => loanAccountWalletId === walletId) == null)

  const footer = isNewLoanLoading ? (
    // Render a loading card in place of the "New Loan" button while initializing a new loan
    <Card marginRem={[0, 0.5, 0, 0.5, 0]}>
      <FillLoader />
    </Card>
  ) : isCompatibleWalletsAvailable ? ( // Don't show the "Add Loan" button if all the user's wallets have associated LoanAccounts.
    <TouchableOpacity onPress={handleAddLoan} style={styles.addButtonsContainer}>
      <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
      <EdgeText style={[styles.addItem, styles.addItemText]}>{s.strings.loan_new_loan}</EdgeText>
    </TouchableOpacity>
  ) : null

  if (!isWalletsLoaded) {
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
        data={Object.values(loanAccounts)}
        keyboardShouldPersistTaps="handled"
        renderItem={renderLoanCard}
        style={margin}
        ListFooterComponent={footer}
        keyExtractor={(loanAccount: LoanAccount) => loanAccount.id}
      />
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
