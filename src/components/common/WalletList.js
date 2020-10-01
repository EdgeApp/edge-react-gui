// @flow

import * as React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import WalletListTokenRow from '../../connectors/WalletListTokenRowConnector.js'
import { SYNCED_ACCOUNT_DEFAULTS } from '../../modules/Core/Account/settings.js'
import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CustomTokenInfo, FlatListItem, GuiWallet } from '../../types/types.js'
import { getFiatSymbol } from '../../util/utils.js'
import { WalletListEmptyRow } from './WalletListEmptyRow.js'
import { WalletListRow } from './WalletListRow.js'

type WalletListItem = { id: string, fullCurrencyCode: string, balance: string }

type OwnProps = {
  header?: any,
  footer?: any
}

type StateProps = {
  activeWalletIds: string[],
  customTokens: CustomTokenInfo[],
  showBalance: boolean,
  wallets: { [walletId: string]: GuiWallet },
  walletsProgress: Object
}

type Props = OwnProps & StateProps

class WalletListComponent extends React.PureComponent<Props> {
  getWalletList(activeWalletIds: string[], wallets: { [walletId: string]: GuiWallet }): WalletListItem[] {
    const walletList = []

    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]
      const { enabledTokens, nativeBalances } = wallet
      const { customTokens } = this.props

      walletList.push({
        id: walletId,
        fullCurrencyCode: wallet.currencyCode,
        balance: nativeBalances[wallet.currencyCode]
      })

      // Old logic on getting tokens
      const enabledNotHiddenTokens = enabledTokens.filter(token => {
        let isVisible = true // assume we will enable token
        const tokenIndex = customTokens.findIndex(item => item.currencyCode === token)
        // if token is not supposed to be visible, not point in enabling it
        if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
        if (SYNCED_ACCOUNT_DEFAULTS[token] && enabledTokens.includes(token)) {
          // if hardcoded token
          isVisible = true // and enabled then make visible (overwrite customToken isVisible flag)
        }
        return isVisible
      })

      for (const currencyCode in nativeBalances) {
        if (nativeBalances.hasOwnProperty(currencyCode)) {
          if (currencyCode !== wallet.currencyCode && enabledNotHiddenTokens.indexOf(currencyCode) >= 0) {
            walletList.push({
              id: walletId,
              fullCurrencyCode: `${wallet.currencyCode}-${currencyCode}`,
              balance: nativeBalances[currencyCode]
            })
          }
        }
      }
    }

    return walletList
  }

  getWalletProgress(walletId: string): number {
    const walletProgress = this.props.walletsProgress[walletId]

    if (walletProgress === 1) {
      return 1
    }
    if (walletProgress < 0.1) {
      return 0.1
    }
    if (walletProgress > 0.95) {
      return 0.95
    }

    return walletProgress
  }

  render() {
    const { activeWalletIds, footer, header, wallets } = this.props
    const walletList = this.getWalletList(activeWalletIds, wallets)

    return <FlatList style={StyleSheet.absoltueFill} data={walletList} renderItem={this.renderRow} ListHeaderComponent={header} ListFooterComponent={footer} />
  }

  renderRow = (data: FlatListItem<WalletListItem>) => {
    const { showBalance, wallets } = this.props
    const walletId = data.item.id
    const guiWallet = wallets[walletId]
    const walletFiatSymbol = getFiatSymbol(guiWallet.isoFiatCurrencyCode)
    const walletProgress = this.getWalletProgress(walletId)

    if (guiWallet == null) {
      return <WalletListEmptyRow walletId={walletId} />
    }

    if (guiWallet.currencyCode === data.item.fullCurrencyCode) {
      return <WalletListRow guiWallet={guiWallet} showBalance={showBalance} walletProgress={walletProgress} />
    }

    const walletCodesArray = data.item.fullCurrencyCode.split('-')
    const tokenCode = walletCodesArray[1]

    return (
      <WalletListTokenRow
        parentId={walletId}
        currencyCode={tokenCode}
        key={tokenCode}
        walletFiatSymbol={walletFiatSymbol}
        balance={data.item.balance}
        showBalance={showBalance}
        progress={walletProgress}
      />
    )
  }
}

export const WalletList = connect((state: RootState): StateProps => {
  let activeWalletIds = getActiveWalletIds(state)

  // FIO disable changes below
  if (global.isFioDisabled) {
    const { currencyWallets = {} } = state.core.account
    activeWalletIds = activeWalletIds.filter(id => {
      const wallet = currencyWallets[id]
      return wallet == null || wallet.type !== 'wallet:fio'
    })
  }

  return {
    activeWalletIds,
    customTokens: state.ui.settings.customTokens,
    showBalance: state.ui.settings.isAccountBalanceVisible,
    wallets: state.ui.wallets.byId,
    walletsProgress: state.ui.wallets.walletLoadingProgress
  }
})(WalletListComponent)
