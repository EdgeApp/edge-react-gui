import * as React from 'react'
import { View } from 'react-native'

import { updateWalletsSort } from '../../actions/WalletListActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSceneFooterRender } from '../../state/SceneFooterState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { CrossFade } from '../common/CrossFade'
import { SceneWrapper } from '../common/SceneWrapper'
import { SortOption, WalletListSortModal } from '../modals/WalletListSortModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { SceneFooterWrapper } from '../themed/SceneFooterWrapper'
import { SearchFooter } from '../themed/SearchFooter'
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

  // rendering -------------------------------------------------------------

  const header = React.useMemo(() => {
    return <WalletListHeader navigation={navigation} sorting={sorting} searching={isSearching} openSortModal={handleSort} />
  }, [handleSort, navigation, isSearching, sorting])

  const handlePressDone = useHandler(() => setSorting(false))

  useSceneFooterRender(
    sceneWrapperInfo => {
      return sorting ? (
        <SceneFooterWrapper sceneWrapperInfo={sceneWrapperInfo}>
          <View style={styles.sortFooterContainer}>
            <MainButton key="doneButton" type="escape" label={lstrings.string_done_cap} onPress={handlePressDone} />
          </View>
        </SceneFooterWrapper>
      ) : (
        <SearchFooter
          placeholder={lstrings.wallet_list_wallet_search}
          isSearching={isSearching}
          searchText={searchText}
          noBackground
          sceneWrapperInfo={sceneWrapperInfo}
          onStartSearching={handleStartSearching}
          onDoneSearching={handleDoneSearching}
          onChangeText={handleChangeText}
        />
      )
    },
    [handleChangeText, handleDoneSearching, handlePressDone, handleStartSearching, isSearching, searchText, sorting, styles.sortFooterContainer]
  )

  return (
    <SceneWrapper avoidKeyboard hasTabs hasNotifications padding={theme.rem(0.5)}>
      {({ insetStyle, undoInsetStyle }) => (
        <>
          <WiredProgressBar />
          <View style={[styles.listStack, undoInsetStyle]}>
            <CrossFade activeKey={sorting ? 'sortList' : 'fullList'}>
              <WalletListSwipeable
                key="fullList"
                header={header}
                footer={undefined}
                navigation={navigation}
                insetStyle={insetStyle}
                searching={isSearching}
                searchText={searchText}
                onRefresh={handleRefresh}
                onReset={handleReset}
              />
              <WalletListSortable insetStyle={insetStyle} key="sortList" />
            </CrossFade>
          </View>
        </>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  sortFooterContainer: {
    flexDirection: 'column',
    alignItems: 'center'
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
