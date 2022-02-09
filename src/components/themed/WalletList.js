// @flow

import { type EdgeAccount, type EdgeCurrencyWallet, type EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { RefreshControl } from 'react-native'
import { SwipeListView, SwipeRow } from 'react-native-swipe-list-view'

import { selectWallet } from '../../actions/WalletActions.js'
import s from '../../locales/strings'
import { getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { calculateFiatBalance } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import type { CreateTokenType, CreateWalletType, CustomTokenInfo, EdgeTokenId, FlatListItem, MostRecentWallet } from '../../types/types.js'
import { asSafeDefaultGuiWallet } from '../../types/types.js'
import { getCreateWalletTypes, getCurrencyIcon, getCurrencyInfos } from '../../util/CurrencyInfoHelpers.js'
import { getCurrencyNames, getWalletName } from '../../util/CurrencyWalletHelpers.js'
import { type FilterDetailsType, alphabeticalSort, checkCurrencyCodes, checkFilterWallet } from '../../util/utils'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { type SortOption } from '../modals/WalletListSortModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { WalletListCreateRow } from './WalletListCreateRow.js'
import { WalletListCurrencyRow } from './WalletListCurrencyRow.js'
import { WalletListEmptyRow } from './WalletListEmptyRow.js'
import { WalletListSectionHeader } from './WalletListSectionHeader.js'
import { WalletListSwipeRow } from './WalletListSwipeRow.js'

type WalletListItem = {
  id: string | null,
  fullCurrencyCode?: string,
  key: string,
  createWalletType?: CreateWalletType,
  createTokenType?: CreateTokenType,
  onPress?: () => void,
  onLongPress?: (walletId: string) => void
}

type Section = {
  title: string,
  data: WalletListItem[]
}

const getSortOptionsCurrencyCode = (fullCurrencyCode: string): string => {
  const splittedCurrencyCode = fullCurrencyCode.split('-')
  return splittedCurrencyCode[1] || splittedCurrencyCode[0]
}

type OwnProps = {
  header?: React.Node,
  footer?: React.Node,
  searching: boolean,
  searchText: string,
  showCreateWallet?: boolean,
  excludeWalletIds?: string[],
  allowedCurrencyCodes?: string[],
  allowedTokenIds?: EdgeTokenId[],
  excludeCurrencyCodes?: string[],
  activateSearch?: () => void,
  showSlidingTutorial?: boolean,
  filterActivation?: boolean,
  isModal?: boolean,
  onPress?: (walletId: string, currencyCode: string) => void
}

type StateProps = {
  activeWalletIds: string[],
  account: EdgeAccount,
  customTokens: CustomTokenInfo[],
  exchangeRates: { [string]: string },
  mostRecentWallets: MostRecentWallet[],
  walletsSort: SortOption,
  enabledTokensByWalletId: { [walletId: string]: string[] },
  wallets: { [walletId: string]: EdgeCurrencyWallet }
}

type DispatchProps = {
  getExchangeDenomination: (pluginId: string, currencyCode: string) => EdgeDenomination,
  selectWallet: (walletId: string, currencyCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class WalletListComponent extends React.PureComponent<Props> {
  sortWalletList(walletList: WalletListItem[]): WalletListItem[] {
    const getFiatBalance = (wallet: EdgeCurrencyWallet, fullCurrencyCode: string): number => {
      const { exchangeRates, getExchangeDenomination } = this.props
      const currencyCode = getSortOptionsCurrencyCode(fullCurrencyCode)
      const exchangeDenomination = getExchangeDenomination(wallet.currencyInfo.pluginId, currencyCode)
      const fiatBalanceString = calculateFiatBalance(wallet, exchangeDenomination, exchangeRates)
      return parseFloat(fiatBalanceString)
    }

    if (this.props.walletsSort === 'name') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        // $FlowFixMe
        return alphabeticalSort(getWalletName(wallets[itemA.id]), getWalletName(wallets[itemB.id]))
      })
    }

    if (this.props.walletsSort === 'currencyCode') {
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null) return 0
        return alphabeticalSort(getSortOptionsCurrencyCode(itemA.fullCurrencyCode || ''), getSortOptionsCurrencyCode(itemB.fullCurrencyCode || ''))
      })
    }

    if (this.props.walletsSort === 'currencyName') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        // $FlowFixMe
        const currencyNameA = getCurrencyNames(wallets[itemA.id])[getSortOptionsCurrencyCode(itemA.fullCurrencyCode || '')]
        // $FlowFixMe
        const currencyNameB = getCurrencyNames(wallets[itemB.id])[getSortOptionsCurrencyCode(itemB.fullCurrencyCode || '')]
        return alphabeticalSort(currencyNameA, currencyNameB)
      })
    }

    if (this.props.walletsSort === 'highest') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        return getFiatBalance(wallets[itemB.id ?? ''], itemB.fullCurrencyCode || '') - getFiatBalance(wallets[itemA.id ?? ''], itemA.fullCurrencyCode || '')
      })
    }

    if (this.props.walletsSort === 'lowest') {
      const { wallets } = this.props
      walletList.sort((itemA, itemB) => {
        if (itemA.id == null || itemB.id == null || wallets[itemA.id] === undefined || wallets[itemB.id] === undefined) return 0
        return getFiatBalance(wallets[itemA.id ?? ''], itemA.fullCurrencyCode || '') - getFiatBalance(wallets[itemB.id ?? ''], itemB.fullCurrencyCode || '')
      })
    }
    return walletList
  }

  checkFromExistingWallets(walletList: WalletListItem[], currencyCode: string): boolean {
    return !!walletList.find((item: WalletListItem) => (item.fullCurrencyCode ? checkCurrencyCodes(item.fullCurrencyCode, currencyCode) : false))
  }

  checkFilterWallet(details: FilterDetailsType): boolean {
    const { allowedCurrencyCodes, excludeCurrencyCodes, searchText } = this.props
    return checkFilterWallet(details, searchText, allowedCurrencyCodes, excludeCurrencyCodes)
  }

  getWalletList(): WalletListItem[] {
    const { activeWalletIds, account, excludeWalletIds, isModal, searching, showCreateWallet, wallets, filterActivation, allowedTokenIds } = this.props
    const walletList = []

    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]

      if (excludeWalletIds && excludeWalletIds.length > 0 && excludeWalletIds.find(excludeWalletId => excludeWalletId === walletId)) continue // Skip if excluded

      if (wallet == null && !searching) {
        // Initialize wallets that is still loading
        walletList.push({
          id: walletId,
          key: walletId,
          onLongPress: !isModal
            ? () => {
                Airship.show(bridge => <WalletListMenuModal bridge={bridge} walletId={walletId} />)
              }
            : () => {}
        })
      }

      if (wallet == null) continue

      const { customTokens, enabledTokensByWalletId } = this.props
      const enabledTokens = enabledTokensByWalletId[wallet.id] ?? []
      const enabledNotHiddenTokens = enabledTokens.filter(token => {
        let isVisible = true // assume we will enable token
        const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
        // if token is not supposed to be visible, not point in enabling it
        if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
        return isVisible
      })

      if (allowedTokenIds != null) {
        // New logic for EdgeTokenId array
        const {
          currencyInfo: { currencyCode: walletCurrencyCode, pluginId: walletPluginId }
        } = wallet

        for (const tokenId of allowedTokenIds) {
          const { pluginId, currencyCode } = tokenId
          if (walletPluginId !== pluginId) continue

          // Check mainnet currency code
          if (walletCurrencyCode === currencyCode || currencyCode == null) {
            walletList.push({
              id: walletId,
              fullCurrencyCode: walletCurrencyCode,
              key: `${walletId}-${walletCurrencyCode}`,
              onPress: () =>
                this.props.onPress != null ? this.props.onPress(walletId, walletCurrencyCode) : this.props.selectWallet(walletId, walletCurrencyCode)
            })
            continue
          }

          // Check tokens
          for (const tokenCode of enabledNotHiddenTokens) {
            if (currencyCode == null || tokenCode !== currencyCode) continue
            const fullCurrencyCode = `${walletCurrencyCode}-${currencyCode}`
            walletList.push({
              id: walletId,
              fullCurrencyCode: fullCurrencyCode,
              key: `${walletId}-${fullCurrencyCode}`,
              onPress: () => (this.props.onPress != null ? this.props.onPress(walletId, tokenCode) : this.props.selectWallet(walletId, tokenCode))
            })
          }
        }
        continue
      }
      // Old logic for currency code array
      const {
        currencyInfo: { currencyCode }
      } = wallet
      const name = getWalletName(wallet)
      const currencyNames = getCurrencyNames(wallet)

      // Initialize wallets
      if (this.checkFilterWallet({ name, currencyCode, currencyName: currencyNames[currencyCode] })) {
        walletList.push({
          id: walletId,
          fullCurrencyCode: currencyCode,
          key: `${walletId}-${currencyCode}`,
          onPress: () => (this.props.onPress != null ? this.props.onPress(walletId, currencyCode) : this.props.selectWallet(walletId, currencyCode))
        })
      }

      // Initialize tokens
      for (const tokenCode of enabledNotHiddenTokens) {
        const fullCurrencyCode = `${currencyCode}-${tokenCode}`
        const customTokenInfo = currencyNames[tokenCode] ? undefined : customTokens.find(token => token.currencyCode === tokenCode)

        if (this.checkFilterWallet({ name, currencyCode: fullCurrencyCode, currencyName: customTokenInfo?.currencyName ?? currencyNames[tokenCode] ?? '' })) {
          walletList.push({
            id: walletId,
            fullCurrencyCode: fullCurrencyCode,
            key: `${walletId}-${fullCurrencyCode}`,
            onPress: () => (this.props.onPress != null ? this.props.onPress(walletId, tokenCode) : this.props.selectWallet(walletId, tokenCode))
          })
        }
      }
    }

    const sortedWalletlist = this.sortWalletList(walletList)

    if (showCreateWallet) {
      // Initialize Create Wallets
      const createWalletCurrencies = getCreateWalletTypes(account, filterActivation)
      for (const createWalletCurrency of createWalletCurrencies) {
        const { currencyCode, currencyName, walletType } = createWalletCurrency

        const newWallet = {
          id: null,
          fullCurrencyCode: currencyCode,
          key: currencyCode,
          createWalletType: createWalletCurrency
        }

        if (allowedTokenIds != null) {
          // Add create wallet row if we haven't already added an existing wallet to the wallet list
          const pluginId = walletType.split(':')[0]
          if (
            allowedTokenIds.find(tokenInfo => tokenInfo.pluginId === pluginId && (tokenInfo.currencyCode === currencyCode || tokenInfo.currencyCode == null)) !=
              null &&
            sortedWalletlist.find(tokenInfo => tokenInfo.fullCurrencyCode === newWallet.fullCurrencyCode) == null
          ) {
            sortedWalletlist.push(newWallet)
          }
          continue
        }

        if (this.checkFilterWallet({ name: '', currencyCode, currencyName }) && !this.checkFromExistingWallets(walletList, currencyCode)) {
          sortedWalletlist.push(newWallet)
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

          const newToken = {
            id: null,
            fullCurrencyCode,
            key: fullCurrencyCode,
            createTokenType: {
              currencyCode,
              currencyName,
              ...getCurrencyIcon(currencyInfo.currencyCode, currencyCode),
              parentCurrencyCode: currencyInfo.currencyCode
            }
          }

          if (allowedTokenIds != null) {
            // Add create token row if we haven't already added an existing enabled token to the wallet list
            if (
              allowedTokenIds.find(tokenInfo => tokenInfo.pluginId === pluginId && tokenInfo.currencyCode === currencyCode) != null &&
              sortedWalletlist.find(tokenInfo => tokenInfo.fullCurrencyCode === newToken.fullCurrencyCode) == null
            ) {
              sortedWalletlist.push(newToken)
            }
            continue
          }

          if (this.checkFilterWallet({ name: '', currencyCode: fullCurrencyCode, currencyName }) && !this.checkFromExistingWallets(walletList, currencyCode)) {
            sortedWalletlist.push(newToken)
          }
        }
      }
    }

    return sortedWalletlist
  }

  renderRow = (data: FlatListItem<WalletListItem>, rowMap: { [string]: SwipeRow }) => {
    const { isModal, onPress, selectWallet, showSlidingTutorial, wallets, account } = this.props

    // Create Wallet/Token
    if (data.item.id == null) {
      const { createWalletType, createTokenType } = data.item
      return <WalletListCreateRow createWalletType={createWalletType} createTokenType={createTokenType} onPress={onPress ?? selectWallet} />
    }

    const walletId = data.item.id.replace(/:.*/, '')
    const wallet = wallets[walletId]

    if (wallet == null || account.currencyWallets[walletId] == null) {
      const { key, onLongPress } = data.item
      return <WalletListEmptyRow gradient={!isModal} onLongPress={onLongPress} walletId={walletId} swipeRow={rowMap[key]} />
    } else {
      const isToken = wallet.currencyInfo.currencyCode !== data.item.fullCurrencyCode
      const walletCodesArray = data.item.fullCurrencyCode != null ? data.item.fullCurrencyCode.split('-') : []
      const currencyCode = isToken ? walletCodesArray[1] : walletCodesArray[0]

      if (isModal) {
        return <WalletListCurrencyRow currencyCode={currencyCode} onPress={data.item.onPress} walletId={walletId} paddingRem={0} />
      }

      return (
        <WalletListSwipeRow
          currencyCode={currencyCode}
          wallet={wallet}
          isToken={isToken}
          openRowLeft={data.index === 0 && showSlidingTutorial}
          selectWallet={this.props.selectWallet}
          swipeRow={rowMap[data.item.key]}
        />
      )
    }
  }

  renderRefreshControl = () => (
    <RefreshControl refreshing={false} onRefresh={this.props.activateSearch} tintColor={this.props.theme.searchListRefreshControlIndicator} />
  )

  renderSectionHeader = (section: { section: Section }) => <WalletListSectionHeader title={section.section.title} />

  getMostRecentlyUsedWallets(size: number, walletListItem: WalletListItem[]): WalletListItem[] {
    const { mostRecentWallets } = this.props
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

  getSection = (walletList: WalletListItem[], walletListOnlyCount: number) => {
    const sections: Section[] = []

    let mostRecentWalletsCount = 0
    if (walletListOnlyCount > 4 && walletListOnlyCount < 11) {
      mostRecentWalletsCount = 2
    } else if (walletListOnlyCount > 10) {
      mostRecentWalletsCount = 3
    }

    sections.push({
      title: s.strings.wallet_list_modal_header_mru,
      data: this.getMostRecentlyUsedWallets(mostRecentWalletsCount, walletList)
    })

    sections.push({
      title: s.strings.wallet_list_modal_header_all,
      data: walletList
    })

    return sections
  }

  render() {
    const { footer, header, isModal, mostRecentWallets, searchText, searching } = this.props
    const walletList = this.getWalletList()

    let isSectionList = false
    let walletOnlyList = []
    if (isModal && !searching && searchText.length === 0 && mostRecentWallets.length > 1) {
      walletOnlyList = walletList.filter(item => item.id)
      if (walletOnlyList.length > 4) {
        isSectionList = true
      }
    }

    return (
      <SwipeListView
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        data={!isSectionList ? walletList : undefined}
        sections={isSectionList ? this.getSection(walletList, walletOnlyList.length) : undefined}
        renderSectionHeader={isSectionList ? this.renderSectionHeader : undefined}
        renderItem={this.renderRow}
        refreshControl={!isModal && !isSectionList ? this.renderRefreshControl() : undefined}
        contentOffset={{ y: !searching && !isModal && !isSectionList ? this.props.theme.rem(4.5) : 0 }}
        keyboardShouldPersistTaps="handled"
        useSectionList={isSectionList === true}
        useFlatList={isSectionList === false}
      />
    )
  }
}

export const WalletList = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    let { activeWalletIds } = state.ui.wallets

    // FIO disable changes below
    if (global.isFioDisabled) {
      const { currencyWallets } = state.core.account
      activeWalletIds = activeWalletIds.filter(id => {
        const wallet = currencyWallets[id]
        return wallet == null || wallet.type !== 'wallet:fio'
      })
    }

    return {
      activeWalletIds,
      account: state.core.account,
      customTokens: state.ui.settings.customTokens,
      exchangeRates: state.exchangeRates,
      mostRecentWallets: state.ui.settings.mostRecentWallets,
      walletsSort: state.ui.settings.walletsSort,
      enabledTokensByWalletId: activeWalletIds.reduce((map, id) => {
        map[id] = asSafeDefaultGuiWallet(state.ui.wallets.byId[id]).enabledTokens
        return map
      }, {}),
      wallets: state.core.account.currencyWallets
    }
  },
  dispatch => ({
    getExchangeDenomination(pluginId: string, currencyCode: string) {
      return dispatch(getExchangeDenominationFromState(pluginId, currencyCode))
    },
    selectWallet(walletId: string, currencyCode) {
      dispatch(selectWallet(walletId, currencyCode, true))
    }
  })
)(withTheme(WalletListComponent))
