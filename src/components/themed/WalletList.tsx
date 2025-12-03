import type { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import type { ViewStyle } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { selectWalletToken } from '../../actions/WalletActions'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import {
  filterWalletCreateItemListBySearchText,
  getCreateWalletList,
  type WalletCreateItem
} from '../../selectors/getCreateWalletList'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase } from '../../types/routerTypes'
import type { EdgeAsset, FlatListItem, WalletListItem } from '../../types/types'
import { checkAssetFilter } from '../../util/CurrencyInfoHelpers'
import { searchWalletList } from '../services/SortedWalletList'
import { useTheme } from '../services/ThemeContext'
import { ModalFooter } from './ModalParts'
import { WalletListCreateRow } from './WalletListCreateRow'
import { WalletListCurrencyRow } from './WalletListCurrencyRow'
import { WalletListLoadingRow } from './WalletListLoadingRow'
import { WalletListSectionHeader } from './WalletListSectionHeader'

interface Props {
  navigation: NavigationBase

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
  onPress?: (walletId: string, tokenId: EdgeTokenId) => Promise<void> | void
}

/**
 * This list is used inside the wallet list modal,
 * and *only* the wallet list modal.
 */
export const WalletList: React.FC<Props> = (props: Props) => {
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
    showCreateWallet = false,
    createWalletId,
    parentWalletId,

    // Callbacks:
    onPress
  } = props

  const theme = useTheme()

  // Subscribe to the common wallet list:
  const account = useSelector(state => state.core.account)
  const mostRecentWallets = useSelector(
    state => state.ui.settings.mostRecentWallets
  )
  const sortedWalletList = useSelector(state => state.sortedWalletList)

  const handlePress = useHandler(
    async (walletId: string, tokenId: EdgeTokenId) => {
      if (onPress != null) {
        await onPress(walletId, tokenId)
      } else {
        await dispatch(selectWalletToken({ navigation, walletId, tokenId }))
      }
    }
  )

  // Filter the common wallet list:
  const filteredWalletList = React.useMemo(() => {
    const excludeWalletSet = new Set<string>(excludeWalletIds ?? [])
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
      return checkAssetFilter(
        { pluginId, tokenId },
        allowedAssets,
        excludeAssets
      )
    })
  }, [
    allowedAssets,
    allowedWalletIds,
    excludeAssets,
    excludeWalletIds,
    sortedWalletList
  ])

  const parentWalletSection: Array<WalletListItem | string> =
    React.useMemo(() => {
      const out: Array<WalletListItem | string> = []
      if (parentWalletId != null) {
        // Always show a "Parent Wallet" header:
        out.push(lstrings.wallet_list_modal_header_parent)

        // The parent wallet should always be available from sortedWalletList:
        const parentWalletListItem = sortedWalletList.find(
          walletListItem =>
            walletListItem.type === 'asset' &&
            walletListItem.wallet?.id === parentWalletId &&
            walletListItem.tokenId == null
        )
        if (parentWalletListItem != null)
          out.push({
            ...parentWalletListItem,
            key: `parent-${parentWalletListItem.key}`
          })
      }
      return out
    }, [parentWalletId, sortedWalletList])

  // Extract recent wallets:
  const recentWalletList = React.useMemo(() => {
    const out: WalletListItem[] = []

    const pickLength = (): number => {
      if (filteredWalletList.length > 10) return 3
      if (filteredWalletList.length > 4) return 2
      return 0
    }
    const maxLength = pickLength()

    for (const item of mostRecentWallets) {
      // Find the mentioned wallet, if it still exists:
      const row = filteredWalletList.find(row => {
        if (row.type !== 'asset') return false
        const { wallet, tokenId } = row
        if (wallet.id !== item.id) return false
        return tokenId === item.tokenId
      })

      if (row != null) out.push({ ...row, key: `recent-${row.key}` })
      if (out.length >= maxLength) break
    }

    return out
  }, [filteredWalletList, mostRecentWallets])

  // Assemble create-wallet rows:
  const createWalletList: WalletCreateItem[] = React.useMemo(() => {
    if (!showCreateWallet) return []

    return filterWalletCreateItemListBySearchText(
      getCreateWalletList(account, {
        allowedAssets,
        excludeAssets,
        filteredWalletList,
        filterActivation
      }),
      searchText
    )
  }, [
    account,
    allowedAssets,
    excludeAssets,
    filterActivation,
    filteredWalletList,
    searchText,
    showCreateWallet
  ])

  // Merge the lists, filtering based on the search term:
  const walletList = React.useMemo<
    Array<WalletListItem | WalletCreateItem | string>
  >(() => {
    const walletItems: Array<WalletListItem | WalletCreateItem> = [
      // Search the wallet list:
      ...searchWalletList(filteredWalletList, searchText)
    ]

    // Show the create-wallet list, filtered by the search term:
    walletItems.push(...createWalletList)

    // Show a flat list if we are searching, or have no recent wallets:
    if (searchText.length > 0 || recentWalletList.length === 0) {
      return walletItems
    }

    const recentAssetKeySet = new Set(
      recentWalletList.flatMap(item => {
        if (item.type !== 'asset') return []
        return [`${item.wallet.id}::${item.tokenId ?? ''}`]
      })
    )

    const nonRecentWalletItems = walletItems.filter(item => {
      if (item.type !== 'asset') return true
      const key = `${item.wallet.id}::${item.tokenId ?? ''}`
      return !recentAssetKeySet.has(key)
    })

    return [
      // Parent section and wallet, if defined
      ...parentWalletSection,
      // Show a sectioned list with sectioned recent/all wallets:
      lstrings.wallet_list_modal_header_mru,
      ...recentWalletList,
      lstrings.wallet_list_modal_header_other,
      ...nonRecentWalletItems
    ]
  }, [
    createWalletList,
    filteredWalletList,
    parentWalletSection,
    recentWalletList,
    searchText
  ])

  // rendering -------------------------------------------------------------

  const renderRow = React.useCallback(
    (item: FlatListItem<WalletListItem | WalletCreateItem | string>) => {
      if (typeof item.item === 'string')
        return <WalletListSectionHeader title={item.item} />

      switch (item.item.type) {
        case 'asset': {
          const { token, tokenId, wallet } = item.item
          return (
            <WalletListCurrencyRow
              token={token}
              tokenId={tokenId}
              wallet={wallet}
              onPress={handlePress}
            />
          )
        }
        case 'create':
          return (
            <WalletListCreateRow
              createItem={item.item}
              createWalletId={createWalletId}
              onPress={handlePress}
            />
          )
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

const keyExtractor = (
  item: WalletListItem | WalletCreateItem | string
): string => {
  if (typeof item === 'string') return item
  return item.key
}
