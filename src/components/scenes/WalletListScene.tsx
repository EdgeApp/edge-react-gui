import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'

import { updateWalletsSort } from '../../actions/WalletListActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { CrossFade } from '../common/CrossFade'
import { NotificationSceneWrapper } from '../common/SceneWrapper'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { SortOption, WalletListSortModal } from '../modals/WalletListSortModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { WalletListFooter } from '../themed/WalletListFooter'
import { WalletListHeader } from '../themed/WalletListHeader'
import { WalletListSortable } from '../themed/WalletListSortable'
import { WalletListSwipeable } from '../themed/WalletListSwipeable'
import { WiredProgressBar } from '../themed/WiredProgressBar'

interface Props extends EdgeSceneProps<'walletList'> {}

export function WalletListScene(props: Props) {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const [sorting, setSorting] = React.useState(false)
  const [searching, setSearching] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')

  const needsPasswordCheck = useSelector(state => state.ui.passwordReminder.needsPasswordCheck)
  const sortOption = useSelector(state => state.ui.settings.walletsSort)

  const handleSort = useHandler(() => {
    Airship.show<SortOption>(bridge => <WalletListSortModal sortOption={sortOption} bridge={bridge} />)
      .then(sort => {
        if (sort == null) return
        if (sort !== sortOption) dispatch(updateWalletsSort(sort))
        if (sort === 'manual') setSorting(true)
      })
      .catch(showError)
  })

  const handleRefresh = useHandler(() => {
    setSearching(true)
  })

  // Turn off searching mode when a wallet is selected
  const handlReset = useHandler(() => {
    setSearchText('')
    setSearching(false)
  })

  // Show the password reminder on mount if required:
  useAsyncEffect(
    async () => {
      if (needsPasswordCheck) {
        await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation} />)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // rendering -------------------------------------------------------------

  const footer = React.useMemo(() => {
    return <WalletListFooter navigation={navigation} />
  }, [navigation])

  const header = React.useMemo(() => {
    return (
      <WalletListHeader
        navigation={navigation}
        sorting={sorting}
        searching={searching}
        searchText={searchText}
        openSortModal={handleSort}
        onChangeSearchText={setSearchText}
        onChangeSearchingState={setSearching}
      />
    )
  }, [handleSort, navigation, searchText, searching, sorting])

  const handlePressDone = useHandler(() => setSorting(false))

  return (
    <NotificationSceneWrapper navigation={navigation} hasTabs>
      {(gap, notificationHeight) => (
        <>
          <WiredProgressBar />
          {sorting && (
            <View style={styles.headerContainer}>
              <EdgeText style={styles.headerText}>{lstrings.title_wallets}</EdgeText>
              <TouchableOpacity key="doneButton" style={styles.headerButtonsContainer} onPress={handlePressDone}>
                <EdgeText style={styles.doneButton}>{lstrings.string_done_cap}</EdgeText>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.listStack}>
            <CrossFade activeKey={sorting ? 'sortList' : 'fullList'}>
              <WalletListSwipeable
                key="fullList"
                header={header}
                footer={searching ? undefined : footer}
                navigation={navigation}
                overscroll={notificationHeight}
                searching={searching}
                searchText={searchText}
                onRefresh={handleRefresh}
                onReset={handlReset}
              />
              <WalletListSortable key="sortList" />
            </CrossFade>
          </View>
        </>
      )}
    </NotificationSceneWrapper>
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
