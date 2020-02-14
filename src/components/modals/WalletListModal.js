// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import React, { Component, Fragment } from 'react'
import { Dimensions, FlatList, View } from 'react-native'

import { CryptoExchangeCreateWalletRow } from '../../components/common/CryptoExchangeCreateWalletRow.js'
import { CryptoExchangeWalletListTokenRowConnected as CryptoExchangeWalletListRow } from '../../connectors/components/CryptoExchangeWalletListRowConnector.js'
import s from '../../locales/strings.js'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletSelectorModalStyles as styles } from '../../styles/indexStyles'
import type { GuiWallet, MostRecentWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

export type StateProps = {
  activeWalletIds: Array<string>,
  mostRecentWallets: Array<MostRecentWallet>
}

type OwnProps = {
  bridge: AirshipBridge<GuiWallet | Object | null>,
  wallets: Array<GuiWallet>,
  existingWalletToFilterId?: string,
  existingWalletToFilterCurrencyCode?: string,
  headerTitle: string,
  excludedCurrencyCode: Array<string>,
  supportedWalletTypes: Array<Object>,
  showWalletCreators: boolean,
  excludedTokens: Array<string>,
  noWalletCodes: Array<string>,
  disableZeroBalance: boolean
}

type Record = {
  walletItem: GuiWallet | null,
  supportedWalletType: Object | null,
  mostRecentUsed?: boolean,
  currencyCode?: string | null,
  headerLabel?: string
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

type Props = StateProps & OwnProps

export class WalletListModal extends Component<Props, LocalState> {
  constructor (props: Props) {
    super(props)
    const records = []
    let i = 0
    let totalCurrenciesAndTokens = 0
    let totalWalletsToAdd = 0
    for (i; i < this.props.activeWalletIds.length; i++) {
      const wallet = this.props.wallets.find(wallet => wallet.id === this.props.activeWalletIds[i])
      if (wallet) {
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
          isWalletFiatBalanceVisible
          disableZeroBalance={this.props.disableZeroBalance}
          isMostRecentWallet={item.mostRecentUsed}
          searchFilter={this.state.input}
          currencyCodeFilter={item.currencyCode || ''}
          headerLabel={item.headerLabel}
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
  setWalletRecordsLabel = (wallets: Array<Record>, header: string): Array<Record> => {
    return wallets.map((record: Record, i: number) => {
      if (i === 0) {
        return {
          ...record,
          headerLabel: header
        }
      }
      return record
    })
  }
  getMostRecentlyUsedWalletRecords = (size: number) => {
    const { mostRecentWallets } = this.props
    const { records } = this.state
    const mostRecentWalletRecords: Array<Record> = []
    let i = 0
    while (mostRecentWalletRecords.length < size) {
      if (!mostRecentWallets[i]) {
        break
      }
      const mostRecentWalletRecord = records.find(record => record.walletItem && record.walletItem.id === mostRecentWallets[i].id)
      if (mostRecentWalletRecord) {
        mostRecentWalletRecords.push({
          ...mostRecentWalletRecord,
          currencyCode: mostRecentWallets[i].currencyCode,
          mostRecentUsed: true
        })
      }
      i++
    }
    return this.setWalletRecordsLabel(mostRecentWalletRecords, 'mostRecentWalletsHeader')
  }
  getWalletRecords = () => {
    const { records, input } = this.state

    // Most Recent Wallet Records
    if (input === '') {
      const walletTokenCount = records.reduce((total: number, record: Record) => {
        const wallet = record.walletItem
        const tokenValue = wallet ? wallet.enabledTokens.length : 0
        if (wallet) {
          return total + tokenValue + 1
        }
        return total
      }, 0)
      if (walletTokenCount > 4 && walletTokenCount < 11) {
        const wallets = this.setWalletRecordsLabel(records, 'normalWalletHeader')
        return [...this.getMostRecentlyUsedWalletRecords(2), ...wallets]
      }
      if (walletTokenCount > 10) {
        const wallets = this.setWalletRecordsLabel(records, 'normalWalletHeader')
        return [...this.getMostRecentlyUsedWalletRecords(3), ...wallets]
      }
      return records
    }

    // Search Input Filter
    const inputLowerCase = input.toLowerCase()
    const filteredRecords = []
    for (let i = 0; i < records.length; i++) {
      const record: Record = records[i]
      const { walletItem, supportedWalletType } = record
      if (walletItem) {
        const { name, currencyCode, currencyNames, enabledTokens } = walletItem
        const nameString = name.toLowerCase()
        const currencyNameString = currencyNames[currencyCode].toString().toLowerCase()
        const currencyCodeString = currencyCode.toLowerCase()
        const tokenCodesString = enabledTokens.toString().toLowerCase()
        const tokenNamesObject = {}
        enabledTokens.forEach(token => {
          tokenNamesObject[token] = currencyNames[token]
        })
        const tokenNameString = JSON.stringify(tokenNamesObject).toLowerCase()
        if (
          nameString.includes(inputLowerCase) ||
          currencyNameString.includes(inputLowerCase) ||
          currencyCodeString.includes(inputLowerCase) ||
          tokenCodesString.includes(inputLowerCase) ||
          tokenNameString.includes(inputLowerCase)
        ) {
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
            <View style={{ flex: 1 }}>
              <View style={{ marginHorizontal: scale(15), marginBottom: scale(13) }}>
                <FormField
                  autoFocus
                  error={''}
                  keyboardType={'default'}
                  label={this.props.headerTitle}
                  onChangeText={this.onSearchFilterChange}
                  style={MaterialInputStyle}
                  value={input}
                />
              </View>
              <FlatList
                style={{ flex: 1, marginBottom: -gap.bottom }}
                contentContainerStyle={{ paddingBottom: gap.bottom }}
                data={this.getWalletRecords()}
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
