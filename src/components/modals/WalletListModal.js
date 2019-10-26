// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import React, { Component, Fragment } from 'react'
import { Dimensions, FlatList, View } from 'react-native'

import { CryptoExchangeCreateWalletRow } from '../../components/common/CryptoExchangeCreateWalletRow.js'
import { CryptoExchangeWalletListRow } from '../../components/common/CryptoExchangeWalletListRow.js'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletSelectorModalStyles as styles } from '../../styles/indexStyles'
import type { State } from '../../types/reduxTypes.js'
import type { GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<GuiWallet | Object | null>,
  wallets: Array<GuiWallet>,
  existingWalletToFilterId?: string,
  existingWalletToFilterCurrencyCode?: string,
  headerTitle: string,
  excludedCurrencyCode: Array<string>,
  supportedWalletTypes: Array<Object>,
  showWalletCreators: boolean,
  state: State,
  excludedTokens: Array<string>,
  noWalletCodes: Array<string>,
  disableZeroBalance: boolean
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
  input: string,
  records: Array<Record>,
  totalCurrenciesAndTokens: number,
  totalWalletsToAdd: number
}

export class WalletListModal extends Component<Props, LocalState> {
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
      input: '',
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
    this.props.bridge.resolve(wallet)
  }
  selectTokenWallet = (obj: Object) => {
    this.props.bridge.resolve(obj)
  }
  createWallet = (supportedWallet: Object) => {
    this.props.bridge.resolve(supportedWallet)
  }
  renderWalletItem = ({ item }: FlatListItem) => {
    const excludeCurrency = this.props.existingWalletToFilterCurrencyCode || ''
    if (item.walletItem) {
      return (
        <CryptoExchangeWalletListRow
          wallet={item.walletItem}
          onPress={this.selectWallet}
          excludedCurrencyCode={[excludeCurrency]}
          excludedTokens={this.props.excludedTokens}
          onTokenPress={this.selectTokenWallet}
          state={this.props.state}
          isWalletFiatBalanceVisible
          disableZeroBalance={this.props.disableZeroBalance}
        />
      )
    }
    if (this.props.showWalletCreators) {
      return <CryptoExchangeCreateWalletRow supportedWallet={item.supportedWalletType || {}} onPress={this.createWallet} disableZeroBalance={false} />
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
  onSearchFilterChange = (input: string) => {
    this.setState({
      input
    })
  }
  filterRecords = () => {
    const { records, input } = this.state
    if (input === '') {
      return records
    }
    const upperCaseInput = input.toUpperCase()
    const filteredRecords = []
    for (let i = 0; i < records.length; i++) {
      const record: Record = records[i]
      const { walletItem, supportedWalletType } = record
      if (walletItem) {
        if (walletItem.name.includes(input) || walletItem.currencyCode.includes(upperCaseInput) || walletItem.enabledTokens.includes(upperCaseInput)) {
          filteredRecords.push(record)
        }
      }

      if (supportedWalletType && !walletItem) {
        filteredRecords.push(record)
      }
    }
    return filteredRecords
  }

  render () {
    const { bridge } = this.props
    const { input } = this.state

    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        {gap => (
          <Fragment>
            <View style={{ flex: 1, paddingLeft: scale(12), paddingRight: scale(12) }}>
              <FormField
                autoFocus
                error={''}
                keyboardType={'default'}
                label={this.props.headerTitle}
                onChangeText={this.onSearchFilterChange}
                style={MaterialInputStyle}
                value={input}
              />
              <FlatList
                style={{ flex: 1, marginBottom: -gap.bottom }}
                contentContainerStyle={{ paddingBottom: gap.bottom }}
                data={this.filterRecords()}
                initialNumToRender={24}
                keyboardShouldPersistTaps="handled"
                keyExtractor={this.keyExtractor}
                renderItem={this.renderWalletItem}
              />
            </View>
          </Fragment>
        )}
      </AirshipModal>
    )
  }
}
