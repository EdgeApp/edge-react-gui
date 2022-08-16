// @flow
import * as React from 'react'
import { FlatList, TouchableOpacity } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { makeAaveMaticBorrowPlugin } from '../../../plugins/borrow-plugins/plugins/aave/index'
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
import { SceneWrapper } from '../../common/SceneWrapper'
import { WalletListModal } from '../../modals/WalletListModal'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { Airship, redText } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanDashboard'>
}

const borrowPlugins = [makeAaveMaticBorrowPlugin()]

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

  // Borrow Info & Auto-Refresh
  const [timeoutId, setTimeoutId] = useState()
  const [resetTrigger, setResetTrigger] = useState(false)
  const [borrowInfos, borrowInfosError] = useAsyncValue(async () => {
    const retVal = isWalletsLoaded
      ? await getAaveBorrowInfos(borrowPlugins, account).then(biRes => {
          return filterActiveBorrowInfos(biRes)
        })
      : null
    return retVal
  }, [account, isWalletsLoaded, resetTrigger])

  useEffect(() => {
    // Wait for the first load after scene mounting before starting the refresh timer
    if (borrowInfos == null && borrowInfosError == null) return

    // Clear previous timeout, setup a new one
    if (timeoutId != null) clearTimeout(timeoutId)
    setTimeoutId(
      setTimeout(() => {
        setResetTrigger(!resetTrigger)
      }, 10000)
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrowInfos, borrowInfosError])

  const [isNewLoanLoading, setIsNewLoanLoading] = useState(false)

  // TODO: When new loan dApps are added, we will need a way to specify a way to select which dApp to add a new loan for.
  const handleAddLoan = useHandler(() => {
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedAssets={[{ pluginId: 'polygon' }]} showCreateWallet />
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

        getAaveBorrowInfo(makeAaveMaticBorrowPlugin(), wallet)
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
