import type { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, type ViewStyle } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { selectWalletToken } from '../../actions/WalletActions'
import { useHandler } from '../../hooks/useHandler'
import {
  useServerTokens,
  useServerTokenSearch
} from '../../hooks/useServerTokens'
import { lstrings } from '../../locales/strings'
import {
  filterWalletCreateItemListBySearchText,
  getCreateWalletList,
  type TokenWalletCreateItem,
  type WalletCreateItem
} from '../../selectors/getCreateWalletList'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { NavigationBase } from '../../types/routerTypes'
import type { EdgeAsset, FlatListItem, WalletListItem } from '../../types/types'
import { checkAssetFilter } from '../../util/CurrencyInfoHelpers'
import { serverTokenToEdgeToken } from '../../util/tokenService'
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

  // Get all unique pluginIds from filtered wallets for server token fetching
  const pluginIds = React.useMemo(() => {
    const pluginIdSet = new Set<string>()
    for (const item of sortedWalletList) {
      if (item.type === 'asset') {
        pluginIdSet.add(item.wallet.currencyInfo.pluginId)
      }
    }
    return Array.from(pluginIdSet)
  }, [sortedWalletList])

  // Fetch server tokens for all relevant chains
  const {
    tokens: serverTokens,
    loading: serverLoading,
    loadMore: loadMoreServerTokens,
    hasMore: hasMoreServerTokens
  } = useServerTokens({
    pluginIds: pluginIds.length > 0 ? pluginIds : undefined,
    enabled: showCreateWallet
  })

  // Search server tokens when user types
  const { tokens: searchResults } = useServerTokenSearch({
    searchTerm: searchText,
    pluginIds: pluginIds.length > 0 ? pluginIds : undefined
  })

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

  // Convert server tokens to WalletCreateItem format
  const serverTokenCreateItems = React.useMemo(() => {
    if (!showCreateWallet) return []

    const existingTokenKeys = new Set<string>()
    // Track existing tokens from custom tokens and filtered wallet list
    for (const pluginId of Object.keys(account.currencyConfig)) {
      const { customTokens } = account.currencyConfig[pluginId]
      for (const tokenId of Object.keys(customTokens)) {
        existingTokenKeys.add(`${pluginId}-${tokenId}`)
      }
    }
    for (const item of filteredWalletList) {
      if (item.type === 'asset' && item.tokenId != null) {
        existingTokenKeys.add(
          `${item.wallet.currencyInfo.pluginId}-${item.tokenId}`
        )
      }
    }

    // When searching, use search results; otherwise use paginated server tokens
    const tokensToUse =
      searchText.length > 0 && searchResults.length > 0
        ? searchResults
        : serverTokens

    // Track processed tokens to avoid duplicates
    const processedTokenKeys = new Set<string>()
    const items: TokenWalletCreateItem[] = []

    for (const serverToken of tokensToUse) {
      const key = `${serverToken.chainPluginId}-${serverToken.tokenId}`
      // Skip if already exists as custom token, enabled token, or already processed
      if (existingTokenKeys.has(key) || processedTokenKeys.has(key)) continue
      processedTokenKeys.add(key)

      // Find wallets that could add this token
      const createWalletIds = Object.keys(account.currencyWallets).filter(
        walletId =>
          account.currencyWallets[walletId].currencyInfo.pluginId ===
          serverToken.chainPluginId
      )

      const edgeToken = serverTokenToEdgeToken(serverToken)
      items.push({
        type: 'create',
        key: `create-server-${serverToken.chainPluginId}-${serverToken.tokenId}`,
        currencyCode: serverToken.currencyCode,
        displayName: serverToken.displayName,
        pluginId: serverToken.chainPluginId,
        tokenId: serverToken.tokenId,
        createWalletIds,
        networkLocation: edgeToken.networkLocation
      })
    }

    return items
  }, [
    account,
    filteredWalletList,
    searchResults,
    searchText,
    serverTokens,
    showCreateWallet
  ])

  // Assemble create-wallet rows:
  const createWalletList: WalletCreateItem[] = React.useMemo(() => {
    if (!showCreateWallet) return []

    const baseList = getCreateWalletList(account, {
      allowedAssets,
      excludeAssets,
      filteredWalletList,
      filterActivation
    })

    // Merge with server tokens
    const mergedList = [...baseList, ...serverTokenCreateItems]

    // Apply search filter
    return filterWalletCreateItemListBySearchText(mergedList, searchText)
  }, [
    account,
    allowedAssets,
    excludeAssets,
    filterActivation,
    filteredWalletList,
    searchText,
    serverTokenCreateItems,
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

  // Load more server tokens when reaching the end of the list
  const handleEndReached = useHandler(() => {
    if (showCreateWallet && !serverLoading && hasMoreServerTokens) {
      loadMoreServerTokens()
    }
  })

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
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        showCreateWallet && serverLoading ? (
          <ActivityIndicator style={{ marginVertical: theme.rem(1) }} />
        ) : null
      }
    />
  )
}

const keyExtractor = (
  item: WalletListItem | WalletCreateItem | string
): string => {
  if (typeof item === 'string') return item
  return item.key
}
