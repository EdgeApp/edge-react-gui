// @flow

import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { FlatList, RefreshControl } from 'react-native'

import { selectWallet } from '../../actions/WalletActions.js'
import { calculateFiatBalance } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import type { CustomTokenInfo, FlatListItem, GuiWallet, MostRecentWallet } from '../../types/types.js'
import { getCreateWalletTypes, getCurrencyIcon, getCurrencyInfos } from '../../util/CurrencyInfoHelpers.js'
import { type FilterDetailsType, checkCurrencyCodes, checkFilterWallet } from '../../util/utils'
import { type SortOption } from '../modals/WalletListSortModal.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { type WalletListCreateRowProps, WalletListCreateRow } from './WalletListCreateRow.js'
import { WalletListSectionHeader } from './WalletListSectionHeader.js'
import { WalletListSwipeRow } from './WalletListSwipeRow.js'

type WalletListItem = {
  id: string | null,
  fullCurrencyCode?: string,
  key: string,
  createRow?: $Shape<WalletListCreateRowProps>
}

type Section = {
  title: string,
  data: WalletListItem[]
}

type OwnProps = {
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
  onPress?: (walletId: string, currencyCode: string) => void
}

type StateProps = {
  activeWalletIds: string[],
  account: EdgeAccount,
  customTokens: CustomTokenInfo[],
  exchangeRates: { [string]: string },
  mostRecentWallets: MostRecentWallet[],
  walletsSort: SortOption,
  wallets: { [walletId: string]: GuiWallet }
}

type DispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

type GetValues = { [type: string]: (item: WalletListItem, wallet: EdgeCurrencyWallet, exchangeRates: { [string]: string }) => string | number }

const getValues: GetValues = {
  name: (_, wallet) => wallet?.name ?? '',
  currencyCode: ({ fullCurrencyCode }, wallet) => {
    const [currencyCode, tokenCode] = (fullCurrencyCode ?? wallet.currencyInfo.currencyCode).split('-')
    return tokenCode ?? currencyCode
  },
  currencyName: (_, wallet) => wallet?.currencyInfo?.displayName ?? '',
  highest: ({ fullCurrencyCode }, wallet, exchangeRates) =>
    -1 * parseFloat(calculateFiatBalance(wallet, fullCurrencyCode ?? wallet.currencyInfo.currencyCode, exchangeRates)),
  lowest: ({ fullCurrencyCode }, wallet, exchangeRates) =>
    parseFloat(calculateFiatBalance(wallet, fullCurrencyCode ?? wallet.currencyInfo.currencyCode, exchangeRates))
}

type SortParams = {
  exchangeRates: { [string]: string },
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet },
  walletsSort: string
}
type SortByWallets = (params: SortParams) => (walletList: WalletListItem[]) => WalletListItem[]

export const createWalletListSort: SortByWallets = ({ currencyWallets, walletsSort, exchangeRates }) => {
  const getValue = item => {
    const wallet = currencyWallets[item.id ?? '']
    if (wallet == null) return 0
    return getValues[walletsSort](item, wallet, exchangeRates)
  }

  return walletList =>
    walletList.sort((itemA, itemB) => {
      const nameA = (getValue(itemA): any)
      const nameB = (getValue(itemB): any)
      return nameA < nameB ? -1 : nameA > nameB ? 1 : 0
    })
}

class WalletListComponent extends React.PureComponent<Props> {
  checkFromExistingWallets(walletList: WalletListItem[], currencyCode: string): boolean {
    return !!walletList.find((item: WalletListItem) => (item.fullCurrencyCode ? checkCurrencyCodes(item.fullCurrencyCode, currencyCode) : false))
  }

  checkFilterWallet(details: FilterDetailsType): boolean {
    const { allowedCurrencyCodes, excludeCurrencyCodes, searchText } = this.props
    return checkFilterWallet(details, searchText, allowedCurrencyCodes, excludeCurrencyCodes)
  }

  getWalletList(): WalletListItem[] {
    const { activeWalletIds, account, excludeWalletIds, walletsSort, exchangeRates, searching, showCreateWallet, wallets, filterActivation } = this.props
    const walletList = []
    const { currencyWallets } = account
    const sortWalletList = getValues[walletsSort] != null ? createWalletListSort({ walletsSort, currencyWallets, exchangeRates }) : a => a

    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]

      if (excludeWalletIds && excludeWalletIds.length > 0 && excludeWalletIds.find(excludeWalletId => excludeWalletId === walletId)) continue // Skip if excluded

      if (wallet == null && !searching) {
        // Initialize wallets that is still loading
        walletList.push({
          id: walletId,
          key: walletId
        })
      } else if (wallet != null) {
        const { enabledTokens = [], name = '', currencyCode = '', currencyNames = {} } = wallet ?? {}
        const { customTokens } = this.props

        // Initialize wallets
        if (this.checkFilterWallet({ name, currencyCode, currencyName: currencyNames[currencyCode] })) {
          walletList.push({
            id: walletId,
            fullCurrencyCode: currencyCode,
            key: `${walletId}-${currencyCode}`
          })
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

          if (this.checkFilterWallet({ name, currencyCode: tokenCode, currencyName: customTokenInfo?.currencyName ?? currencyNames[tokenCode] ?? '' })) {
            walletList.push({
              id: walletId,
              fullCurrencyCode,
              key: `${walletId}-${fullCurrencyCode}`
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
        const { currencyCode, currencyName } = createWalletCurrency

        if (this.checkFilterWallet({ name: '', currencyCode, currencyName }) && !this.checkFromExistingWallets(walletList, currencyCode)) {
          sortedWalletlist.push({
            id: null,
            fullCurrencyCode: currencyCode,
            key: currencyCode,
            createRow: createWalletCurrency
          })
        }
      }

      // Initialize Create Tokens
      const currencyInfos = getCurrencyInfos(account)
      for (const currencyInfo of currencyInfos) {
        for (const metaToken of currencyInfo.metaTokens) {
          const { currencyCode, currencyName, contractAddress } = metaToken
          // Fix for when the token code and chain code are the same (like EOS/TLOS)
          if (currencyCode === currencyInfo.currencyCode) continue
          const fullCurrencyCode = `${currencyInfo.currencyCode}-${currencyCode}`

          if (this.checkFilterWallet({ name: '', currencyCode, currencyName }) && !this.checkFromExistingWallets(walletList, currencyCode)) {
            sortedWalletlist.push({
              id: null,
              fullCurrencyCode,
              key: fullCurrencyCode,
              createRow: {
                currencyCode,
                currencyName,
                ...getCurrencyIcon(currencyInfo.pluginId, contractAddress),
                parentCurrencyCode: currencyInfo.currencyCode
              }
            })
          }
        }
      }
    }

    return sortedWalletlist
  }

  renderRow = (data: FlatListItem<WalletListItem>) => {
    const { showSlidingTutorial, wallets, account } = this.props
    const { id, createRow, fullCurrencyCode } = data.item
    // Create Wallet/Token
    if (id == null) return <WalletListCreateRow {...createRow} />

    const walletId = id.replace(/:.*/, '')
    const guiWallet = wallets[walletId]

    if (guiWallet == null || account.currencyWallets[walletId] == null) {
      return <WalletListSwipeRow currencyCode="" isToken={false} walletId={walletId} />
    }

    const isToken = guiWallet.currencyCode !== fullCurrencyCode
    const walletCodesArray = fullCurrencyCode != null ? fullCurrencyCode.split('-') : []
    const currencyCode = isToken ? walletCodesArray[1] : walletCodesArray[0]

    return <WalletListSwipeRow currencyCode={currencyCode} isToken={isToken} openTutorial={data.index === 0 && showSlidingTutorial} walletId={walletId} />
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

  render() {
    const { footer, header, searching, theme } = this.props
    const walletList = this.getWalletList()

    return (
      <FlatList
        contentOffset={{ x: 0, y: !searching ? theme.rem(4.5) : 0 }}
        data={walletList}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={footer}
        ListHeaderComponent={header}
        refreshControl={this.renderRefreshControl()}
        renderItem={this.renderRow}
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
      wallets: state.ui.wallets.byId
    }
  },
  dispatch => ({
    selectWallet(walletId: string, currencyCode) {
      dispatch(selectWallet(walletId, currencyCode, true))
    }
  })
)(withTheme(WalletListComponent))
