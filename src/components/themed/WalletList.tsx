import { FlashList } from '@shopify/flash-list'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { SectionList, ViewStyle } from 'react-native'

import { selectWalletToken } from '../../actions/WalletActions'
import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { EdgeTokenId, FlatListItem, WalletListItem } from '../../types/types'
import { getCreateWalletTypes, getTokenId } from '../../util/CurrencyInfoHelpers'
import { assetOverrides } from '../../util/serverState'
import { normalizeForSearch } from '../../util/utils'
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
  allowedAssets?: EdgeTokenId[]
  allowedWalletIds?: string[]
  excludeAssets?: EdgeTokenId[]
  excludeWalletIds?: string[]
  filterActivation?: boolean

  // Visuals:
  searching: boolean
  searchText: string
  showCreateWallet?: boolean
  createWalletId?: string

  // Callbacks:
  onPress?: (walletId: string, currencyCode: string, tokenId?: string) => void
}

export interface WalletCreateItem {
  key: string
  currencyCode: string
  displayName: string
  pluginId: string
  tokenId?: string // Used for creating tokens
  walletType?: string // Used for creating wallets
  createWalletIds?: string[]
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
      ((walletId: string, currencyCode: string) => {
        const wallet = account.currencyWallets[walletId]
        const tokenId = getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)
        dispatch(selectWalletToken({ navigation, walletId, tokenId })).catch(err => showError(err))
      }),
    [account, dispatch, navigation, onPress]
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
      return checkFilterWallet({ pluginId, tokenId }, allowedAssets, excludeAssets)
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
    if (searching || searchText.length > 0 || recentWalletList.length === 0) {
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
      const { currencyCode, displayName, pluginId, walletType, createWalletIds } = createItem
      return (
        <WalletListCreateRow
          currencyCode={currencyCode}
          currencyName={displayName}
          pluginId={pluginId}
          walletType={walletType}
          onPress={handlePress}
          createWalletIds={createWalletId != null ? [createWalletId] : createWalletIds}
        />
      )
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
      keyboardShouldPersistTaps="handled"
      renderItem={renderRow}
    />
  ) : (
    <SectionList
      contentContainerStyle={scrollPadding}
      getItemLayout={handleItemLayout}
      keyboardShouldPersistTaps="handled"
      renderItem={renderRow}
      renderSectionHeader={renderSectionHeader}
      sections={sectionList}
    />
  )
}

interface CreateWalletListOpts {
  filteredWalletList?: WalletListItem[]
  filterActivation?: boolean
  allowedAssets?: EdgeTokenId[]
  excludeAssets?: EdgeTokenId[]
}

export const getCreateWalletList = (account: EdgeAccount, opts: CreateWalletListOpts = {}): WalletCreateItem[] => {
  const { filteredWalletList = [], filterActivation, allowedAssets, excludeAssets } = opts
  const walletList: WalletCreateItem[] = []

  // Add top-level wallet types:
  const createWalletCurrencies = getCreateWalletTypes(account, filterActivation)
  for (const createWalletCurrency of createWalletCurrencies) {
    const { currencyCode, currencyName, pluginId, walletType } = createWalletCurrency
    walletList.push({
      key: `create-${walletType}-${pluginId}`,
      currencyCode,
      displayName: currencyName,
      pluginId,
      walletType
    })
  }

  // Add token types:
  for (const pluginId of Object.keys(account.currencyConfig)) {
    const currencyConfig = account.currencyConfig[pluginId]
    const { builtinTokens, currencyInfo } = currencyConfig

    // Identify which wallets could add the token
    const createWalletIds = Object.keys(account.currencyWallets).filter(walletId => account.currencyWallets[walletId].currencyInfo.pluginId === pluginId)

    for (const tokenId of Object.keys(builtinTokens)) {
      const { currencyCode, displayName } = builtinTokens[tokenId]

      // Fix for when the token code and chain code are the same (like EOS/TLOS)
      if (currencyCode === currencyInfo.currencyCode) continue

      walletList.push({
        key: `create-${currencyInfo.pluginId}-${tokenId}`,
        currencyCode,
        displayName,
        pluginId,
        tokenId,
        createWalletIds
      })
    }
  }

  // Filter this list:
  const existingWallets: EdgeTokenId[] = []
  for (const { wallet, tokenId } of filteredWalletList) {
    if (wallet == null) continue
    existingWallets.push({
      pluginId: wallet.currencyInfo.pluginId,
      tokenId
    })
  }
  const out = walletList.filter(item => !hasAsset(existingWallets, item) && checkFilterWallet(item, allowedAssets, excludeAssets))
  return out.filter(item => !assetOverrides.disable[item.pluginId])
}

export const filterWalletCreateItemListBySearchText = (createWalletList: WalletCreateItem[], searchText: string): WalletCreateItem[] => {
  const out: WalletCreateItem[] = []
  const searchTarget = normalizeForSearch(searchText)
  for (const item of createWalletList) {
    const { currencyCode, displayName, pluginId, walletType } = item
    if (normalizeForSearch(currencyCode).includes(searchTarget) || normalizeForSearch(displayName).includes(searchTarget)) {
      out.push(item)
      continue
    }
    // Do an additional search for pluginId for mainnet create items
    if (walletType != null && normalizeForSearch(pluginId).includes(searchTarget)) {
      out.push(item)
    }
  }
  return out
}

function checkFilterWallet(details: EdgeTokenId, allowedAssets?: EdgeTokenId[], excludeAssets?: EdgeTokenId[]): boolean {
  if (allowedAssets != null && !hasAsset(allowedAssets, details)) {
    return false
  }
  if (excludeAssets != null && hasAsset(excludeAssets, details)) {
    return false
  }
  return true
}

/**
 * Returns true if the asset array includes the given asset.
 */
function hasAsset(assets: EdgeTokenId[], target: EdgeTokenId): boolean {
  for (const asset of assets) {
    if (asset.pluginId === target.pluginId && asset.tokenId === target.tokenId) {
      return true
    }
  }
  return false
}
