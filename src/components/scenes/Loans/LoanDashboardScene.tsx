import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { FlatList, TouchableOpacity } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { createWallet } from '../../../actions/CreateWalletActions'
import { resyncLoanAccounts } from '../../../controllers/loan-manager/redux/actions'
import { LoanAccount } from '../../../controllers/loan-manager/types'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { borrowPlugins } from '../../../plugins/helpers/borrowPluginHelpers'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp } from '../../../types/routerTypes'
import { Theme } from '../../../types/Theme'
import { FlatListItem } from '../../../types/types'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { getCurrencyInfos } from '../../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { Card } from '../../cards/Card'
import { LoanSummaryCard } from '../../cards/LoanSummaryCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { Space } from '../../layout/Space'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Airship, redText } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanDashboard'>
}

// First-element is the default wallet plugin used to create new wallet
const SUPPORTED_WALLET_PLUGIN_IDS = ['ethereum', 'polygon']

export const LoanDashboardScene = (props: Props) => {
  const { navigation } = props

  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(0.5, 0), theme.rem))
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  //
  // State
  //

  const sortedWalletList = useSelector(state => state.sortedWalletList)
  const account = useSelector(state => state.core.account)
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)
  const syncRatio = useSelector(state => state.loanManager.syncRatio)
  const lastResyncTimestamp = useSelector(state => state.loanManager.lastResyncTimestamp)

  const wallets = useWatch(account, 'currencyWallets')
  const isWalletsLoaded = sortedWalletList.every(walletListItem => walletListItem.wallet != null)

  const [isNewLoanLoading, setIsNewLoanLoading] = React.useState(false)

  // TODO: When new loan dApps are added, we will need a way to specify a way to select which dApp to add a new loan for.
  const hardPluginWalletIds = Object.keys(wallets).filter(walletId => SUPPORTED_WALLET_PLUGIN_IDS.includes(wallets[walletId].currencyInfo.pluginId))

  //
  // Effects
  //

  React.useEffect(() => {
    // Only resync on scene mount every 5 minutes
    if (Date.now() - lastResyncTimestamp > 5 * 60 * 1000) {
      dispatch(resyncLoanAccounts(account))
    }
  }, [account, dispatch, lastResyncTimestamp])

  //
  // Handlers
  //

  const handleAddLoan = useHandler(async () => {
    let newLoanWallet

    if (hardPluginWalletIds.length > 1) {
      const allowedAssets = SUPPORTED_WALLET_PLUGIN_IDS.map(pluginId => ({ pluginId }))

      // Only show the wallet picker if the user owns more than one polygon wallet.
      const { walletId: newWalletId } = await Airship.show<WalletListResult>(bridge => (
        <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedAssets={allowedAssets} />
      ))
      newLoanWallet = newWalletId != null ? wallets[newWalletId] : null
    } else if (hardPluginWalletIds.length === 1) {
      // If the user owns one polygon wallet, auto-select that wallet for the loan creation
      newLoanWallet = wallets[hardPluginWalletIds[0]]
    } else {
      // If the user owns no polygon wallets, auto-create one
      const filteredCurrencyInfo = SUPPORTED_WALLET_PLUGIN_IDS.reduce((info: EdgeCurrencyInfo | undefined, pluginId) => {
        if (info != null) return info // Already found
        return getCurrencyInfos(account).find(currencyInfo => pluginId === currencyInfo.pluginId)
      }, undefined)
      if (filteredCurrencyInfo == null) throw new Error(`Could not auto-create wallet of the supported types: ${SUPPORTED_WALLET_PLUGIN_IDS.join(', ')}`)
      newLoanWallet = await createWallet(account, { walletName: `AAVE Loan Account`, walletType: filteredCurrencyInfo.walletType })
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

  //
  // Render
  //

  const renderLoanCard = useHandler((item: FlatListItem<LoanAccount>) => {
    const loanAccount: LoanAccount = item.item
    const iconUri = getBorrowPluginIconUri(loanAccount.borrowPlugin.borrowInfo)

    const handleLoanPress = () => {
      navigation.navigate('loanDetails', { loanAccountId: loanAccount.id })
    }
    return <LoanSummaryCard onPress={handleLoanPress} borrowEngine={loanAccount.borrowEngine} iconUri={iconUri} key={loanAccount.id} />
  })

  const renderFooter = () => {
    return (
      <>
        {isNewLoanLoading ? (
          <Card marginRem={[0, 0.5, 0, 0.5, 0]}>
            <FillLoader />
          </Card>
        ) : null}
        {syncRatio < 1 ? (
          <Space around>
            <FillLoader />
          </Space>
        ) : null}
        <TouchableOpacity onPress={handleAddLoan} style={styles.addButtonsContainer}>
          <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
          <EdgeText style={[styles.addItem, styles.addItemText]}>{s.strings.loan_new_loan}</EdgeText>
        </TouchableOpacity>
      </>
    )
  }

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
        ListFooterComponent={renderFooter()}
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
