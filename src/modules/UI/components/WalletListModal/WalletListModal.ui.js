// @flow

import React, { Component } from 'react'
import { FlatList } from 'react-native'
import * as Animatable from 'react-native-animatable'
import slowlog from 'react-native-slowlog'

import type { GuiWallet } from '../../../../types/types.js'
import { WalletListRowConnector } from '../WalletListRow/WalletListRowConnector.js'
import WalletListModalHeader from './components/WalletListModalHeaderConnector'
import styles from './style'

type WalletListModalOwnProps = {
  wallets?: Object,
  topDisplacement: number,
  whichWallet?: string,
  type: string,
  excludedCurrencyCode?: string
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
    const { onSelectWallet, excludedCurrencyCode } = this.props
    const wallet = walletItem.item
    return <WalletListRowConnector onSelectWallet={onSelectWallet} wallet={wallet} excludedCurrencyCode={excludedCurrencyCode} />
  }

  keyExtractor = (item: { item: GuiWallet, index: number, separators: any }, index: number): string => {
    return String(item.index)
  }

  render () {
    const { wallets, topDisplacement = 0 } = this.props
    const walletList = []
    for (const id in wallets) {
      const wallet = wallets[id]
      // perhaps it'd be best to filter the list of valid wallets rather than arbitrary criteria
      walletList.push(wallet)
    }
    return (
      <Animatable.View style={[styles.topLevel, { position: 'absolute', bottom: 0, top: topDisplacement }]} animation="fadeInUp" duration={250}>
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
