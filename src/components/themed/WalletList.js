// @flow

import * as React from 'react'
import { FlatList, RefreshControl, SectionList } from 'react-native'

import { selectWallet } from '../../actions/WalletActions.js'
import s from '../../locales/strings'
// import { getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
// import { calculateFiatBalance } from '../../selectors/WalletSelectors.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import type { CreateTokenType, CreateWalletType, FlatListItem } from '../../types/types.js'
// import { asSafeDefaultGuiWallet } from '../../types/types.js'
import { getCreateWalletTypes } from '../../util/CurrencyInfoHelpers.js'
import { alphabeticalSort, checkCurrencyCodes, checkFilterWallet } from '../../util/utils.js'
import { useTheme } from '../services/ThemeContext.js'
import { WalletListCreateRow } from './WalletListCreateRow.js'
import { WalletListCurrencyRow } from './WalletListCurrencyRow.js'
import { WalletListRow } from './WalletListRow.js'
import { WalletListSectionHeader } from './WalletListSectionHeader.js'
import { WalletListSwipeRow } from './WalletListSwipeRow.js'

type WalletListItem = {
  id: string | null,
  fullCurrencyCode?: string,
  key: string,
  createWalletType?: CreateWalletType,
  createTokenType?: CreateTokenType,
  onPress?: () => void
}

type Section = {
  title: string,
  data: WalletListItem[]
}

const getSortOptionsCurrencyCode = (fullCurrencyCode: string): string => {
  const splittedCurrencyCode = fullCurrencyCode.split('-')
  return splittedCurrencyCode[1] || splittedCurrencyCode[0]
}

type Props = {
  header?: React.Node,
  footer?: React.Node,
  searching: boolean,
  searchText: string,
  showCreateWallet?: boolean,
  excludeWalletIds?: string[],
  allowedCurrencyCodes?: string[],
  excludeCurrencyCodes?: string[],
  activateSearch?: () => void,
  showSlidingTutorial?: boolean,
  filterActivation?: boolean,
  isModal?: boolean,
  onPress?: (walletId: string, currencyCode: string) => void
}

export function WalletList(props: Props) {
  const dispatch = useDispatch()
  const {
    header,
    footer,
    searching,
    searchText,
    showCreateWallet,
    excludeWalletIds,
    allowedCurrencyCodes,
    excludeCurrencyCodes,
    activateSearch,
    showSlidingTutorial,
    filterActivation,
    isModal,
    onPress = (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
  } = props

  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  // const customTokens = useSelector(state => state.ui.settings.customTokens)
  // const exchangeRates = useSelector(state => state.exchangeRates)
  const mostRecentWallets = useSelector(state => state.ui.settings.mostRecentWallets)
  const walletsSort = useSelector(state => state.ui.settings.walletsSort)
  const edgeWallets = useSelector(state => state.core.account.currencyWallets)

  // Subscribe to the wallet list:
  const [activeWalletIds, setActiveWalletIds] = useState(account.activeWalletIds)
  useEffect(() => account.watch('activeWalletIds', setActiveWalletIds), [account])

  function sortWalletList(walletList: WalletListItem[]): WalletListItem[] {
    // const getFiatBalance = (wallet: GuiWallet, fullCurrencyCode: string): number => {
    //   const currencyWallet = account.currencyWallets[wallet.id]
    //   const currencyCode = getSortOptionsCurrencyCode(fullCurrencyCode)
    //   const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyWallet.currencyInfo.pluginId, currencyCode))
    //   const fiatBalanceString = calculateFiatBalance(currencyWallet, exchangeDenomination, exchangeRates)
    //   return parseFloat(fiatBalanceString)
    // }

    if (walletsSort === 'name') {
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || edgeWallets[itemA.id] == null || edgeWallets[itemB.id] == null) return 0
        return alphabeticalSort(edgeWallets[itemA.id].name ?? '', edgeWallets[itemB.id].name ?? '')
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
        return 0
        // TODO: fixme
        // if (itemA.id == null || itemB.id == null || edgeWallets[itemA.id] == null || edgeWallets[itemB.id] == null) return 0
        // const currencyNameA = edgeWallets[itemA.id || ''].currencyNames[getSortOptionsCurrencyCode(itemA.fullCurrencyCode || '')]
        // const currencyNameB = edgeWallets[itemB.id || ''].currencyNames[getSortOptionsCurrencyCode(itemB.fullCurrencyCode || '')]
        // return alphabeticalSort(currencyNameA, currencyNameB)
      })
    }

    if (walletsSort === 'highest') {
      walletList.sort((itemA, itemB) => {
        return 0
        // TODO: fixme
        // if (itemA.id == null || itemB.id == null || edgeWallets[itemA.id] === undefined || edgeWallets[itemB.id] === undefined) return 0
        // return getFiatBalance(edgeWallets[itemB.id ?? ''], itemB.fullCurrencyCode || '') - getFiatBalance(edgeWallets[itemA.id ?? ''], itemA.fullCurrencyCode || '')
      })
    }

    if (walletsSort === 'lowest') {
      walletList.sort((itemA, itemB) => {
        return 0
        // TODO: fixme
        // if (itemA.id == null || itemB.id == null || edgeWallets[itemA.id] === undefined || edgeWallets[itemB.id] === undefined) return 0
        // return getFiatBalance(edgeWallets[itemA.id ?? ''], itemA.fullCurrencyCode || '') - getFiatBalance(edgeWallets[itemB.id ?? ''], itemB.fullCurrencyCode || '')
      })
    }
    return walletList
  }

  function checkFromExistingWallets(walletList: WalletListItem[], currencyCode: string): boolean {
    return !!walletList.find((item: WalletListItem) => (item.fullCurrencyCode ? checkCurrencyCodes(item.fullCurrencyCode, currencyCode) : false))
  }

  function getWalletList(): WalletListItem[] {
    const walletList = []

    for (const walletId of activeWalletIds) {
      const wallet = edgeWallets[walletId]

      if (excludeWalletIds != null && excludeWalletIds.find(excludeWalletId => excludeWalletId === walletId)) continue // Skip if excluded

      if (wallet == null && !searching) {
        // Initialize wallets that is still loading
        walletList.push({
          id: walletId,
          key: walletId
        })
      } else if (wallet != null) {
        // const { enabledTokens, name, currencyCode, currencyNames } = asSafeDefaultGuiWallet(wallet)
        const name = wallet.name ?? ''
        const currencyCode = wallet.currencyInfo.currencyCode
        // const enabledTokens = []
        const currencyNames = {
          [currencyCode]: wallet.currencyInfo.displayName
        }

        // Initialize wallets
        if (checkFilterWallet({ name, currencyCode, currencyName: currencyNames[currencyCode] }, searchText, allowedCurrencyCodes, excludeCurrencyCodes)) {
          walletList.push({
            id: walletId,
            fullCurrencyCode: currencyCode,
            key: `${walletId}-${currencyCode}`,
            onPress: () => onPress(walletId, currencyCode)
          })
        }

        // TODO: fixme
        // Old logic on getting tokens
        // const enabledNotHiddenTokens = enabledTokens.filter(token => {
        //   let isVisible = true // assume we will enable token
        //   const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
        //   // if token is not supposed to be visible, not point in enabling it
        //   if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
        //   return isVisible
        // })

        // // Initialize tokens
        // for (const tokenCode of enabledNotHiddenTokens) {
        //   const fullCurrencyCode = `${currencyCode}-${tokenCode}`
        //   const customTokenInfo = currencyNames[tokenCode] ? undefined : customTokens.find(token => token.currencyCode === tokenCode)

        //   if (
        //     checkFilterWallet(
        //       { name, currencyCode: tokenCode, currencyName: customTokenInfo?.currencyName ?? currencyNames[tokenCode] ?? '' },
        //       searchText,
        //       allowedCurrencyCodes,
        //       excludeCurrencyCodes
        //     )
        //   ) {
        //     walletList.push({
        //       id: walletId,
        //       fullCurrencyCode,
        //       key: `${walletId}-${fullCurrencyCode}`,
        //       onPress: () => onPress(walletId, tokenCode)
        //     })
        //   }
        // }
      }
    }

    const sortedWalletlist = sortWalletList(walletList)

    if (showCreateWallet) {
      // Initialize Create Wallets
      const createWalletCurrencies = getCreateWalletTypes(account, filterActivation)
      for (const createWalletCurrency of createWalletCurrencies) {
        const { currencyCode, currencyName } = createWalletCurrency

        if (
          checkFilterWallet({ name: '', currencyCode, currencyName }, searchText, allowedCurrencyCodes, excludeCurrencyCodes) &&
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
      // const currencyInfos = getCurrencyInfos(account)
      // for (const currencyInfo of currencyInfos) {
      //   for (const metaToken of currencyInfo.metaTokens) {
      //     const { currencyCode, currencyName, contractAddress } = metaToken
      //     // Fix for when the token code and chain code are the same (like EOS/TLOS)
      //     if (currencyCode === currencyInfo.currencyCode) continue
      //     const fullCurrencyCode = `${currencyInfo.currencyCode}-${currencyCode}`

      //     if (
      //       checkFilterWallet({ name: '', currencyCode, currencyName }, searchText, allowedCurrencyCodes, excludeCurrencyCodes) &&
      //       !checkFromExistingWallets(walletList, currencyCode)
      //     ) {
      //       sortedWalletlist.push({
      //         id: null,
      //         fullCurrencyCode,
      //         key: fullCurrencyCode,
      //         createTokenType: {
      //           currencyCode,
      //           currencyName,
      //           ...getCurrencyIcon(currencyInfo.pluginId, contractAddress),
      //           parentCurrencyCode: currencyInfo.currencyCode
      //         }
      //       })
      //     }
      //   }
      // }
    }

    return sortedWalletlist
  }

  function renderRow(data: FlatListItem<WalletListItem>) {
    // Create Wallet/Token
    if (data.item.id == null) {
      const { createWalletType, createTokenType } = data.item
      return <WalletListCreateRow createWalletType={createWalletType} createTokenType={createTokenType} onPress={onPress} />
    }

    const walletId = data.item.id.replace(/:.*/, '')
    const edgeWallet = edgeWallets[walletId]

    if (edgeWallet == null) {
      if (isModal) {
        return <WalletListRow currencyCode="" walletName="" walletId={walletId} />
      }
      return <WalletListSwipeRow currencyCode="" isToken={false} walletId={walletId} />
    } else {
      const isToken = edgeWallet.currencyInfo.currencyCode !== data.item.fullCurrencyCode
      const walletCodesArray = data.item.fullCurrencyCode != null ? data.item.fullCurrencyCode.split('-') : []
      const currencyCode = isToken ? walletCodesArray[1] : walletCodesArray[0]

      if (isModal) {
        return <WalletListCurrencyRow currencyCode={currencyCode} onPress={data.item.onPress} walletId={walletId} paddingRem={0} />
      }

      return <WalletListSwipeRow currencyCode={currencyCode} isToken={isToken} openTutorial={data.index === 0 && showSlidingTutorial} walletId={walletId} />
    }
  }

  const renderRefreshControl = () => <RefreshControl refreshing={false} onRefresh={activateSearch} tintColor={theme.searchListRefreshControlIndicator} />

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
    />
  )
}
