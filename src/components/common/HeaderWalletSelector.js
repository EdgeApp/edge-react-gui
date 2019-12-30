// @flow

import React, { Component } from 'react'

import { WalletListModalConnected as WalletListModal } from '../../connectors/components/WalletListModalConnector.js'
import s from '../../locales/strings.js'
import WalletSelector from '../../modules/UI/components/Header/Component/WalletSelectorConnector'
import type { GuiWallet } from '../../types/types.js'
import { Airship } from '../services/AirshipInstance.js'

export type StateProps = {
  wallets: { [string]: GuiWallet }
}

export type DispatchProps = {
  onSelectWallet(string, string): void
}

type Props = StateProps & DispatchProps

class HeaderWalletSelector extends Component<Props> {
  onPress = () => {
    const { wallets } = this.props
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
        existingWalletToFilterId={''}
        existingWalletToFilterCurrencyCode={''}
        supportedWalletTypes={[]}
        excludedCurrencyCode={[]}
        showWalletCreators={false}
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
