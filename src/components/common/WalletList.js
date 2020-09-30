// @flow

import * as React from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import { type FlatListItem, type GuiWallet } from '../../types/types.js'
import { WalletListEmptyRow } from './WalletListEmptyRow.js'
import { WalletListRow } from './WalletListRow.js'

type OwnProps = {
  header?: any,
  footer?: any
}

type StateProps = {
  showBalace: boolean,
  activeWalletIds: string[],
  wallets: { [walletId: string]: GuiWallet }
}

type Props = OwnProps & StateProps

class WalletListComponent extends React.Component<Props> {
  render() {
    const { footer, header, wallets, activeWalletIds } = this.props

    return (
      <FlatList
        style={StyleSheet.absoltueFill}
        data={activeWalletIds.map(key => ({ key }))}
        extraData={wallets}
        renderItem={this.renderRow}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
      />
    )
  }

  renderRow = (data: FlatListItem<{ key: string }>) => {
    const { showBalace, wallets } = this.props
    const guiWallet = wallets[data.item.key]

    return guiWallet != null ? <WalletListRow guiWallet={guiWallet} showBalance={showBalace} /> : <WalletListEmptyRow walletId={data.item.key} />
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
    showBalace: state.ui.settings.isAccountBalanceVisible,
    wallets: state.ui.wallets.byId
  }
})(WalletListComponent)
