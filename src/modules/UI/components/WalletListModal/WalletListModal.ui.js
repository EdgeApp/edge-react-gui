// @flow

import React, { Component } from 'react'
import { FlatList } from 'react-native'
import * as Animatable from 'react-native-animatable'
import slowlog from 'react-native-slowlog'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import type { GuiWallet } from '../../../../types.js'
import { WalletListRowConnector } from '../WalletListRow/WalletListRowConnector.js'
import WalletListModalHeader from './components/WalletListModalHeaderConnector'
import styles from './style'

type WalletListModalOwnProps = {
  wallets?: Object,
  topDisplacement: number,
  whichWallet?: string,
  type: string,
  excludedCurrencyCode?: string,
  includedCurrencyCodes?: Array<string>
}

type WalletListModalStateProps = {
  wallets: Object,
  currentScene: string
}

type WalletListModalDispatchProps = {
  onSelectWallet: (string, string) => void
}

type WalletListModalProps = WalletListModalOwnProps & WalletListModalStateProps & WalletListModalDispatchProps
export default class WalletListModal extends Component<WalletListModalProps> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  renderWalletListRow = (walletItem: { item: GuiWallet, index: number, separators: any }) => {
    const { onSelectWallet, excludedCurrencyCode, includedCurrencyCodes } = this.props
    const wallet = walletItem.item
    return (
      <WalletListRowConnector
        onSelectWallet={onSelectWallet}
        wallet={wallet}
        includedCurrencyCodes={includedCurrencyCodes}
        excludedCurrencyCode={excludedCurrencyCode}
      />
    )
  }

  keyExtractor = (item: { item: GuiWallet, index: number, separators: any }, index: number): number => {
    return item.index
  }

  render () {
    const { wallets, topDisplacement, includedCurrencyCodes } = this.props
    const walletList = []
    const top = topDisplacement || 38
    for (const id in wallets) {
      const wallet = wallets[id]
      // perhaps it'd be best to filter the list of valid wallets rather than arbitrary criteria
      if (includedCurrencyCodes) {
        if (includedCurrencyCodes.indexOf(wallet.currencyCode) > -1) {
          walletList.push(wallet)
        }
      } else {
        walletList.push(wallet)
      }
    }
    return (
      <Animatable.View
        style={[styles.topLevel, { position: 'absolute', top: top, height: PLATFORM.usableDimensionHeight }]}
        animation="fadeInUp"
        duration={250}
      >
        <FlatList
          ListHeaderComponent={<WalletListModalHeader type={this.props.type} whichWallet={this.props.whichWallet} />}
          style={{ width: '100%' }}
          data={walletList}
          renderItem={this.renderWalletListRow}
        />
      </Animatable.View>
    )
  }
}
