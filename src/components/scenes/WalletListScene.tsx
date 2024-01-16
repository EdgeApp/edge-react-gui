import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { isMaestro } from 'react-native-is-maestro'

import { updateWalletsSort } from '../../actions/WalletListActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { CrossFade } from '../common/CrossFade'
import { SceneWrapper, SceneWrapperInfo } from '../common/SceneWrapper'
import { PasswordReminderModal } from '../modals/PasswordReminderModal'
import { SortOption, WalletListSortModal } from '../modals/WalletListSortModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SearchDrawer } from '../themed/SearchFooter'
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
  const [isSearching, setIsSearching] = React.useState(false)
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
    setIsSearching(true)
  })

  const handleReset = useHandler(() => {
    setSearchText('')
    setIsSearching(false)
  })

  const handleStartSearching = useHandler(() => {
    setIsSearching(true)
  })

  const handleDoneSearching = useHandler(() => {
    setSearchText('')
    setIsSearching(false)
  })

  const handleChangeText = useHandler((value: string) => {
    setSearchText(value)
  })

  // Show the password reminder on mount if required:
  useAsyncEffect(
    async () => {
      if (needsPasswordCheck && !isMaestro()) {
        await Airship.show(bridge => <PasswordReminderModal bridge={bridge} navigation={navigation} />)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
    'WalletListScene'
  )

  // rendering -------------------------------------------------------------

  const header = React.useMemo(() => {
    return <WalletListHeader navigation={navigation} sorting={sorting} searching={isSearching} openSortModal={handleSort} />
  }, [handleSort, navigation, isSearching, sorting])

  const handlePressDone = useHandler(() => setSorting(false))

  const renderDrawer = React.useCallback(
    (info: SceneWrapperInfo) => {
      return (
        <SearchDrawer
          placeholder={lstrings.wallet_list_wallet_search}
          isSearching={isSearching}
          searchText={searchText}
          sceneWrapperInfo={info}
          onStartSearching={handleStartSearching}
          onDoneSearching={handleDoneSearching}
          onChangeText={handleChangeText}
        />
      )
    },
    [handleChangeText, handleDoneSearching, handleStartSearching, isSearching, searchText]
  )

  return (
    <SceneWrapper avoidKeyboard hasTabs hasHeader hasNotifications padding={theme.rem(0.5)} renderDrawer={renderDrawer}>
      {({ insetStyles }) => (
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
                footer={undefined}
                navigation={navigation}
                insetStyles={insetStyles}
                searching={isSearching}
                searchText={searchText}
                onRefresh={handleRefresh}
                onReset={handleReset}
              />
              <WalletListSortable key="sortList" />
            </CrossFade>
          </View>
        </>
      )}
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
