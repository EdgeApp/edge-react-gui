// @flow
import React, { Component } from 'react'
import { Dimensions, FlatList, View } from 'react-native'

import { CryptoExchangeCreateWalletRow } from '../../components/common/CryptoExchangeCreateWalletRow.js'
import { CryptoExchangeWalletListRow } from '../../components/common/CryptoExchangeWalletListRow.js'
import { CLOSE_ICON, ION_ICONS } from '../../constants/indexConstants'
import type { State } from '../../modules/ReduxTypes'
import { IconButton } from '../../modules/UI/components/Buttons/IconButton.ui'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletSelectorModalStyles as styles } from '../../styles/indexStyles'
import type { GuiWallet } from '../../types'

type Props = {
  onDone(GuiWallet | Object): mixed,
  headerTitle: string,
  wallets: Array<GuiWallet>,
  supportedWalletTypes: Array<Object>,
  showWalletCreators: boolean,
  state: State
}
type Record = {
  walletItem: GuiWallet | null,
  supportedWalletType: Object | null
}

type FlatListItem = {
  item: Record,
  index: number
}

type LocalState = {
  records: Array<Record>,
  totalCurrenciesAndTokens: number,
  totalWalletsToAdd: number
}

class CryptoExchangeWalletSelectorModal extends Component<Props, LocalState> {
  constructor (props: Props) {
    super(props)
    const records = []
    let i = 0
    let totalCurrenciesAndTokens = 0
    let totalWalletsToAdd = 0
    for (i; i < this.props.wallets.length; i++) {
      const wallet = this.props.wallets[i]
      const record = {
        walletItem: wallet,
        supportedWalletType: null
      }
      records.push(record)
      totalCurrenciesAndTokens++
      if (wallet.enabledTokens.length) {
        totalCurrenciesAndTokens = totalCurrenciesAndTokens + wallet.enabledTokens.length
      }
    }

    for (i = 0; i < this.props.supportedWalletTypes.length; i++) {
      const record = {
        walletItem: null,
        supportedWalletType: this.props.supportedWalletTypes[i]
      }
      totalWalletsToAdd++
      records.push(record)
    }

    this.state = {
      records,
      totalCurrenciesAndTokens,
      totalWalletsToAdd
    }
  }
  calculateHeight = () => {
    const length = this.props.showWalletCreators ? this.state.totalCurrenciesAndTokens + this.state.totalWalletsToAdd : this.state.totalCurrenciesAndTokens
    const windowHeight = Dimensions.get('window').height * 0.7 // - CRYPTO_EXCHANGE_WALLET_DIALOG_TOP
    const flatListHeight = length * styles.rowHeight
    if (flatListHeight + styles.rowHeight > windowHeight) {
      return windowHeight - styles.rowHeight
    }
    return flatListHeight
  }
  keyExtractor = (item: Record, index: number) => index.toString()

  selectWallet = (wallet: GuiWallet) => {
    this.props.onDone(wallet)
  }
  selectTokenWallet = (obj: Object) => {
    this.props.onDone(obj)
  }
  createWallet = (supportedWallet: Object) => {
    console.log('Create Wallet')
    this.props.onDone(supportedWallet)
  }
  renderWalletItem = ({ item }: FlatListItem) => {
    if (item.walletItem) {
      return (
        <CryptoExchangeWalletListRow
          wallet={item.walletItem}
          onPress={this.selectWallet}
          onTokenPress={this.selectTokenWallet}
          state={this.props.state}
          isWalletFiatBalanceVisible
        />
      )
    }
    if (this.props.showWalletCreators) {
      return <CryptoExchangeCreateWalletRow supportedWallet={item.supportedWalletType || {}} onPress={this.createWallet} />
    }
    return null
  }
  render () {
    return (
      <View style={styles.container}>
        <View style={styles.activeArea}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FormattedText>{this.props.headerTitle}</FormattedText>
            </View>
            <View style={styles.headerRight}>
              <IconButton style={styles.iconButton} onPress={this.props.onDone} icon={CLOSE_ICON} iconType={ION_ICONS} />
            </View>
          </View>
          <View style={{ ...styles.flatListBox, height: this.calculateHeight() }}>
            <FlatList data={this.state.records} keyExtractor={this.keyExtractor} renderItem={this.renderWalletItem} />
          </View>
        </View>
      </View>
    )
  }
}

export { CryptoExchangeWalletSelectorModal }

// eslint-disable-next-line
export const createCryptoExchangeWalletSelectorModal = (opts: Object) => (props: { +onDone: Function }) => {
  return (
    <CryptoExchangeWalletSelectorModal
      supportedWalletTypes={opts.supportedWalletTypes}
      wallets={opts.wallets}
      showWalletCreators={opts.showWalletCreators || false}
      onDone={props.onDone}
      state={opts.state}
      headerTitle={opts.headerTitle}
    />
  )
}
