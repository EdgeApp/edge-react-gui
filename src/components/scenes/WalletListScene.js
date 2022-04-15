// @flow

import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'

import s from '../../locales/strings.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getWalletListSlideTutorial, setUserTutorialList } from '../../util/tutorial.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { PasswordReminderModal } from '../modals/PasswordReminderModal.js'
import { WalletListSlidingTutorialModal } from '../modals/WalletListSlidingTutorialModal.js'
import { WalletListSortModal } from '../modals/WalletListSortModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { WalletList } from '../themed/WalletList.js'
import { WalletListFooter } from '../themed/WalletListFooter.js'
import { WalletListHeader } from '../themed/WalletListHeader.js'
import { WalletListSortable } from '../themed/WalletListSortable.js'
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

  return (
    <SceneWrapper>
      <WiredProgressBar />
      {sorting && (
        <View style={styles.headerContainer}>
          <EdgeText style={styles.headerText}>{s.strings.title_wallets}</EdgeText>
          <TouchableOpacity key="doneButton" style={styles.headerButtonsContainer} onPress={() => setSorting(false)}>
            <EdgeText style={styles.doneButton}>{s.strings.string_done_cap}</EdgeText>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.listStack}>
        <CrossFade activeKey={loading ? 'spinner' : sorting ? 'sortList' : 'fullList'}>
          <ActivityIndicator key="spinner" color={theme.primaryText} style={styles.listSpinner} size="large" />
          <WalletList
            key="fullList"
            header={
              <WalletListHeader
                sorting={sorting}
                searching={searching}
                searchText={searchText}
                openSortModal={handleSort}
                onChangeSearchText={setSearchText}
                onChangeSearchingState={setSearching}
                testId="WalletListScene.SortModal"
              />
            }
            footer={searching ? null : <WalletListFooter />}
            searching={searching}
            searchText={searchText}
            activateSearch={() => setSearching(true)}
            showSlidingTutorial={showSlidingTutorial}
          />
          <WalletListSortable key="sortList" />
        </CrossFade>
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
  // The two lists are stacked vertically on top of each other:
  listStack: {
    flexGrow: 1
  },
  listSpinner: {
    flexGrow: 1,
    alignSelf: 'center'
  }
}))
