// @flow

import * as React from 'react'
import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native'

import { useAsyncEffect } from '../../hooks/useAsyncEffect.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useWatchAccount } from '../../hooks/useWatch.js'
import s from '../../locales/strings.js'
import { useMemo, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { getWalletListSlideTutorial, setUserTutorialList } from '../../util/tutorial.js'
import { CrossFade } from '../common/CrossFade.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { PasswordReminderModal } from '../modals/PasswordReminderModal.js'
import { WalletListSortModal } from '../modals/WalletListSortModal.js'
import { Airship, showError } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { WalletListFooter } from '../themed/WalletListFooter.js'
import { WalletListHeader } from '../themed/WalletListHeader.js'
import { WalletListSortable } from '../themed/WalletListSortable.js'
import { WalletListSwipeable } from '../themed/WalletListSwipeable.js'
import { WiredProgressBar } from '../themed/WiredProgressBar.js'

type Props = {
  navigation: NavigationProp<'walletList'>
}

export function WalletListScene(props: Props) {
  const { navigation } = props
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
  const currencyWallets = useWatchAccount(account, 'currencyWallets')
  const loading = Object.keys(currencyWallets).length <= 0

  const handleSort = useHandler(() => {
    Airship.show(bridge => <WalletListSortModal bridge={bridge} />)
      .then(sort => {
        if (sort === 'manual') setSorting(true)
      })
      .catch(showError)
  })

  const handleRefresh = useHandler(() => {
    setSearching(true)
  })

  // Show the tutorial or password reminder on mount:
  useAsyncEffect(
    async () => {
      if (needsPasswordCheck) {
        await Airship.show(bridge => <PasswordReminderModal bridge={bridge} />)
      } else {
        const userTutorialList = await getWalletListSlideTutorial(disklet)
        const tutorialCount = userTutorialList.walletListSlideTutorialCount || 0

        if (tutorialCount < 2) {
          Airship.show(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={s.strings.wallet_list_swipe_tutorial_title}
              buttons={{
                gotIt: { label: s.strings.string_got_it }
              }}
            >
              <Image
                source={theme.walletListSlideTutorialImage}
                resizeMode="contain"
                style={{ height: theme.rem(3), width: 'auto', marginHorizontal: theme.rem(0.5), marginVertical: theme.rem(1) }}
              />
            </ButtonsModal>
          ))
          setShowTutorial(true)
          userTutorialList.walletListSlideTutorialCount = tutorialCount + 1
          await setUserTutorialList(userTutorialList, disklet)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // rendering -------------------------------------------------------------

  const footer = useMemo(() => {
    return <WalletListFooter navigation={navigation} />
  }, [navigation])

  const header = useMemo(() => {
    return (
      <WalletListHeader
        sorting={sorting}
        searching={searching}
        searchText={searchText}
        openSortModal={handleSort}
        onChangeSearchText={setSearchText}
        onChangeSearchingState={setSearching}
      />
    )
  }, [handleSort, searchText, searching, sorting])

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
          <WalletListSwipeable
            key="fullList"
            header={header}
            footer={searching ? null : footer}
            navigation={navigation}
            searching={searching}
            searchText={searchText}
            showSlidingTutorial={showSlidingTutorial}
            onRefresh={handleRefresh}
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
