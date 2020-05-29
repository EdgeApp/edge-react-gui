// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import { type EdgeAccount } from 'edge-core-js'
import React, { Component } from 'react'
import { FlatList, View } from 'react-native'
import { connect } from 'react-redux'

import { WalletListModalCreateRow } from '../../components/common/WalletListModalCreateRow.js'
import { CryptoExchangeWalletListTokenRowConnected as CryptoExchangeWalletListRow } from '../../connectors/components/CryptoExchangeWalletListRowConnector.js'
import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import type { State as StateType } from '../../types/reduxTypes.js'
import type { FlatListItem, GuiWallet, MostRecentWallet } from '../../types/types.js'
import { type GuiWalletType } from '../../types/types.js'
import { getGuiWalletTypes } from '../../util/CurrencyInfoHelpers.js'
import { scale } from '../../util/scaling.js'
import { type TokenSelectObject } from '../common/CryptoExchangeWalletListTokenRow.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

export type WalletListResult = {
  walletToSelect?: {
    walletId: string,
    currencyCode: string
  },
  walletToCreate?: {
    walletType: string,
    currencyCode: string
  }
}

type StateProps = {
  wallets: { [string]: GuiWallet },
  activeWalletIds: Array<string>,
  mostRecentWallets: Array<MostRecentWallet>,
  account: EdgeAccount
}

type OwnProps = {
  bridge: AirshipBridge<WalletListResult>,
  headerTitle: string,
  showCreateWallet?: boolean,
  excludeWalletIds?: Array<string>,
  allowedCurrencyCodes?: Array<string>,
  excludeCurrencyCodes?: Array<string>
}

type Record = {
  walletItem: GuiWallet | null,
  createWalletCurrency: GuiWalletType | null,
  mostRecentUsed?: boolean,
  currencyCode?: string | null,
  headerLabel?: string
}

type State = {
  input: string,
  records: Array<Record>,
  allowedCurrencyCodes?: Array<string>,
  excludeCurrencyCodes?: Array<string>
}

type Props = StateProps & OwnProps

class WalletListModalConnected extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      records: []
    }
  }

  static getDerivedStateFromProps(props: Props) {
    const { activeWalletIds, wallets, excludeWalletIds, showCreateWallet, account } = props

    // Uppercase currency codes
    let { allowedCurrencyCodes, excludeCurrencyCodes } = props
    if (allowedCurrencyCodes != null) {
      allowedCurrencyCodes = allowedCurrencyCodes.map(code => code.toUpperCase())
    }
    if (excludeCurrencyCodes != null) {
      excludeCurrencyCodes = excludeCurrencyCodes.map(code => code.toUpperCase())
    }

    const records = []

    // Initialize Wallets
    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]
      const excludeWallet = wallet && excludeWalletIds ? excludeWalletIds.find(id => id === wallet.id) : false
      if (wallet && !excludeWallet) {
        records.push({
          walletItem: wallet,
          createWalletCurrency: null
        })
      }
    }

    // Initialize Create Wallets
    if (showCreateWallet) {
      const createWalletCurrencies = getGuiWalletTypes(account)
      const walletsArray = Object.values(wallets)
      for (const createWalletCurrency of createWalletCurrencies) {
        const { currencyCode } = createWalletCurrency
        const checkAllowedCurrencyCodes = allowedCurrencyCodes ? allowedCurrencyCodes.find(code => code === currencyCode) : true
        const checkExcludeCurrencyCodes = excludeCurrencyCodes ? excludeCurrencyCodes.find(code => code === currencyCode) : false
        const checkExistingWallet = walletsArray.find(wallet => (wallet && wallet.currencyCode ? wallet.currencyCode === currencyCode : false))
        if (checkAllowedCurrencyCodes && !checkExcludeCurrencyCodes && !checkExistingWallet) {
          records.push({
            walletItem: null,
            createWalletCurrency
          })
        }
      }
    }
    return {
      records,
      allowedCurrencyCodes,
      excludeCurrencyCodes
    }
  }

  setWalletRecordsLabel = (records: Array<Record>, header: string): Array<Record> => {
    return records.map((record: Record, i: number) => {
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
          return total + tokenValue + 1 // should be remove when the parent currency code is added on the enabledTokens
        }
        return total
      }, 0)
      if (walletTokenCount > 4 && walletTokenCount < 11) {
        const walletRecords = this.setWalletRecordsLabel(records, 'normalWalletHeader')
        return [...this.getMostRecentlyUsedWalletRecords(2), ...walletRecords]
      }
      if (walletTokenCount > 10) {
        const walletRecords = this.setWalletRecordsLabel(records, 'normalWalletHeader')
        return [...this.getMostRecentlyUsedWalletRecords(3), ...walletRecords]
      }
      return records
    }

    // Search Input Filter
    const inputLowerCase = input.toLowerCase()
    const filteredRecords = []
    for (const record of records) {
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

  selectWallet = (wallet: GuiWallet) => this.props.bridge.resolve({ walletToSelect: { walletId: wallet.id, currencyCode: wallet.currencyCode } })
  selectTokenWallet = (tokenSelectObject: TokenSelectObject) =>
    this.props.bridge.resolve({ walletToSelect: { walletId: tokenSelectObject.id, currencyCode: tokenSelectObject.currencyCode } })

  createWallet = (createWalletCurrency: GuiWalletType) =>
    this.props.bridge.resolve({ walletToCreate: { walletType: createWalletCurrency.value, currencyCode: createWalletCurrency.currencyCode } })

  renderWalletItem = ({ item }: FlatListItem<Record>) => {
    const { showCreateWallet } = this.props
    const { allowedCurrencyCodes, excludeCurrencyCodes } = this.state
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
    if (showCreateWallet && createWalletCurrency) {
      return <WalletListModalCreateRow supportedWallet={createWalletCurrency} onPress={this.createWallet} disableZeroBalance={false} />
    }
    return null
  }

  keyExtractor = (item: Record, index: number) => index.toString()
  onSearchFilterChange = (input: string) => this.setState({ input })
  render() {
    const { bridge, headerTitle } = this.props
    const { input } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve({})}>
        {gap => (
          <>
            <View style={{ flex: 1 }}>
              <View style={{ marginHorizontal: scale(15), marginBottom: scale(13) }}>
                <FormField
                  autoFocus
                  keyboardType="default"
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
          </>
        )}
      </AirshipModal>
    )
  }
}

const WalletListModal = connect((state: StateType): StateProps => {
  const wallets = state.ui.wallets.byId
  return {
    wallets,
    activeWalletIds: global.isFioDisabled
      ? getActiveWalletIds(state).filter(id => !(wallets[id] != null && wallets[id].type === 'wallet:fio'))
      : getActiveWalletIds(state),
    mostRecentWallets: state.ui.settings.mostRecentWallets,
    account: state.core.account
  }
})(WalletListModalConnected)
export { WalletListModal }
