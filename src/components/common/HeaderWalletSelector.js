// @flow

import React, { Component } from 'react'

import s from '../../locales/strings.js'
import WalletSelector from '../../modules/UI/components/Header/Component/WalletSelectorConnector'
import type { State } from '../../types/reduxTypes.js'
import type { GuiWallet } from '../../types/types.js'
import { WalletListModal } from '../modals/WalletListModal.js'
import { Airship } from '../services/AirshipInstance.js'

export type StateProps = {
  activeWalletIds: Array<string>,
  wallets: { [string]: GuiWallet },
  state: State
}

export type DispatchProps = {
  onSelectWallet(string, string): void
}

type Props = StateProps & DispatchProps

class HeaderWalletSelector extends Component<Props> {
  onPress = () => {
    const { wallets, activeWalletIds } = this.props
    const allowedWallets = []
    for (const id in wallets) {
      const wallet = wallets[id]
      if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
        allowedWallets.push(wallets[id])
      }
    }
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        wallets={allowedWallets}
        activeWalletIds={activeWalletIds}
        existingWalletToFilterId={''}
        existingWalletToFilterCurrencyCode={''}
        supportedWalletTypes={[]}
        excludedCurrencyCode={[]}
        showWalletCreators={false}
        state={this.props.state}
        headerTitle={s.strings.select_wallet}
        excludedTokens={[]}
        noWalletCodes={[]}
        disableZeroBalance={false}
      />
    )).then((response: GuiWallet | Object | null) => {
      if (response) {
        this.props.onSelectWallet(response.id, response.currencyCode)
      }
    })
    return null
  }

  render () {
    return <WalletSelector onPress={this.onPress} />
  }
}

export { HeaderWalletSelector }
