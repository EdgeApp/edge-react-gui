// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import React, { Component, Fragment } from 'react'
import { FlatList, View } from 'react-native'

import { CryptoExchangeCreateWalletRow } from '../../components/common/CryptoExchangeCreateWalletRow.js'
import { CryptoExchangeWalletListTokenRowConnected as CryptoExchangeWalletListRow } from '../../connectors/components/CryptoExchangeWalletListRowConnector.js'
import type { GuiWallet, MostRecentWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

export type StateProps = {
  activeWalletIds: Array<string>,
  mostRecentWallets: Array<MostRecentWallet>
}

type OwnProps = {
  bridge: AirshipBridge<GuiWallet | Object | null>,
  headerTitle: string,
  wallets: Array<GuiWallet>,
  createWalletCurrencies: Array<Object>,
  showCreateWallet: boolean,
  excludeWalletIds?: Array<string>,
  allowedCurrencyCodes?: Array<string>,
  excludeCurrencyCodes?: Array<string>
}

type Record = {
  walletItem: GuiWallet | null,
  createWalletCurrency: Object | null,
  mostRecentUsed?: boolean,
  currencyCode?: string | null,
  headerLabel?: string
}

type FlatListItem = {
  item: Record,
  index: number
}

type State = {
  input: string,
  records: Array<Record>
}

type Props = StateProps & OwnProps

export class WalletListModal extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      input: '',
      records: this.initializeRecords(props)
    }
  }

  initializeRecords = (props: Props) => {
    const { activeWalletIds, wallets, excludeWalletIds, allowedCurrencyCodes, excludeCurrencyCodes, createWalletCurrencies } = props
    const records = []
    // Initialize Wallets
    for (let i = 0; i < activeWalletIds.length; i++) {
      const wallet = wallets.find(wallet => wallet.id === activeWalletIds[i])
      const excludeWallet = wallet && excludeWalletIds ? excludeWalletIds.find(id => id === wallet.id) : null
      if (wallet && !excludeWallet) {
        if (!excludeWallet) {
          records.push({
            walletItem: wallet,
            createWalletCurrency: null
          })
        }
      }
    }
    // Initialize Create Wallets
    for (let i = 0; i < createWalletCurrencies.length; i++) {
      const createWalletCurrency = createWalletCurrencies[i]
      const { currencyCode } = createWalletCurrency
      const checkAllowedCurrencyCodes = allowedCurrencyCodes ? allowedCurrencyCodes.find(code => code === currencyCode) : true
      const checkExcludeCurrencyCodes = excludeCurrencyCodes ? excludeCurrencyCodes.find(code => code === currencyCode) : false
      if (checkAllowedCurrencyCodes && !checkExcludeCurrencyCodes) {
        records.push({
          walletItem: null,
          createWalletCurrency
        })
      }
    }
    return records
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
      const { walletItem, createWalletCurrency } = record

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

      if (createWalletCurrency && !walletItem) {
        filteredRecords.push(record)
      }
    }
    return filteredRecords
  }

  selectWallet = (wallet: GuiWallet) => this.props.bridge.resolve(wallet)
  selectTokenWallet = (obj: Object) => this.props.bridge.resolve(obj)
  createWallet = (supportedWallet: Object) => this.props.bridge.resolve(supportedWallet)
  renderWalletItem = ({ item }: FlatListItem) => {
    const { showCreateWallet, allowedCurrencyCodes, excludeCurrencyCodes } = this.props
    const { walletItem, createWalletCurrency, mostRecentUsed, currencyCode, headerLabel } = item
    if (walletItem) {
      return (
        <CryptoExchangeWalletListRow
          wallet={walletItem}
          onPress={this.selectWallet}
          excludedCurrencyCode={[]}
          excludedTokens={[]}
          onTokenPress={this.selectTokenWallet}
          isWalletFiatBalanceVisible
          disableZeroBalance={false}
          isMostRecentWallet={mostRecentUsed}
          searchFilter={this.state.input}
          currencyCodeFilter={currencyCode || ''}
          headerLabel={headerLabel}
          allowedCurrencyCodes={allowedCurrencyCodes}
          excludeCurrencyCodes={excludeCurrencyCodes}
        />
      )
    }
    if (showCreateWallet) {
      return <CryptoExchangeCreateWalletRow supportedWallet={createWalletCurrency || {}} onPress={this.createWallet} disableZeroBalance={false} />
    }
    return null
  }

  keyExtractor = (item: Record, index: number) => index.toString()
  onSearchFilterChange = (input: string) => this.setState({ input })
  render () {
    const { bridge, headerTitle } = this.props
    const { input } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        {gap => (
          <Fragment>
            <View style={{ flex: 1 }}>
              <View style={{ marginHorizontal: scale(15), marginBottom: scale(13) }}>
                <FormField
                  autoFocus
                  keyboardType={'default'}
                  label={headerTitle}
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
