import { FlashList } from '@shopify/flash-list'
import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { SectionList, ViewStyle } from 'react-native'

import { selectWalletToken } from '../../actions/WalletActions'
import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import { lstrings } from '../../locales/strings'
import { filterWalletCreateItemListBySearchText, getCreateWalletList, WalletCreateItem } from '../../selectors/getCreateWalletList'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
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
  navigation: NavigationBase

  // Filtering:
  allowedAssets?: EdgeAsset[]
  allowedWalletIds?: string[]
  excludeAssets?: EdgeAsset[]
  excludeWalletIds?: string[]
  filterActivation?: boolean

  // Visuals:
  searching: boolean
  searchText: string
  showCreateWallet?: boolean
  createWalletId?: string

  // Callbacks:
  onPress?: (walletId: string, tokenId: EdgeTokenId) => void
}

interface Section {
  title: string
  data: Array<WalletListItem | WalletCreateItem>
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
    searching,
    searchText,
    showCreateWallet,
    createWalletId,

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
      const { tokenId, wallet } = item

      // Exclude loading wallets:
      if (wallet == null) return false

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
        const { wallet, token } = row
        if (wallet == null) return false
        if (wallet.id !== item.id) return false
        const { currencyCode } = token == null ? wallet.currencyInfo : token
        return currencyCode.toLowerCase() === item.currencyCode.toLowerCase()
      })

      if (row != null) out.push(row)
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
  const { walletList, sectionList } = React.useMemo<{ walletList: Array<WalletListItem | WalletCreateItem>; sectionList?: Section[] }>(() => {
    const walletList: Array<WalletListItem | WalletCreateItem> = [
      // Search the wallet list:
      ...searchWalletList(filteredWalletList, searching, searchText)
    ]

    // Show the create-wallet list, filtered by the search term:
    if (showCreateWallet) {
      walletList.push(...createWalletList)
    }

    // Show a flat list if we are searching, or have no recent wallets:
    if (searchText.length > 0 || recentWalletList.length === 0) {
      return { walletList }
    }

    // Add the recent wallets section:
    return {
      sectionList: [
        {
          title: lstrings.wallet_list_modal_header_mru,
          data: [...recentWalletList]
        },
        {
          title: lstrings.wallet_list_modal_header_all,
          data: walletList
        }
      ],
      walletList
    }
  }, [createWalletList, filteredWalletList, recentWalletList, searchText, searching, showCreateWallet])

  // rendering -------------------------------------------------------------

  const renderRow = useHandler((item: FlatListItem<any>) => {
    if (item.item.walletId == null) {
      const createItem: WalletCreateItem = item.item
      return <WalletListCreateRow createItem={createItem} createWalletId={createWalletId} onPress={handlePress} />
    }

    const walletItem: WalletListItem = item.item
    const { token, tokenId, wallet } = walletItem

    if (wallet == null) {
      return <WalletListLoadingRow />
    }
    return <WalletListCurrencyRow token={token} tokenId={tokenId} wallet={wallet} onPress={handlePress} />
  })

  const renderSectionHeader = useHandler((section: { section: Section }) => {
    return <WalletListSectionHeader title={section.section.title} />
  })

  const handleItemLayout = useRowLayout()

  const scrollPadding = React.useMemo<ViewStyle>(() => {
    return { paddingBottom: theme.rem(ModalFooter.bottomRem) }
  }, [theme])

  return sectionList == null ? (
    <FlashList
      contentContainerStyle={scrollPadding}
      data={walletList}
      estimatedItemSize={theme.rem(4.25)}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      renderItem={renderRow}
    />
  ) : (
    <SectionList
      contentContainerStyle={scrollPadding}
      getItemLayout={handleItemLayout}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      renderItem={renderRow}
      renderSectionHeader={renderSectionHeader}
      sections={sectionList}
    />
  )
}
