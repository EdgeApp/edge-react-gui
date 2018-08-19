// @flow

import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import * as Animatable from 'react-native-animatable'
import slowlog from 'react-native-slowlog'

import { PLATFORM } from '../../../../theme/variables/platform.js'
import { GuiWallet } from '../../../ReduxTypes.js'
import { border as b } from '../../../utils'
import { WalletListRowConnector } from '../WalletListRow/WalletListRow.ui.js'
import WalletListModalHeader from './components/WalletListModalHeaderConnector'
import styles from './style'

type Props = {
  topDisplacement: number,
  type: string,
  whichWallet?: string,
  dropdownWalletListVisible: boolean,
  currentScene: string,
  wallets: Array<GuiWallet>
}
export default class WalletListModal extends Component<Props> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  renderWalletListRow = ({ item }) => {
    return <WalletListRowConnector wallet={item} />
  }

  keyExtractor = (item: GuiWalletType, index: number): number => {
    return item.id
  }

  render () {
    const { wallets } = this.props
    const walletList = []
    const top = this.props.topDisplacement ? this.props.topDisplacement : 38
    for (const id in wallets) {
      walletList.push(wallets[id])
    }
    return (
      <Animatable.View style={[b(), styles.topLevel, { position: 'absolute', top: top, height: PLATFORM.usableHeight }]} animation="fadeInUp" duration={250}>
        <View>
          <WalletListModalHeader type={this.props.type} whichWallet={this.props.whichWallet} />
          <FlatList style={{ width: '100%', height: 500 }} data={walletList} renderItem={this.renderWalletListRow} />
        </View>
      </Animatable.View>
    )
  }
}
