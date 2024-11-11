import * as React from 'react'
import { View } from 'react-native'

import { updateWalletsSort } from '../../actions/WalletListActions'
import { useBackButtonToast } from '../../hooks/useBackButtonToast'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { FooterRender, useSceneFooterState } from '../../state/SceneFooterState'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase, WalletsTabSceneProps } from '../../types/routerTypes'
import { EdgeButton } from '../buttons/EdgeButton'
import { SceneButtons } from '../buttons/SceneButtons'
import { CrossFade } from '../common/CrossFade'
import { SceneWrapper } from '../common/SceneWrapper'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { SortOption, WalletListSortModal } from '../modals/WalletListSortModal'
import { AccountSyncBar } from '../progress-indicators/AccountSyncBar'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { SceneFooterWrapper } from '../themed/SceneFooterWrapper'
import { SearchFooter } from '../themed/SearchFooter'
import { WalletListHeader } from '../themed/WalletListHeader'
import { WalletListSortable } from '../themed/WalletListSortable'
import { WalletListSwipeable } from '../themed/WalletListSwipeable'

interface Props extends WalletsTabSceneProps<'walletList'> {}

export function WalletListScene(props: Props) {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const [sorting, setSorting] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')
  const [footerHeight, setFooterHeight] = React.useState<number | undefined>()

  const sortOption = useSelector(state => state.ui.settings.walletsSort)

  const account = useSelector(state => state.core.account)
  const allKeys = useWatch(account, 'allKeys')
  const hasRestoreWallets = allKeys.filter(key => key.archived || key.deleted).length > 0

  const setKeepOpen = useSceneFooterState(state => state.setKeepOpen)

  useBackButtonToast()

  //
  // Handlers
  //

  const handleSort = useHandler(() => {
    Airship.show<SortOption>(bridge => <WalletListSortModal sortOption={sortOption} bridge={bridge} />)
      .then(sort => {
        if (sort == null) return
        if (sort !== sortOption) dispatch(updateWalletsSort(sort))
        if (sort === 'manual') {
          setKeepOpen(true)
          setSorting(true)
        }
      })
      .catch(error => showError(error))
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

  const handlePressDone = useHandler(() => {
    setKeepOpen(true)
    setSorting(false)
  })

  const handlePressRestoreWallets = useHandler(() => {
    navigation.navigate('walletRestore')
  })

  const tokenSupportingWalletIds = React.useMemo(() => {
    const walletIds: string[] = []
    for (const wallet of Object.values(account.currencyWallets)) {
      if (Object.keys(wallet.currencyConfig.builtinTokens).length > 0) {
        walletIds.push(wallet.id)
      }
    }
    return walletIds
  }, [account])

  const handlePressAddEditToken = useHandler(async () => {
    const walletListResult = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={props.navigation as NavigationBase}
        headerTitle={lstrings.choose_custom_token_wallet}
        allowedWalletIds={tokenSupportingWalletIds}
      />
    ))
    if (walletListResult?.type === 'wallet') {
      const { walletId } = walletListResult
      navigation.navigate('editToken', {
        walletId
      })
    }
  })

  const handleFooterLayoutHeight = useHandler((height: number) => {
    setFooterHeight(height)
  })

  //
  // Renders
  //

  const renderHeader = React.useMemo(() => {
    return <WalletListHeader navigation={navigation as NavigationBase} sorting={sorting} searching={isSearching} openSortModal={handleSort} />
  }, [handleSort, navigation, isSearching, sorting])

  const renderListFooter = React.useMemo(() => {
    if (isSearching && tokenSupportingWalletIds.length > 0) {
      return <SceneButtons secondary={{ label: lstrings.add_custom_token, onPress: handlePressAddEditToken }} />
    }
    return <SceneButtons secondary={{ label: lstrings.restore_wallets_modal_title, onPress: handlePressRestoreWallets }} />
  }, [handlePressAddEditToken, handlePressRestoreWallets, tokenSupportingWalletIds, isSearching])

  const renderFooter: FooterRender = React.useCallback(
    sceneWrapperInfo => {
      const key = 'WalletListScene-SearchFooter'
      return sorting ? (
        <SceneFooterWrapper key={key} noBackgroundBlur sceneWrapperInfo={sceneWrapperInfo} onLayoutHeight={handleFooterLayoutHeight}>
          <View style={styles.sortFooterContainer}>
            <EdgeButton key="doneButton" mini type="primary" label={lstrings.string_done_cap} onPress={handlePressDone} />
          </View>
        </SceneFooterWrapper>
      ) : (
        <SearchFooter
          name={key}
          placeholder={lstrings.wallet_list_wallet_search}
          isSearching={isSearching}
          searchText={searchText}
          noBackground
          sceneWrapperInfo={sceneWrapperInfo}
          onStartSearching={handleStartSearching}
          onDoneSearching={handleDoneSearching}
          onChangeText={handleChangeText}
          onLayoutHeight={handleFooterLayoutHeight}
        />
      )
    },
    [
      handleChangeText,
      handleDoneSearching,
      handleFooterLayoutHeight,
      handlePressDone,
      handleStartSearching,
      isSearching,
      searchText,
      sorting,
      styles.sortFooterContainer
    ]
  )

  return (
    <SceneWrapper avoidKeyboard footerHeight={footerHeight} hasTabs hasNotifications renderFooter={renderFooter}>
      {({ insetStyle, undoInsetStyle }) => (
        <>
          <AccountSyncBar />
          <View style={[styles.listStack, undoInsetStyle]}>
            <CrossFade activeKey={sorting ? 'sortList' : 'fullList'}>
              <WalletListSwipeable
                key="fullList"
                header={renderHeader}
                footer={hasRestoreWallets ? renderListFooter : undefined}
                navigation={navigation}
                insetStyle={insetStyle}
                searching={isSearching}
                searchText={searchText}
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
    padding: theme.rem(0.5),
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
