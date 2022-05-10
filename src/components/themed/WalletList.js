// @flow

import * as React from 'react'
import { FlatList, SectionList } from 'react-native'

import { selectWallet } from '../../actions/WalletActions.js'
import s from '../../locales/strings'
import { useCallback, useMemo } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import type { EdgeTokenId, FlatListItem, WalletListItem } from '../../types/types.js'
import { getCreateWalletTypes } from '../../util/CurrencyInfoHelpers.js'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { normalizeForSearch } from '../../util/utils.js'
import { searchWalletList } from '../services/SortedWalletList.js'
import { useTheme } from '../services/ThemeContext.js'
import { WalletListCreateRow } from './WalletListCreateRow.js'
import { WalletListCurrencyRow } from './WalletListCurrencyRow.js'
import { WalletListLoadingRow } from './WalletListLoadingRow.js'
import { WalletListSectionHeader } from './WalletListSectionHeader.js'

type Props = {|
  // Filtering:
  allowedAssets?: EdgeTokenId[],
  excludeAssets?: EdgeTokenId[],
  excludeWalletIds?: string[],
  filterActivation?: boolean,

  // Visuals:
  marginRem?: number | number[],
  searching: boolean,
  searchText: string,
  showCreateWallet?: boolean,

  // Callbacks:
  onPress?: (walletId: string, currencyCode: string) => void
|}

type WalletCreateItem = {|
  key: string,
  currencyCode: string,
  displayName: string,
  pluginId: string,
  tokenId?: string, // Used for creating tokens
  walletType?: string // Used for creating wallets
|}

type Section = {
  title: string,
  data: Array<WalletListItem | WalletCreateItem>
}

export function WalletList(props: Props) {
  const dispatch = useDispatch()
  const {
    // Filtering:
    allowedAssets,
    excludeAssets,
    excludeWalletIds,
    filterActivation,

    // Visuals:
    marginRem,
    searching,
    searchText,
    showCreateWallet,

    // Callbacks:
    onPress
  } = props

  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))

  const handlePress = useMemo(
    () =>
      onPress ??
      ((walletId: string, currencyCode: string) => {
        dispatch(selectWallet(walletId, currencyCode))
      }),
    [dispatch, onPress]
  )

  // Subscribe to the common wallet list:
  const account = useSelector(state => state.core.account)
  const mostRecentWallets = useSelector(state => state.ui.settings.mostRecentWallets)
  const sortedWalletList = useSelector(state => state.sortedWalletList)

  // Filter the common wallet list:
  const filteredWalletList = useMemo(() => {
    const excludeWalletSet = new Set<string>(excludeWalletIds)

    return sortedWalletList.filter(item => {
      const { tokenId, wallet } = item

      // Exclude loading wallets:
      if (wallet == null) return false

      // Remove excluded walletIds:
      if (excludeWalletSet.has(wallet.id)) return false

      // Apply the currency filters:
      const { pluginId } = wallet.currencyInfo
      return checkFilterWallet({ pluginId, tokenId }, allowedAssets, excludeAssets)
    })
  }, [allowedAssets, excludeAssets, excludeWalletIds, sortedWalletList])

  // Extract recent wallets:
  const recentWalletList = useMemo(() => {
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
  const createWalletList: WalletCreateItem[] = useMemo(() => {
    const out: WalletCreateItem[] = []

    // Add top-level wallet types:
    const createWalletCurrencies = getCreateWalletTypes(account, filterActivation)
    for (const createWalletCurrency of createWalletCurrencies) {
      const { currencyCode, currencyName, pluginId, walletType } = createWalletCurrency
      out.push({
        key: `create-${currencyCode}`,
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

      for (const tokenId of Object.keys(builtinTokens)) {
        const { currencyCode, displayName } = builtinTokens[tokenId]

        // Fix for when the token code and chain code are the same (like EOS/TLOS)
        if (currencyCode === currencyInfo.currencyCode) continue

        out.push({
          key: `create-${currencyInfo.currencyCode}-${tokenId}`,
          currencyCode,
          displayName,
          pluginId,
          tokenId
        })
      }
    }

    // Filter this list:
    const existingWallets: EdgeTokenId[] = []
    for (const { wallet, tokenId } of sortedWalletList) {
      if (wallet == null) continue
      existingWallets.push({
        pluginId: wallet.currencyInfo.pluginId,
        tokenId
      })
    }
    return out.filter(item => !hasAsset(existingWallets, item) && checkFilterWallet(item, allowedAssets, excludeAssets))
  }, [account, allowedAssets, excludeAssets, filterActivation, sortedWalletList])

  // Merge the lists, filtering based on the search term:
  const { walletList, sectionList } = useMemo<{ walletList: Array<WalletListItem | WalletCreateItem>, sectionList?: Section[] }>(() => {
    const walletList: Array<WalletListItem | WalletCreateItem> = [
      // Search the wallet list:
      ...searchWalletList(filteredWalletList, searching, searchText)
    ]

    // Show the create-wallet list, filtered by the search term:
    if (showCreateWallet) {
      const searchTarget = normalizeForSearch(searchText)
      for (const item of createWalletList) {
        const { currencyCode, displayName } = item
        if (normalizeForSearch(currencyCode).includes(searchTarget) || normalizeForSearch(displayName).includes(searchTarget)) {
          walletList.push(item)
        }
      }
    }

    // Show a flat list if we are searching, or have no recent wallets:
    if (searching || searchText.length > 0 || recentWalletList.length === 0) {
      return { walletList }
    }

    // Add the recent wallets section:
    return {
      sectionList: [
        {
          title: s.strings.wallet_list_modal_header_mru,
          data: [...recentWalletList]
        },
        {
          title: s.strings.wallet_list_modal_header_all,
          data: walletList
        }
      ],
      walletList
    }
  }, [createWalletList, filteredWalletList, recentWalletList, searchText, searching, showCreateWallet])

  // rendering -------------------------------------------------------------

  const renderRow = useCallback(
    (item: FlatListItem<any>) => {
      if (item.item.walletId == null) {
        const createItem: WalletCreateItem = item.item
        const { currencyCode, displayName, pluginId, walletType } = createItem
        return <WalletListCreateRow currencyCode={currencyCode} currencyName={displayName} pluginId={pluginId} walletType={walletType} onPress={handlePress} />
      }

      const walletItem: WalletListItem = item.item
      const { token, tokenId, wallet } = walletItem

      if (wallet == null) {
        return <WalletListLoadingRow />
      }
      return <WalletListCurrencyRow token={token} tokenId={tokenId} wallet={wallet} onPress={handlePress} />
    },
    [handlePress]
  )

  const renderSectionHeader = useCallback((section: { section: Section }) => {
    return <WalletListSectionHeader title={section.section.title} />
  }, [])

  return sectionList == null ? (
    <FlatList data={walletList} keyboardShouldPersistTaps="handled" renderItem={renderRow} style={margin} />
  ) : (
    <SectionList keyboardShouldPersistTaps="handled" renderItem={renderRow} renderSectionHeader={renderSectionHeader} sections={sectionList} style={margin} />
  )
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
