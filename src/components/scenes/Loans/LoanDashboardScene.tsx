import { FlashList } from '@shopify/flash-list'
import { EdgeCurrencyInfo } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { createWallet } from '../../../actions/CreateWalletActions'
import { isShowLoanWelcomeModal } from '../../../actions/LoanWelcomeActions'
import { AAVE_SUPPORT_ARTICLE_URL_1S } from '../../../constants/aaveConstants'
import { resyncLoanAccounts } from '../../../controllers/loan-manager/redux/actions'
import { LoanAccount } from '../../../controllers/loan-manager/types'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { useUrlHandler } from '../../../hooks/useUrlHandler'
import { useWatch } from '../../../hooks/useWatch'
import { lstrings } from '../../../locales/strings'
import { borrowPlugins } from '../../../plugins/helpers/borrowPluginHelpers'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { Theme } from '../../../types/Theme'
import { FlatListItem } from '../../../types/types'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { getCurrencyInfos } from '../../../util/CurrencyInfoHelpers'
import { Card } from '../../cards/Card'
import { LoanSummaryCard } from '../../cards/LoanSummaryCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { Space } from '../../layout/Space'
import { LoanWelcomeModal } from '../../modals/LoanWelcomeModal'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Airship, redText } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

interface Props extends EdgeSceneProps<'loanDashboard'> {}

// First-element is the default wallet plugin used to create new wallet
const SUPPORTED_WALLET_PLUGIN_IDS = ['polygon']
if (__DEV__) SUPPORTED_WALLET_PLUGIN_IDS.push('ethereum')

export const LoanDashboardScene = (props: Props) => {
  const { navigation } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  //
  // State
  //

  const loanAccountsMap = useSelector(state => state.loanManager.loanAccounts)
  const syncRatio = useSelector(state => state.loanManager.syncRatio)
  const lastResyncTimestamp = useSelector(state => state.loanManager.lastResyncTimestamp)

  const isLoansLoading = syncRatio < 0

  const account = useSelector(state => state.core.account)
  const activeWalletIds = useWatch(account, 'activeWalletIds')
  const currencyWallets = useWatch(account, 'currencyWallets')

  const [isWalletsLoaded, setIsWalletsLoaded] = React.useState(false)
  useAsyncEffect(async () => {
    await account.waitForAllWallets()
    setIsWalletsLoaded(true)
  }, [account])

  const [isNewLoanLoading, setIsNewLoanLoading] = React.useState(false)

  // TODO: When new loan dApps are added, we will need a way to specify a way to select which dApp to add a new loan for.
  const hardPluginWalletIds = activeWalletIds.filter(walletId => SUPPORTED_WALLET_PLUGIN_IDS.includes(currencyWallets[walletId]?.currencyInfo.pluginId))

  //
  // Effects
  //

  useAsyncEffect(async () => {
    if (await isShowLoanWelcomeModal(account.disklet)) await Airship.show<'ok' | undefined>(bridge => <LoanWelcomeModal bridge={bridge} />)
  }, [])

  useAsyncEffect(async () => {
    // Only resync on scene mount every 5 minutes
    if (Date.now() - lastResyncTimestamp > 5 * 60 * 1000) {
      await dispatch(resyncLoanAccounts(account))
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
        <WalletListModal
          bridge={bridge}
          navigation={navigation}
          headerTitle={lstrings.select_wallet}
          allowedAssets={allowedAssets}
          excludeWalletIds={Object.keys(loanAccountsMap)}
        />
      ))
      newLoanWallet = newWalletId == null ? null : currencyWallets[newWalletId]
    } else if (hardPluginWalletIds.length === 1) {
      // If the user owns one polygon wallet, auto-select that wallet for the loan creation
      newLoanWallet = currencyWallets[hardPluginWalletIds[0]]
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
  const handleInfoIconPress = useUrlHandler(sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'loan-dashboard'))

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
        {isLoansLoading ? (
          <Space around={1}>
            <FillLoader />
          </Space>
        ) : (
          <TouchableOpacity onPress={handleAddLoan} style={styles.addButtonsContainer}>
            <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
            <EdgeText style={[styles.addItem, styles.addItemText]}>{lstrings.loan_new_loan}</EdgeText>
          </TouchableOpacity>
        )}
      </>
    )
  }

  if (!isWalletsLoaded) {
    return (
      <SceneWrapper background="theme" hasTabs={false}>
        <SceneHeader title={lstrings.loan_dashboard_title} underline />
        <FillLoader />
      </SceneWrapper>
    )
  }

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader
        tertiary={
          <TouchableOpacity onPress={handleInfoIconPress}>
            <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
          </TouchableOpacity>
        }
        title={lstrings.loan_dashboard_title}
        underline
        withTopMargin
      />
      <EdgeText style={styles.textSectionHeader}>{lstrings.loan_active_loans_title}</EdgeText>
      {Object.keys(loanAccountsMap).length === 0 ? (
        <>
          {isLoansLoading ? (
            <Space expand around horizontal={1} bottom={2.5}>
              <EdgeText style={styles.emptyText}>{lstrings.loan_loading_loans}</EdgeText>
            </Space>
          ) : (
            <>
              <Space expand around horizontal={1} top={1}>
                <EdgeText style={styles.emptyText} numberOfLines={4}>
                  {lstrings.loan_no_active_loans}
                </EdgeText>
              </Space>
              <Space around bottom={1}>
                {renderFooter()}
              </Space>
            </>
          )}
        </>
      ) : (
        <View style={styles.listMargin}>
          <FlashList
            data={Object.values(loanAccountsMap)}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(loanAccount: LoanAccount) => loanAccount.id}
            ListFooterComponent={renderFooter()}
            renderItem={renderLoanCard}
          />
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    addButtonsContainer: {
      alignItems: 'center',
      backgroundColor: theme.tileBackground,
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
    emptyText: {
      fontFamily: theme.fontFaceMedium,
      color: theme.secondaryText,
      textAlign: 'center'
    },
    listMargin: {
      margin: theme.rem(0.5),
      flex: 1
    },
    textSectionHeader: {
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75),
      marginLeft: theme.rem(1),
      marginTop: theme.rem(1)
    }
  }
})
