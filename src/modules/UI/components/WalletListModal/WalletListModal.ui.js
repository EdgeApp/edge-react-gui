// @flow

import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import * as Animatable from 'react-native-animatable'
import slowlog from 'react-native-slowlog'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import type { GuiWallet } from '../../../../types.js'
import { WalletListRowConnector } from '../WalletListRow/WalletListRowConnector.js'
import WalletListModalHeader from './components/WalletListModalHeaderConnector'
import styles from './style'

type Props = {
  topDisplacement: number,
  type: string,
  whichWallet?: string,
  currentScene: string,
  wallets: Object,
  onSelectWallet: (string, string) => void,
  excludedCurrencyCode?: string
}
export default class WalletListModal extends Component<Props> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  renderWalletListRow = (walletItem: { item: GuiWallet, index: number, separators: any }) => {
    const { onSelectWallet, excludedCurrencyCode } = this.props
    const wallet = walletItem.item
    return <WalletListRowConnector onSelectWallet={onSelectWallet} wallet={wallet} excludedCurrencyCode={excludedCurrencyCode} />
  }

  keyExtractor = (item: { item: GuiWallet, index: number, separators: any }, index: number): number => {
    return item.index
  }

  render () {
    const { wallets, topDisplacement } = this.props
    const walletList = []
    const top = topDisplacement || 38
    for (const id in wallets) {
      walletList.push(wallets[id])
    }
    return (
      <Animatable.View style={[styles.topLevel, { position: 'absolute', top: top, height: PLATFORM.usableHeight }]} animation="fadeInUp" duration={250}>
        <View>
          <FlatList
            ListHeaderComponent={<WalletListModalHeader type={this.props.type} whichWallet={this.props.whichWallet} />}
            style={{ width: '100%', height: '100%' }}
            data={walletList}
            renderItem={this.renderWalletListRow}
          />
        </View>
      </Animatable.View>
    )
  }
}
