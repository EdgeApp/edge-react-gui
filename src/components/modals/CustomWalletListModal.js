// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Dimensions, FlatList, View } from 'react-native'

import { CustomWalletListRow } from '../../components/common/CustomWalletListRow.js'
import s from '../../locales/strings'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CustomWalletListModalStyles as styles } from '../../styles/indexStyles'

type Props = {
  onDone(EdgeCurrencyWallet): EdgeCurrencyWallet,
  wallets: Array<EdgeCurrencyWallet>
}
type State = {}
type FlatListItem = {
  item: EdgeCurrencyWallet,
  index: number
}

class CustomWalletListModal extends Component<Props, State> {
  calculateHeight = () => {
    const windowHeight = Dimensions.get('window').height
    const flatListHeight = this.props.wallets.length * styles.rowHeight
    if (flatListHeight + styles.rowHeight > windowHeight) {
      return windowHeight - styles.rowHeight
    }
    return flatListHeight
  }
  keyExtractor = (item: EdgeCurrencyWallet, index: number) => index.toString()

  selectWallet = (wallet: EdgeCurrencyWallet) => {
    this.props.onDone(wallet)
  }
  renderWalletItem = ({ item }: FlatListItem) => {
    return <CustomWalletListRow wallet={item} onPress={this.selectWallet} />
  }
  render () {
    return (
      <View style={styles.container}>
        <View style={styles.activeArea}>
          <View style={styles.header}>
            <FormattedText>{s.strings.choose_your_wallet}</FormattedText>
          </View>
          <View style={{ ...styles.flatListBox, height: this.calculateHeight() }}>
            <FlatList data={this.props.wallets} keyExtractor={this.keyExtractor} renderItem={this.renderWalletItem} />
          </View>
        </View>
      </View>
    )
  }
}

export { CustomWalletListModal }

// eslint-disable-next-line
export const createCustomWalletListModal = (opts: Object) => (props: { +onDone: Function }) => {
  return <CustomWalletListModal wallets={opts.wallets} onDone={props.onDone} />
}
