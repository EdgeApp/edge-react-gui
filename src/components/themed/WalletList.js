// @flow

import * as React from 'react'
import { FlatList, RefreshControl, SectionList } from 'react-native'

import { selectWallet } from '../../actions/WalletActions.js'
import { useAllTokens } from '../../hooks/useAllTokens.js'
import { useWatchAccount } from '../../hooks/useWatch.js'
import s from '../../locales/strings'
import { getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { calculateFiatBalance } from '../../selectors/WalletSelectors.js'
import { useMemo } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import type { CreateTokenType, CreateWalletType, EdgeTokenIdExtended, FlatListItem, GuiWallet } from '../../types/types.js'
import { asSafeDefaultGuiWallet } from '../../types/types.js'
import { getCreateWalletTypes, getCurrencyInfos } from '../../util/CurrencyInfoHelpers.js'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { normalizeForSearch } from '../../util/utils.js'
import { useTheme } from '../services/ThemeContext.js'
import { WalletListCreateRow } from './WalletListCreateRow.js'
import { WalletListCurrencyRow } from './WalletListCurrencyRow.js'
import { WalletListLoadingRow } from './WalletListLoadingRow.js'
import { WalletListSectionHeader } from './WalletListSectionHeader.js'
import { WalletListSwipeRow } from './WalletListSwipeRow.js'

export const alphabeticalSort = (itemA: string, itemB: string) => (itemA < itemB ? -1 : itemA > itemB ? 1 : 0)

type WalletListItem = {
  id: string | null,
  fullCurrencyCode?: string,
  key: string,
  createWalletType?: CreateWalletType,
  createTokenType?: CreateTokenType
}

type Section = {
  title: string,
  data: WalletListItem[]
}

const getSortOptionsCurrencyCode = (fullCurrencyCode: string): string => {
  const splittedCurrencyCode = fullCurrencyCode.split('-')
  return splittedCurrencyCode[1] || splittedCurrencyCode[0]
}

type Props = {|
  allowedCurrencyCodes?: string[] | EdgeTokenIdExtended[],
  excludeCurrencyCodes?: string[],
  excludeWalletIds?: string[],
  filterActivation?: boolean,
  footer?: React.Node,
  header?: React.Node,
  isModal?: boolean,
  marginRem?: number | number[],
  searching: boolean,
  searchText: string,
  showCreateWallet?: boolean,
  showSlidingTutorial?: boolean,

  // Callbacks:
  onPress?: (walletId: string, currencyCode: string) => void,
  onRefresh?: () => void
|}

export function WalletList(props: Props) {
  const dispatch = useDispatch()
  const {
    allowedCurrencyCodes,
    excludeCurrencyCodes,
    excludeWalletIds,
    filterActivation,
    footer,
    header,
    isModal,
    marginRem,
    searching,
    searchText,
    showCreateWallet,
    showSlidingTutorial,

    // Callbacks:
    onPress,
    onRefresh
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
  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const mostRecentWallets = useSelector(state => state.ui.settings.mostRecentWallets)
  const walletsSort = useSelector(state => state.ui.settings.walletsSort)
  const wallets = useSelector(state => state.ui.wallets.byId)

  // Subscribe to the wallet list:
  const activeWalletIds = useWatchAccount(account, 'activeWalletIds')

  // Subscribe to all the tokens in the account:
  const allTokens = useAllTokens(account)

  function sortWalletList(walletList: WalletListItem[]): WalletListItem[] {
    const getFiatBalance = (wallet: GuiWallet, fullCurrencyCode: string): number => {
      const currencyWallet = account.currencyWallets[wallet.id]
      const currencyCode = getSortOptionsCurrencyCode(fullCurrencyCode)
      const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyWallet.currencyInfo.pluginId, currencyCode))
      const fiatBalanceString = calculateFiatBalance(currencyWallet, exchangeDenomination, exchangeRates)
      return parseFloat(fiatBalanceString)
    }

    if (walletsSort === 'name') {
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        return alphabeticalSort(wallets[itemA.id].name, wallets[itemB.id].name)
      })
    }

    if (walletsSort === 'currencyCode') {
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null) return 0
        return alphabeticalSort(getSortOptionsCurrencyCode(itemA.fullCurrencyCode || ''), getSortOptionsCurrencyCode(itemB.fullCurrencyCode || ''))
      })
    }

    if (walletsSort === 'currencyName') {
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        const currencyNameA = wallets[itemA.id || ''].currencyNames[getSortOptionsCurrencyCode(itemA.fullCurrencyCode || '')]
        const currencyNameB = wallets[itemB.id || ''].currencyNames[getSortOptionsCurrencyCode(itemB.fullCurrencyCode || '')]
        return alphabeticalSort(currencyNameA, currencyNameB)
      })
    }

    if (walletsSort === 'highest') {
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        const aBalance = getFiatBalance(wallets[itemB.id ?? ''], itemB.fullCurrencyCode || '')
        const bBalance = getFiatBalance(wallets[itemA.id ?? ''], itemA.fullCurrencyCode || '')
        return aBalance - bBalance
      })
    }

    if (walletsSort === 'lowest') {
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        return getFiatBalance(wallets[itemA.id ?? ''], itemA.fullCurrencyCode || '') - getFiatBalance(wallets[itemB.id ?? ''], itemB.fullCurrencyCode || '')
      })
    }
    return walletList
  }

  function checkFromExistingWallets(walletList: WalletListItem[], fullCurrencyCode: string): boolean {
    return !!walletList.find((item: WalletListItem) => item.fullCurrencyCode === fullCurrencyCode)
  }

  function getWalletList(): WalletListItem[] {
    const walletList = []

    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]

      if (excludeWalletIds != null && excludeWalletIds.find(excludeWalletId => excludeWalletId === walletId)) continue // Skip if excluded

      if (wallet == null && !searching) {
        // Initialize wallets that is still loading
        walletList.push({
          id: walletId,
          key: walletId
        })
      } else if (wallet != null) {
        const { enabledTokens, name, pluginId } = asSafeDefaultGuiWallet(wallet)
        const { currencyInfo } = account.currencyConfig[pluginId]
        const { currencyCode, displayName } = currencyInfo

        // Initialize wallets
        if (checkFilterWallet({ name, currencyCode, currencyName: displayName, pluginId }, searchText, allowedCurrencyCodes, excludeCurrencyCodes)) {
          walletList.push({
            id: walletId,
            fullCurrencyCode: currencyCode,
            key: `${walletId}-${currencyCode}`
          })
        }

        // Initialize tokens
        for (const tokenCode of enabledTokens) {
          const tokenId = Object.keys(allTokens[pluginId]).find(id => allTokens[pluginId][id].currencyCode === tokenCode)
          if (tokenId == null) continue
          const token = allTokens[pluginId][tokenId]

          const fullCurrencyCode = `${currencyCode}-${tokenCode}`

          if (
            checkFilterWallet(
              { name, currencyCode: tokenCode, currencyName: token.displayName, pluginId },
              searchText,
              allowedCurrencyCodes,
              excludeCurrencyCodes
            )
          ) {
            walletList.push({
              id: walletId,
              fullCurrencyCode,
              key: `${walletId}-${fullCurrencyCode}`,
              tokenCode
            })
          }
        }
      }
    }

    const sortedWalletlist = sortWalletList(walletList)

    if (showCreateWallet) {
      // Initialize Create Wallets
      const createWalletCurrencies = getCreateWalletTypes(account, filterActivation)
      for (const createWalletCurrency of createWalletCurrencies) {
        const { currencyCode, currencyName, pluginId } = createWalletCurrency

        if (
          checkFilterWallet({ name: '', currencyCode, currencyName, pluginId }, searchText, allowedCurrencyCodes, excludeCurrencyCodes) &&
          !checkFromExistingWallets(walletList, currencyCode)
        ) {
          sortedWalletlist.push({
            id: null,
            fullCurrencyCode: currencyCode,
            key: currencyCode,
            createWalletType: createWalletCurrency
          })
        }
      }

      // Initialize Create Tokens
      const currencyInfos = getCurrencyInfos(account)
      for (const currencyInfo of currencyInfos) {
        const { pluginId } = currencyInfo
        for (const metaToken of currencyInfo.metaTokens) {
          const { currencyCode, currencyName } = metaToken
          // Fix for when the token code and chain code are the same (like EOS/TLOS)
          if (currencyCode === currencyInfo.currencyCode) continue
          const fullCurrencyCode = `${currencyInfo.currencyCode}-${currencyCode}`

          if (
            checkFilterWallet({ name: '', currencyCode, currencyName, pluginId }, searchText, allowedCurrencyCodes, excludeCurrencyCodes) &&
            !checkFromExistingWallets(walletList, fullCurrencyCode)
          ) {
            sortedWalletlist.push({
              id: null,
              fullCurrencyCode,
              key: fullCurrencyCode,
              createTokenType: {
                currencyCode,
                currencyName,
                pluginId: currencyInfo.pluginId
              }
            })
          }
        }
      }
    }

    return sortedWalletlist
  }

  function renderRow(data: FlatListItem<WalletListItem>) {
    // Create Wallet/Token
    if (data.item.id == null) {
      const { createWalletType, createTokenType } = data.item
      return <WalletListCreateRow {...{ ...createWalletType, ...createTokenType }} onPress={handlePress} />
    }

    const walletId = data.item.id.replace(/:.*/, '')
    const guiWallet = wallets[walletId]

    if (guiWallet == null || account.currencyWallets[walletId] == null) {
      if (isModal) {
        return <WalletListLoadingRow />
      }
      return <WalletListSwipeRow currencyCode="" isToken={false} walletId={walletId} />
    } else {
      const isToken = guiWallet.currencyCode !== data.item.fullCurrencyCode
      const walletCodesArray = data.item.fullCurrencyCode != null ? data.item.fullCurrencyCode.split('-') : []
      const currencyCode = isToken ? walletCodesArray[1] : walletCodesArray[0]

      if (isModal) {
        return <WalletListCurrencyRow currencyCode={currencyCode} walletId={walletId} onPress={handlePress} />
      }

      return <WalletListSwipeRow currencyCode={currencyCode} isToken={isToken} openTutorial={data.index === 0 && showSlidingTutorial} walletId={walletId} />
    }
  }

  const renderRefreshControl = () => <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={theme.searchListRefreshControlIndicator} />

  const renderSectionHeader = (section: { section: Section }) => <WalletListSectionHeader title={section.section.title} />

  function getMostRecentlyUsedWallets(size: number, walletListItem: WalletListItem[]): WalletListItem[] {
    const recentWallets = []

    for (let i = 0; i < size; i++) {
      const recentUsed = mostRecentWallets[i]
      if (!recentUsed) break
      const wallet = walletListItem.find(item => {
        const fullCurrencyCodeLowerCase = item.fullCurrencyCode ? item.fullCurrencyCode.toLowerCase() : ''
        return item.id === recentUsed.id && fullCurrencyCodeLowerCase.includes(recentUsed.currencyCode.toLowerCase())
      })
      if (wallet) {
        recentWallets.push(wallet)
      }
    }

    return recentWallets
  }

  const getSection = (walletList: WalletListItem[], walletListOnlyCount: number) => {
    const sections: Section[] = []

    let mostRecentWalletsCount = 0
    if (walletListOnlyCount > 4 && walletListOnlyCount < 11) {
      mostRecentWalletsCount = 2
    } else if (walletListOnlyCount > 10) {
      mostRecentWalletsCount = 3
    }

    sections.push({
      title: s.strings.wallet_list_modal_header_mru,
      data: getMostRecentlyUsedWallets(mostRecentWalletsCount, walletList)
    })

    sections.push({
      title: s.strings.wallet_list_modal_header_all,
      data: walletList
    })

    return sections
  }

  const walletList = getWalletList()

  let isSectionList = false
  let walletOnlyList = []
  if (isModal && !searching && searchText.length === 0 && mostRecentWallets.length > 1) {
    walletOnlyList = walletList.filter(item => item.id)
    if (walletOnlyList.length > 4) {
      isSectionList = true
    }
  }

  if (isSectionList) {
    return (
      <SectionList
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        renderItem={renderRow}
        renderSectionHeader={renderSectionHeader}
        sections={getSection(walletList, walletOnlyList.length)}
        style={margin}
      />
    )
  }

  return (
    <FlatList
      contentOffset={{ x: 0, y: !searching && !isModal ? theme.rem(4.5) : 0 }}
      data={walletList}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={isModal ? undefined : renderRefreshControl()}
      renderItem={renderRow}
      style={margin}
    />
  )
}

function checkCurrencyCodes(fullCurrencyCode: string, currencyCode: string): boolean {
  const [parent, token] = fullCurrencyCode.split('-')
  const checkToken = token ? currencyCode.toLowerCase() === token.toLowerCase() : false
  const checkParent = !token ? currencyCode.toLowerCase() === parent.toLowerCase() : false
  return checkToken || checkParent
}

function checkCurrencyCodesArray(currencyCode: string, currencyCodesArray: any[], pluginId: string): boolean {
  return !!currencyCodesArray.find(item => {
    if (typeof item === 'string') {
      return checkCurrencyCodes(item, currencyCode)
    } else if (typeof item === 'object') {
      return item.pluginId === pluginId && item.currencyCode === currencyCode.toUpperCase()
    }
    return undefined
  })
}

type FilterDetailsType = { name: string, currencyCode: string, currencyName: string, pluginId: string }

function checkFilterWallet(
  details: FilterDetailsType,
  filterText: string,
  allowedCurrencyCodes?: string[] | EdgeTokenIdExtended[],
  excludeCurrencyCodes?: string[]
): boolean {
  const currencyCode = details.currencyCode.toLowerCase()

  if (allowedCurrencyCodes && allowedCurrencyCodes.length > 0 && !checkCurrencyCodesArray(currencyCode, allowedCurrencyCodes, details.pluginId)) {
    return false
  }

  if (excludeCurrencyCodes && excludeCurrencyCodes.length > 0 && checkCurrencyCodesArray(currencyCode, excludeCurrencyCodes, details.pluginId)) {
    return false
  }

  if (filterText === '') {
    return true
  }

  const walletName = normalizeForSearch(details.name)
  const currencyName = normalizeForSearch(details.currencyName)
  const filterString = normalizeForSearch(filterText)
  return walletName.includes(filterString) || currencyCode.includes(filterString) || currencyName.includes(filterString)
}
