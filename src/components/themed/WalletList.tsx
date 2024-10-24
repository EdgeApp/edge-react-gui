import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { ViewStyle } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { selectWalletToken } from '../../actions/WalletActions'
import { lstrings } from '../../locales/strings'
import { filterWalletCreateItemListBySearchText, getCreateWalletList, WalletCreateItem } from '../../selectors/getCreateWalletList'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { RootSceneProps } from '../../types/routerTypes'
import { EdgeAsset, FlatListItem, WalletListItem } from '../../types/types'
import { checkAssetFilter } from '../../util/CurrencyInfoHelpers'
import { showError } from '../services/AirshipInstance'
import { searchWalletList } from '../services/SortedWalletList'
import { useTheme } from '../services/ThemeContext'
import { ModalFooter } from './ModalParts'
import { WalletListCreateRow } from './WalletListCreateRow'
import { WalletListCurrencyRow } from './WalletListCurrencyRow'
import { WalletListLoadingRow } from './WalletListLoadingRow'
import { WalletListSectionHeader } from './WalletListSectionHeader'

interface Props {
  navigation: RootSceneProps<'edgeApp'>['navigation']

  // Filtering:
  allowedAssets?: EdgeAsset[]
  allowedWalletIds?: string[]
  excludeAssets?: EdgeAsset[]
  excludeWalletIds?: string[]
  filterActivation?: boolean

  // Visuals:
  searchText: string
  showCreateWallet?: boolean
  createWalletId?: string
  parentWalletId?: string

  // Callbacks:
  onPress?: (walletId: string, tokenId: EdgeTokenId) => void
}

/**
 * This list is used inside the wallet list modal,
 * and *only* the wallet list modal.
 */
export function WalletList(props: Props) {
  const dispatch = useDispatch()
  const {
    navigation,

    // Filtering:
    allowedAssets,
    allowedWalletIds,
    excludeAssets,
    excludeWalletIds,
    filterActivation,

    // Visuals:
    searchText,
    showCreateWallet,
    createWalletId,
    parentWalletId,

    // Callbacks:
    onPress
  } = props

  const theme = useTheme()

  // Subscribe to the common wallet list:
  const account = useSelector(state => state.core.account)
  const mostRecentWallets = useSelector(state => state.ui.settings.mostRecentWallets)
  const sortedWalletList = useSelector(state => state.sortedWalletList)

  const handlePress = React.useMemo(
    () =>
      onPress ??
      ((walletId: string, tokenId: EdgeTokenId) => {
        dispatch(selectWalletToken({ navigation, walletId, tokenId })).catch(err => showError(err))
      }),
    [dispatch, navigation, onPress]
  )

  // Filter the common wallet list:
  const filteredWalletList = React.useMemo(() => {
    const excludeWalletSet = new Set<string>(excludeWalletIds)
    const allowedWalletSet = new Set<string>(allowedWalletIds ?? [])

    return sortedWalletList.filter(item => {
      // Exclude loading wallets:
      if (item.type !== 'asset') return false

      const { tokenId, wallet } = item

      // Remove excluded walletIds:
      if (excludeWalletSet.has(wallet.id)) return false

      // Remove walletIds not in the allowed set:
      if (allowedWalletIds != null) {
        if (!allowedWalletSet.has(wallet.id)) return false
      }

      // Apply the currency filters:
      const { pluginId } = wallet.currencyInfo
      return checkAssetFilter({ pluginId, tokenId }, allowedAssets, excludeAssets)
    })
  }, [allowedAssets, allowedWalletIds, excludeAssets, excludeWalletIds, sortedWalletList])

  const parentWalletSection: Array<WalletListItem | string> = React.useMemo(() => {
    const out: Array<WalletListItem | string> = []
    if (parentWalletId != null) {
      // Always show a "Parent Wallet" header:
      out.push(lstrings.wallet_list_modal_header_parent)

      // The parent wallet should always be available from sortedWalletList:
      const parentWalletListItem = sortedWalletList.find(
        walletListItem => walletListItem.type === 'asset' && walletListItem.wallet?.id === parentWalletId && walletListItem.tokenId == null
      )
      if (parentWalletListItem != null) out.push({ ...parentWalletListItem, key: `parent-${parentWalletListItem.key}` })
    }
    return out
  }, [parentWalletId, sortedWalletList])

  // Extract recent wallets:
  const recentWalletList = React.useMemo(() => {
    const out: WalletListItem[] = []

    function pickLength() {
      if (filteredWalletList.length > 10) return 3
      if (filteredWalletList.length > 4) return 2
      return 0
    }
    const maxLength = pickLength()

    for (const item of mostRecentWallets) {
      // Find the mentioned wallet, if it still exists:
      const row = filteredWalletList.find(row => {
        if (row.type !== 'asset') return false
        const { wallet, token } = row
        if (wallet.id !== item.id) return false
        const { currencyCode } = token ?? wallet.currencyInfo
        return currencyCode.toLowerCase() === item.currencyCode.toLowerCase()
      })

      if (row != null) out.push({ ...row, key: `recent-${row.key}` })
      if (out.length >= maxLength) break
    }

    return out
  }, [filteredWalletList, mostRecentWallets])

  // Assemble create-wallet rows:
  const createWalletList: WalletCreateItem[] = React.useMemo(
    () =>
      filterWalletCreateItemListBySearchText(getCreateWalletList(account, { allowedAssets, excludeAssets, filteredWalletList, filterActivation }), searchText),
    [account, allowedAssets, excludeAssets, searchText, filteredWalletList, filterActivation]
  )

  // Merge the lists, filtering based on the search term:
  const walletList = React.useMemo<Array<WalletListItem | WalletCreateItem | string>>(() => {
    const walletList: Array<WalletListItem | WalletCreateItem> = [
      // Search the wallet list:
      ...searchWalletList(filteredWalletList, searchText)
    ]

    // Show the create-wallet list, filtered by the search term:
    if (showCreateWallet) {
      walletList.push(...createWalletList)
    }

    // Show a flat list if we are searching, or have no recent wallets:
    if (searchText.length > 0 || recentWalletList.length === 0) {
      return walletList
    }

    return [
      // Parent section and wallet, if defined
      ...parentWalletSection,
      // Show a sectioned list with sectioned recent/all wallets:
      lstrings.wallet_list_modal_header_mru,
      ...recentWalletList,
      lstrings.wallet_list_modal_header_all,
      ...walletList
    ]
  }, [createWalletList, filteredWalletList, parentWalletSection, recentWalletList, searchText, showCreateWallet])

  // rendering -------------------------------------------------------------

  const renderRow = React.useCallback(
    (item: FlatListItem<WalletListItem | WalletCreateItem | string>) => {
      if (typeof item.item === 'string') return <WalletListSectionHeader title={item.item} />

      switch (item.item.type) {
        case 'asset': {
          const { token, tokenId, wallet } = item.item
          return <WalletListCurrencyRow token={token} tokenId={tokenId} wallet={wallet} onPress={handlePress} />
        }
        case 'create':
          return <WalletListCreateRow createItem={item.item} createWalletId={createWalletId} onPress={handlePress} />
        case 'loading':
          return <WalletListLoadingRow />
      }
    },
    [createWalletId, handlePress]
  )

  const scrollPadding = React.useMemo<ViewStyle>(() => {
    return { paddingBottom: theme.rem(ModalFooter.bottomRem) }
  }, [theme])

  return (
    <FlatList
      contentContainerStyle={scrollPadding}
      data={walletList}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      keyExtractor={keyExtractor}
      renderItem={renderRow}
    />
  )
}

const keyExtractor = (item: WalletListItem | WalletCreateItem | string): string => {
  if (typeof item === 'string') return item
  return item.key
}
