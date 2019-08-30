// @flow
import React, { Component } from 'react'
import { Dimensions, FlatList, TouchableWithoutFeedback, View } from 'react-native'

import { CryptoExchangeCreateWalletRow } from '../../components/common/CryptoExchangeCreateWalletRow.js'
import { CryptoExchangeWalletListRow } from '../../components/common/CryptoExchangeWalletListRow.js'
import { CLOSE_ICON, ION_ICONS } from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { IconButton } from '../../modules/UI/components/Buttons/IconButton.ui'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletSelectorModalStyles as styles } from '../../styles/indexStyles'
import type { State } from '../../types/reduxTypes.js'
import type { GuiWallet } from '../../types/types.js'

type Props = {
  onDone(GuiWallet | Object | null): mixed,
  headerTitle: string,
  excludedCurrencyCode: Array<string>,
  wallets: Array<GuiWallet>,
  supportedWalletTypes: Array<Object>,
  showWalletCreators: boolean,
  state: State,
  cantCancel: boolean,
  excludedTokens: Array<string>,
  noWalletCodes: Array<string>
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
      if (wallet.type === 'wallet:fio') continue
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
    const length = this.props.showWalletCreators
      ? this.state.totalCurrenciesAndTokens + this.state.totalWalletsToAdd
      : this.state.totalCurrenciesAndTokens - this.props.excludedTokens.length
    const windowHeight = Dimensions.get('window').height * 0.7
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
    this.props.onDone(supportedWallet)
  }
  renderWalletItem = ({ item }: FlatListItem) => {
    if (item.walletItem) {
      return (
        <CryptoExchangeWalletListRow
          wallet={item.walletItem}
          onPress={this.selectWallet}
          excludedCurrencyCode={this.props.excludedCurrencyCode}
          excludedTokens={this.props.excludedTokens}
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
  renderUnSupported = () => {
    if (this.props.noWalletCodes.length > 0) {
      return (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FormattedText>
              {s.strings.wallets_for_currency_code_dont_exist} {this.props.noWalletCodes.toString()}
            </FormattedText>
          </View>
        </View>
      )
    }
    return null
  }
  renderHeader = () => {
    if (this.props.cantCancel) {
      return (
        <View style={styles.headerCenter}>
          <FormattedText>{this.props.headerTitle}</FormattedText>
        </View>
      )
    }
    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <FormattedText>{this.props.headerTitle}</FormattedText>
        </View>
        <View style={styles.headerRight}>
          <IconButton style={styles.iconButton} onPress={this.closeModal} icon={CLOSE_ICON} iconType={ION_ICONS} />
        </View>
      </View>
    )
  }
  closeModal = () => {
    this.props.onDone(null)
  }
  render () {
    return (
      <TouchableWithoutFeedback style={styles.touchable} onPress={this.closeModal} underlayColor={styles.underlayColor}>
        <View style={styles.container}>
          <View style={styles.activeArea}>
            {this.renderHeader()}
            {this.renderUnSupported()}
            <View style={{ ...styles.flatListBox, height: this.calculateHeight() }}>
              <FlatList data={this.state.records} keyExtractor={this.keyExtractor} renderItem={this.renderWalletItem} />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
      excludedCurrencyCode={opts.excludedCurrencyCode}
      headerTitle={opts.headerTitle}
      cantCancel={opts.cantCancel || false}
      excludedTokens={opts.excludedTokens || []}
      noWalletCodes={opts.noWalletCodes || []}
    />
  )
}
