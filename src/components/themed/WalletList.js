// @flow

import { type EdgeCurrencyInfo, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, RefreshControl, SectionList } from 'react-native'

import { selectWallet } from '../../actions/WalletActions.js'
// import { useWhyDidYouUpdate } from '../../hooks/useWhyDidYouUpdate.js'
import s from '../../locales/strings'
import { getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { calculateFiatBalance } from '../../selectors/WalletSelectors.js'
import { useEffect, useMemo, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type Dispatch, type GetState } from '../../types/reduxTypes.js'
import {
  type CreateTokenType,
  type CreateWalletType,
  type CustomTokenInfo,
  type EdgeTokenIdExtended,
  type FlatListItem,
  type MostRecentWallet,
  asSafeDefaultGuiWallet
} from '../../types/types.js'
import { getCreateWalletTypes, getCurrencyInfos } from '../../util/CurrencyInfoHelpers.js'
import { getWalletFiat } from '../../util/CurrencyWalletHelpers.js'
import { checkCurrencyCodes, checkFilterWallet } from '../../util/utils.js'
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

const getMostRecentlyUsedWallets = (size: number, walletListItem: WalletListItem[], mostRecentWallets: MostRecentWallet[]): WalletListItem[] => {
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

const getSection = (walletList: WalletListItem[], walletListOnlyCount: number, mostRecentWallets: MostRecentWallet[]) => {
  const sections: Section[] = []

  let mostRecentWalletsCount = 0
  if (walletListOnlyCount > 4 && walletListOnlyCount < 11) {
    mostRecentWalletsCount = 2
  } else if (walletListOnlyCount > 10) {
    mostRecentWalletsCount = 3
  }

  sections.push({
    title: s.strings.wallet_list_modal_header_mru,
    data: getMostRecentlyUsedWallets(mostRecentWalletsCount, walletList, mostRecentWallets)
  })

  sections.push({
    title: s.strings.wallet_list_modal_header_all,
    data: walletList
  })

  return sections
}

type GetRowProps = {|
  handlePress: (walletId: string, currencyCode: string) => void,
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet },
  isModal?: boolean,
  showSlidingTutorial?: boolean
|}

const getWalletListRow =
  ({ handlePress, currencyWallets, isModal = false, showSlidingTutorial = false }: GetRowProps) =>
  (dispatch: Dispatch, getState: GetState) =>
  (data: FlatListItem<WalletListItem>) => {
    const state = getState()
    const id = data?.item?.id ?? ''
    const walletId = id.replace(/:.*/, '')
    const guiWalletLoading = state.ui.wallets.byId[walletId] == null
    const walletCurrencyCode = state.ui.wallets?.byId[walletId]?.currencyCode

    // Create Wallet/Token
    if (walletId === '') {
      const { createWalletType, createTokenType } = data.item
      return <WalletListCreateRow {...{ ...createWalletType, ...createTokenType }} onPress={handlePress} />
    }

    if (guiWalletLoading || currencyWallets[walletId] == null) {
      if (isModal) {
        return <WalletListRow currencyCode="" walletName="" />
      }
      return <WalletListSwipeRow currencyCode="" isToken={false} walletId={walletId} />
    } else {
      const isToken = walletCurrencyCode !== data.item.fullCurrencyCode
      const walletCodesArray = data.item.fullCurrencyCode != null ? data.item.fullCurrencyCode.split('-') : []
      const currencyCode = isToken ? walletCodesArray[1] : walletCodesArray[0]

      if (isModal) {
        return <WalletListCurrencyRow currencyCode={currencyCode} onPress={handlePress} walletId={walletId} paddingRem={0} />
      }

      return <WalletListSwipeRow currencyCode={currencyCode} isToken={isToken} openTutorial={data.index === 0 && showSlidingTutorial} walletId={walletId} />
    }
  }

const checkFromExistingWallets = (walletList: WalletListItem[], currencyCode: string): boolean => {
  return !!walletList.find((item: WalletListItem) => (item.fullCurrencyCode ? checkCurrencyCodes(item.fullCurrencyCode, currencyCode) : false))
}

type GetActiveWalletListProps = {|
  walletId: string,
  searching: boolean,
  excludeWalletIds?: string[],
  allowedCurrencyCodes?: string[] | EdgeTokenIdExtended[],
  excludeCurrencyCodes?: string[],
  searchText: string,
  customTokens: CustomTokenInfo[]
|}

const getWalletListItem =
  (props: GetActiveWalletListProps) =>
  (dispatch: Dispatch, getState: GetState): WalletListItem[] => {
    const { walletId, searching, excludeWalletIds, allowedCurrencyCodes, excludeCurrencyCodes, searchText, customTokens } = props
    const walletList = []
    const state = getState()

    const wallet = state.ui.wallets.byId[walletId || '']

    // Return empty list if excluded
    if (excludeWalletIds != null && excludeWalletIds.find(excludeWalletId => excludeWalletId === walletId)) return walletList

    // Initialize wallets that is still loading
    if (wallet == null && !searching) {
      walletList.push({ id: walletId, key: walletId })
    } else if (wallet != null) {
      const { enabledTokens, name, currencyCode, currencyNames } = asSafeDefaultGuiWallet(wallet)

      // Initialize wallets
      if (checkFilterWallet({ name, currencyCode, currencyName: currencyNames[currencyCode] }, searchText, allowedCurrencyCodes, excludeCurrencyCodes)) {
        walletList.push({ id: walletId, fullCurrencyCode: currencyCode, key: `${walletId}-${currencyCode}` })
      }

      // Old logic on getting tokens
      const enabledNotHiddenTokens = enabledTokens.filter(token => {
        let isVisible = true // assume we will enable token
        const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
        // if token is not supposed to be visible, not point in enabling it
        if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
        return isVisible
      })

      // Initialize tokens
      for (const tokenCode of enabledNotHiddenTokens) {
        const fullCurrencyCode = `${currencyCode}-${tokenCode}`
        const customTokenInfo = currencyNames[tokenCode] ? undefined : customTokens.find(token => token.currencyCode === tokenCode)

        if (
          checkFilterWallet(
            { name, currencyCode: tokenCode, currencyName: customTokenInfo?.currencyName ?? currencyNames[tokenCode] ?? '' },
            searchText,
            allowedCurrencyCodes,
            excludeCurrencyCodes
          )
        ) {
          walletList.push({ id: walletId, fullCurrencyCode, key: `${walletId}-${fullCurrencyCode}`, tokenCode })
        }
      }
    }

    return walletList
  }

const getFiatBalance =
  (wallet: EdgeCurrencyWallet, fullCurrencyCode: string) =>
  (dispatch: Dispatch, getState: GetState): number => {
    const currencyCode = getSortOptionsCurrencyCode(fullCurrencyCode)
    const exchangeDenomination = dispatch(getExchangeDenominationFromState(wallet.currencyInfo.pluginId, currencyCode))

    const { isoFiatCurrencyCode } = getWalletFiat(wallet)
    const rateKey = `${exchangeDenomination.name}_${isoFiatCurrencyCode}`
    const exchangeRate = getState().exchangeRates[rateKey]

    const fiatBalanceString = calculateFiatBalance(wallet, exchangeDenomination, { rateKey: exchangeRate })
    return parseFloat(fiatBalanceString)
  }

export const alphabeticalSort = (itemA: string, itemB: string) => (itemA < itemB ? -1 : itemA > itemB ? 1 : 0)

const getWalletLoadingStatus =
  (walletId?: string | null) =>
  (dispatch: Dispatch, getState: GetState): boolean =>
    walletId == null || getState().ui.wallets.byId[walletId] === undefined

const getWalletsLoadingStatus =
  (idA?: string | null, idB?: string | null) =>
  (dispatch: Dispatch, getState: GetState): boolean =>
    dispatch(getWalletLoadingStatus(idA)) || dispatch(getWalletLoadingStatus(idB))

const getCurrencyName = (itemA: WalletListItem, itemB: WalletListItem) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const currencyCodeA = getSortOptionsCurrencyCode(itemA.fullCurrencyCode || '')
  const currencyCodeB = getSortOptionsCurrencyCode(itemB.fullCurrencyCode || '')
  const currencyNameA = state.ui.wallets.byId[itemA.id || '']?.currencyNames[currencyCodeA]
  const currencyNameB = state.ui.wallets.byId[itemB.id || '']?.currencyNames[currencyCodeB]

  return { currencyNameA, currencyNameB }
}

type GetSortedWalletListProps = {|
  walletList: WalletListItem[],
  walletsSort: string,
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet }
|}

const sortWalletList =
  (props: GetSortedWalletListProps) =>
  (dispatch: Dispatch, getState: GetState): WalletListItem[] => {
    const { walletList, currencyWallets, walletsSort } = props

    if (walletsSort === 'name') {
      walletList.sort((itemA, itemB) => {
        if (getWalletsLoadingStatus(itemA.id, itemB.id)) return 0
        return alphabeticalSort(currencyWallets[itemA.id ?? ''].name ?? '', currencyWallets[itemB.id ?? ''].name ?? '')
      })
    }

    if (walletsSort === 'currencyCode') {
      walletList.sort((itemA, itemB) => {
        if (getWalletsLoadingStatus(itemA.id, itemB.id)) return 0
        return alphabeticalSort(getSortOptionsCurrencyCode(itemA.fullCurrencyCode || ''), getSortOptionsCurrencyCode(itemB.fullCurrencyCode || ''))
      })
    }

    if (walletsSort === 'currencyName') {
      walletList.sort((itemA, itemB) => {
        if (getWalletsLoadingStatus(itemA.id, itemB.id)) return 0
        const { currencyNameA, currencyNameB } = dispatch(getCurrencyName(itemA, itemB))
        return alphabeticalSort(currencyNameA, currencyNameB)
      })
    }

    if (walletsSort === 'highest') {
      walletList.sort((itemA, itemB) => {
        if (getWalletsLoadingStatus(itemA.id, itemB.id)) return 0
        return (
          dispatch(getFiatBalance(currencyWallets[itemB.id ?? ''], itemB.fullCurrencyCode || '')) -
          dispatch(getFiatBalance(currencyWallets[itemA.id ?? ''], itemA.fullCurrencyCode || ''))
        )
      })
    }

    if (walletsSort === 'lowest') {
      walletList.sort((itemA, itemB) => {
        if (getWalletsLoadingStatus(itemA.id, itemB.id)) return 0
        return (
          dispatch(getFiatBalance(currencyWallets[itemA.id ?? ''], itemA.fullCurrencyCode || '')) -
          dispatch(getFiatBalance(currencyWallets[itemB.id ?? ''], itemB.fullCurrencyCode || ''))
        )
      })
    }

    return walletList
  }

type GetCreateWalletListProps = {|
  currencyInfos: EdgeCurrencyInfo[],
  createWalletCurrencies: CreateWalletType[],
  walletList: WalletListItem[],
  allowedCurrencyCodes?: string[] | EdgeTokenIdExtended[],
  excludeCurrencyCodes?: string[],
  searchText: string
|}

const getCreateWalletList = (props: GetCreateWalletListProps): WalletListItem[] => {
  const { walletList, createWalletCurrencies, currencyInfos, searchText, allowedCurrencyCodes, excludeCurrencyCodes } = props
  const createWalletList = []
  for (const createWalletCurrency of createWalletCurrencies) {
    const { currencyCode, currencyName } = createWalletCurrency

    if (
      checkFilterWallet({ name: '', currencyCode, currencyName }, searchText, allowedCurrencyCodes, excludeCurrencyCodes) &&
      !checkFromExistingWallets(walletList, currencyCode)
    ) {
      createWalletList.push({
        id: null,
        fullCurrencyCode: currencyCode,
        key: currencyCode,
        createWalletType: createWalletCurrency
      })
    }
  }

  // Initialize Create Tokens
  for (const currencyInfo of currencyInfos) {
    for (const metaToken of currencyInfo.metaTokens) {
      const { currencyCode, currencyName } = metaToken
      // Fix for when the token code and chain code are the same (like EOS/TLOS)
      if (currencyCode === currencyInfo.currencyCode) continue
      const fullCurrencyCode = `${currencyInfo.currencyCode}-${currencyCode}`

      if (
        checkFilterWallet({ name: '', currencyCode, currencyName }, searchText, allowedCurrencyCodes, excludeCurrencyCodes) &&
        !checkFromExistingWallets(walletList, currencyCode)
      ) {
        createWalletList.push({
          id: null,
          fullCurrencyCode,
          key: fullCurrencyCode,
          createTokenType: {
            currencyCode,
            currencyName,
            parentCurrencyCode: currencyInfo.currencyCode
          }
        })
      }
    }
  }

  return createWalletList
}

const renderSectionHeader = (section: { section: Section }) => <WalletListSectionHeader title={section.section.title} />

type Props = {
  header?: React.Node,
  footer?: React.Node,
  searching: boolean,
  searchText: string,
  showCreateWallet?: boolean,
  excludeWalletIds?: string[],
  allowedCurrencyCodes?: string[] | EdgeTokenIdExtended[],
  excludeCurrencyCodes?: string[],
  activateSearch?: () => void,
  showSlidingTutorial?: boolean,
  filterActivation?: boolean,
  isModal?: boolean,
  onPress?: (walletId: string, currencyCode: string) => void
}

export function WalletList(props: Props) {
  // useWhyDidYouUpdate('WalletList', props)
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
    onPress
  } = props

  const theme = useTheme()
  const handlePress = useMemo(
    () =>
      onPress ??
      ((walletId: string, currencyCode: string) => {
        dispatch(selectWallet(walletId, currencyCode))
      }),
    [dispatch, onPress]
  )
  const account = useSelector(state => state.core.account)
  const customTokens = useSelector(state => state.ui.settings.customTokens)
  const mostRecentWallets = useSelector(state => state.ui.settings.mostRecentWallets)
  const walletsSort = useSelector(state => state.ui.settings.walletsSort)

  const { currencyWallets } = account

  const [activeWalletIds, setActiveWalletIds] = useState(account.activeWalletIds)
  const [walletList, setWalletList] = useState([])
  const [sections, setSections] = useState([])
  const [isSectionList, setIsSectionList] = useState(false)

  // Subscribe to the wallet list:
  useEffect(() => account.watch('activeWalletIds', setActiveWalletIds), [account])
  useEffect(() => {
    const activeWalletList = []
    for (const walletId of activeWalletIds) {
      const walletItem = dispatch(
        getWalletListItem({ walletId, searching, excludeWalletIds, allowedCurrencyCodes, excludeCurrencyCodes, searchText, customTokens })
      )
      activeWalletList.push(...walletItem)
    }

    const walletList = dispatch(sortWalletList({ walletList: activeWalletList, walletsSort, currencyWallets }))

    if (showCreateWallet) {
      const createWalletCurrencies = getCreateWalletTypes(account, filterActivation)
      const currencyInfos = getCurrencyInfos(account)
      const createWalletList = getCreateWalletList({
        currencyInfos,
        createWalletCurrencies,
        walletList,
        allowedCurrencyCodes,
        excludeCurrencyCodes,
        searchText
      })
      walletList.push(...createWalletList)
    }

    let isSectionList = false
    let walletOnlyList = []
    if (isModal && !searching && searchText.length === 0 && mostRecentWallets.length > 1) {
      walletOnlyList = walletList.filter(item => item.id)
      if (walletOnlyList.length > 4) {
        isSectionList = true
      }
    }

    setIsSectionList(isSectionList)
    setWalletList(walletList)
    setSections(getSection(walletList, walletOnlyList.length, mostRecentWallets))
  }, [
    account,
    activeWalletIds,
    allowedCurrencyCodes,
    currencyWallets,
    customTokens,
    dispatch,
    excludeCurrencyCodes,
    excludeWalletIds,
    filterActivation,
    isModal,
    mostRecentWallets,
    searchText,
    searching,
    showCreateWallet,
    walletsSort
  ])

  const contentOffset = useMemo(() => ({ x: 0, y: !searching && !isModal ? theme.rem(4.5) : 0 }), [isModal, searching, theme])

  const refreshControl = useMemo(
    () => (isModal ? undefined : <RefreshControl refreshing={false} onRefresh={activateSearch} tintColor={theme.searchListRefreshControlIndicator} />),
    [activateSearch, isModal, theme.searchListRefreshControlIndicator]
  )

  const renderRow = useMemo(
    () => dispatch(getWalletListRow({ handlePress, currencyWallets, isModal, showSlidingTutorial })),
    [currencyWallets, dispatch, handlePress, isModal, showSlidingTutorial]
  )

  if (isSectionList) {
    return (
      <SectionList
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        renderItem={renderRow}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
      />
    )
  }

  return (
    <FlatList
      contentOffset={contentOffset}
      data={walletList}
      keyboardShouldPersistTaps="handled"
      ListFooterComponent={footer}
      ListHeaderComponent={header}
      refreshControl={refreshControl}
      renderItem={renderRow}
    />
  )
}
