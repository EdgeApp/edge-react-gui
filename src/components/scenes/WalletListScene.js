// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../assets/vector/index.js'
import { CREATE_WALLET_SELECT_CRYPTO } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { getWalletListSlideTutorial, setUserTutorialList } from '../../util/tutorial.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { PasswordReminderModal } from '../modals/PasswordReminderModal.js'
import { WalletListSlidingTutorialModal } from '../modals/WalletListSlidingTutorialModal.js'
import { WalletListSortModal } from '../modals/WalletListSortModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { PromoCard } from '../themed/PromoCard.js'
import { SceneHeader } from '../themed/SceneHeader.js'
import { WalletList } from '../themed/WalletList.js'
import { WalletListFooter } from '../themed/WalletListFooter.js'
import { WalletListHeader } from '../themed/WalletListHeader.js'
import { WalletListSortable } from '../themed/WalletListSortable.js'
import { WiredBalanceBox } from '../themed/WiredBalanceBox.js'
import { WiredProgressBar } from '../themed/WiredProgressBar.js'
type Props = {}

export function WalletListScene(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const [sorting, setSorting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [showSlidingTutorial, setShowTutorial] = useState(false)

  const account = useSelector(state => state.core.account)
  const disklet = useSelector(state => state.core.disklet)
  const needsPasswordCheck = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)

  // Subscribe to account state:
  const [currencyWallets, setCurrencyWallets] = useState(account.currencyWallets)
  useEffect(() => account.watch('currencyWallets', setCurrencyWallets), [account])
  const loading = Object.keys(currencyWallets).length <= 0

  async function handleTutorialModal() {
    const userTutorialList = await getWalletListSlideTutorial(disklet)
    const tutorialCount = userTutorialList.walletListSlideTutorialCount || 0

    if (tutorialCount < 2) {
      Airship.show(bridge => <WalletListSlidingTutorialModal bridge={bridge} />)
      setShowTutorial(true)
      userTutorialList.walletListSlideTutorialCount = tutorialCount + 1
      await setUserTutorialList(userTutorialList, disklet)
    }
  }

  function handleSort(): void {
    Airship.show(bridge => <WalletListSortModal bridge={bridge} />)
      .then(sort => {
        if (sort === 'manual') setSorting(true)
      })
      .catch(showError)
  }

  // Show the tutorial or password reminder on mount:
  useEffect(
    () => {
      if (needsPasswordCheck) Airship.show(bridge => <PasswordReminderModal bridge={bridge} />)
      else handleTutorialModal().catch(showError)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const header = !sorting && !searching && (
    <View style={styles.headerContainer}>
      <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
      <View key="defaultButtons" style={styles.headerButtonsContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => Actions.push(CREATE_WALLET_SELECT_CRYPTO)}>
          <Ionicon name="md-add" size={theme.rem(1.5)} color={theme.iconTappable} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSort}>
          <Fontello name="sort" size={theme.rem(1.5)} color={theme.iconTappable} />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SceneWrapper>
      <SceneHeader underline>
        <WiredProgressBar />
        <View style={styles.balance}>
          {sorting && (
            <View style={styles.headerContainer}>
              <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
              <TouchableOpacity key="doneButton" style={styles.headerButtonsContainer} onPress={() => setSorting(false)}>
                <EdgeText style={styles.doneButton}>{s.strings.string_done_cap}</EdgeText>
              </TouchableOpacity>
            </View>
          )}

          {searching && (
            <WalletListHeader searching={searching} searchText={searchText} onChangeSearchText={setSearchText} onChangeSearchingState={setSearching} />
          )}
          {!searching && !sorting && <WiredBalanceBox />}
        </View>
      </SceneHeader>

      <View style={styles.listStack}>
        <CrossFade activeKey={loading ? 'spinner' : sorting ? 'sortList' : 'fullList'}>
          <ActivityIndicator key="spinner" color={theme.primaryText} style={styles.listSpinner} size="large" />
          <WalletList
            key="fullList"
            header={header}
            footer={searching ? null : <WalletListFooter />}
            searching={searching}
            searchText={searchText}
            activateSearch={() => setSearching(true)}
            showSlidingTutorial={showSlidingTutorial}
          />
          <WalletListSortable key="sortList" />
        </CrossFade>
      </View>

      {!searching && <PromoCard />}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  balance: {
    marginTop: theme.rem(1)
  },
  // The sort & add buttons are stacked on top of the header component:
  // Header Stack style
  headerContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.rem(1)
  },
  headerText: {
    flex: 1
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneButton: {
    color: theme.textLink
  },
  addButton: {
    marginRight: theme.rem(0.5)
  },
  // The two lists are stacked vertically on top of each other:
  listStack: {
    flexGrow: 1
  },
  listSpinner: {
    flexGrow: 1,
    alignSelf: 'center'
  }
}))
