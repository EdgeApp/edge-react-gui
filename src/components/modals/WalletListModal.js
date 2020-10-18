// @flow

import { FormField, MaterialInputStyle } from 'edge-components'
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { FlatList, View } from 'react-native'
import { connect } from 'react-redux'

import { refreshWallet } from '../../actions/WalletActions.js'
import { WalletListModalCreateRow } from '../../components/common/WalletListModalCreateRow.js'
import { CryptoExchangeWalletListTokenRowConnected as CryptoExchangeWalletListRow } from '../../connectors/components/CryptoExchangeWalletListRowConnector.js'
import { DEFAULT_STARTER_WALLET_NAMES } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { setEnabledTokens } from '../../modules/Core/Wallets/EnabledTokens.js'
import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CreateWalletType, CustomTokenInfo, FlatListItem, GuiWallet, MostRecentWallet } from '../../types/types.js'
import { getCreateWalletType, getCreateWalletTypes, getCurrencyInfos } from '../../util/CurrencyInfoHelpers.js'
import { scale } from '../../util/scaling.js'
import { type TokenSelectObject } from '../common/CryptoExchangeWalletListTokenRow.js'
import { showError, showFullScreenSpinner } from '../services/AirshipInstance.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

export type WalletListResult = {
  walletId?: string,
  currencyCode?: string
}

type StateProps = {
  wallets: { [string]: GuiWallet },
  activeWalletIds: string[],
  mostRecentWallets: MostRecentWallet[],
  account: EdgeAccount,
  defaultIsoFiat: string,
  customTokens: CustomTokenInfo[]
}

type OwnProps = {
  bridge: AirshipBridge<WalletListResult>,
  headerTitle: string,
  showCreateWallet?: boolean,
  excludeWalletIds?: string[],
  allowedCurrencyCodes?: string[],
  excludeCurrencyCodes?: string[]
}

type DispatchProps = {
  tokenCreated(string, string[]): void
}

type CreateToken = {
  currencyCode: string,
  currencyName: string,
  symbolImage?: string,
  parentCurrencyCode: string
}

type Record = {
  walletItem: GuiWallet | null,
  createWalletCurrency: CreateWalletType | null,
  createToken: CreateToken | null,
  mostRecentUsed?: boolean,
  currencyCode?: string | null,
  headerLabel?: string
}

type State = {
  input: string,
  records: Record[],
  allowedCurrencyCodes?: string[],
  excludeCurrencyCodes?: string[]
}

type Props = StateProps & OwnProps & DispatchProps

class WalletListModalConnected extends React.Component<Props, State> {
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
    const createTokens = {}

    // Create Tokens Array
    if (showCreateWallet) {
      const currencyInfos = getCurrencyInfos(account)
      for (const currencyInfo of currencyInfos) {
        for (const metaToken of currencyInfo.metaTokens) {
          createTokens[`${currencyInfo.currencyCode}:${metaToken.currencyCode}`] = {
            currencyCode: metaToken.currencyCode,
            currencyName: metaToken.currencyName,
            symbolImage: metaToken.symbolImage,
            parentCurrencyCode: currencyInfo.currencyCode
          }
        }
      }
    }

    // Initialize Wallets
    for (const walletId of activeWalletIds) {
      const wallet = wallets[walletId]
      const excludeWallet = wallet && excludeWalletIds ? excludeWalletIds.find(id => id === wallet.id) : false
      if (wallet && !excludeWallet) {
        records.push({
          walletItem: wallet,
          createWalletCurrency: null,
          createToken: null
        })

        // Filter createTokens array on enabled tokens
        for (const enabledToken of wallet.enabledTokens) {
          delete createTokens[`${wallet.currencyCode}:${enabledToken}`]
        }
      }
    }

    // Initialize Create Wallets
    if (showCreateWallet) {
      const createWalletCurrencies = getCreateWalletTypes(account)
      const walletsArray = Object.values(wallets)
      for (const createWalletCurrency of createWalletCurrencies) {
        const { currencyCode } = createWalletCurrency
        const checkAllowedCurrencyCodes = allowedCurrencyCodes ? allowedCurrencyCodes.find(code => code === currencyCode) : true
        const checkExcludeCurrencyCodes = excludeCurrencyCodes ? excludeCurrencyCodes.find(code => code === currencyCode) : false
        const checkExistingWallet = walletsArray.find(wallet => (wallet && wallet.currencyCode ? wallet.currencyCode === currencyCode : false))
        if (checkAllowedCurrencyCodes && !checkExcludeCurrencyCodes && !checkExistingWallet) {
          records.push({
            walletItem: null,
            createWalletCurrency,
            createToken: null
          })
        }
      }
    }

    // Initialize Create Tokens
    if (showCreateWallet) {
      for (const fullCurrencyCode in createTokens) {
        if (createTokens.hasOwnProperty(fullCurrencyCode)) {
          const createToken = createTokens[fullCurrencyCode]
          const tokenCurrencyCode = createToken.currencyCode
          const checkAllowedCurrencyCodes = allowedCurrencyCodes
            ? allowedCurrencyCodes.find(currencyCode => currencyCode === fullCurrencyCode || currencyCode === tokenCurrencyCode)
            : true
          const checkExcludeCurrencyCodes = excludeCurrencyCodes
            ? excludeCurrencyCodes.find(currencyCode => currencyCode === fullCurrencyCode || currencyCode === tokenCurrencyCode)
            : false
          if (checkAllowedCurrencyCodes && !checkExcludeCurrencyCodes) {
            records.push({
              walletItem: null,
              createWalletCurrency: null,
              createToken
            })
          }
        }
      }
    }

    return {
      records,
      allowedCurrencyCodes,
      excludeCurrencyCodes
    }
  }

  setWalletRecordsLabel = (records: Record[], header: string): Record[] => {
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
    const mostRecentWalletRecords: Record[] = []
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
      const { walletItem, createWalletCurrency, createToken } = record

      if (walletItem) {
        const { name, currencyCode, currencyNames, enabledTokens } = walletItem
        const nameString = name.toLowerCase()
        const currencyNameString = currencyNames[currencyCode].toString().toLowerCase()
        const currencyCodeString = currencyCode.toLowerCase()
        const tokenCodesString = enabledTokens.toString().toLowerCase()
        const tokenNamesObject = {}
        enabledTokens.forEach(token => {
          tokenNamesObject[token] = currencyNames[token] || this.props.customTokens.find(item => item.currencyCode === token)
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

      if ((createWalletCurrency || createToken) && !walletItem) {
        filteredRecords.push(record)
      }
    }
    return filteredRecords
  }

  createWallet = (currencyCode: string, walletType: string) => {
    const { account, defaultIsoFiat } = this.props
    const [type, format] = walletType.split('-')

    return showFullScreenSpinner(
      s.strings.wallet_list_modal_creating_wallet,
      account.createCurrencyWallet(type, {
        name: DEFAULT_STARTER_WALLET_NAMES[currencyCode],
        defaultIsoFiat,
        keyOptions: format ? { format } : {}
      })
    )
  }

  selectWallet = (wallet: GuiWallet) => this.props.bridge.resolve({ walletId: wallet.id, currencyCode: wallet.currencyCode })

  selectTokenWallet = (tokenSelectObject: TokenSelectObject) =>
    this.props.bridge.resolve({ walletId: tokenSelectObject.id, currencyCode: tokenSelectObject.currencyCode })

  createAndSelectWallet = async ({ currencyCode, walletType }: CreateWalletType) => {
    try {
      const wallet = await this.createWallet(currencyCode, walletType)
      this.props.bridge.resolve({ walletId: wallet.id, currencyCode: wallet.currencyInfo.currencyCode })
    } catch (error) {
      showError(error)
    }
  }

  createAndSelectToken = async ({ currencyCode, parentCurrencyCode }: CreateToken) => {
    const { account, tokenCreated } = this.props
    const { currencyWallets } = account

    // Find existing EdgeCurrencyWallet
    let wallet
    for (const walletId in currencyWallets) {
      const currencyWallet = currencyWallets[walletId]
      if (currencyWallet.currencyInfo.currencyCode === parentCurrencyCode) {
        wallet = currencyWallet
        break
      }
    }

    try {
      if (!wallet) {
        const walletType = getCreateWalletType(account, parentCurrencyCode)
        if (!walletType) throw new Error(s.strings.create_wallet_failed_message)
        wallet = await this.createWallet(walletType.currencyCode, walletType.walletType)
      }

      const enabledTokens = await showFullScreenSpinner(
        s.strings.wallet_list_modal_enabling_token,
        setEnabledTokens(wallet, [...(await wallet.getEnabledTokens()), currencyCode], [])
      )

      tokenCreated(wallet.id, enabledTokens)
      this.props.bridge.resolve({ walletId: wallet.id, currencyCode })
    } catch (error) {
      showError(error)
    }
  }

  renderWalletItem = ({ item }: FlatListItem<Record>) => {
    const { showCreateWallet } = this.props
    const { allowedCurrencyCodes, excludeCurrencyCodes } = this.state
    const { walletItem, createWalletCurrency, createToken, mostRecentUsed, currencyCode, headerLabel } = item
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
      return (
        <WalletListModalCreateRow
          currencyCode={createWalletCurrency.currencyCode}
          image={createWalletCurrency.symbolImage}
          name={createWalletCurrency.currencyName}
          type="wallet"
          onPress={() => this.createAndSelectWallet(createWalletCurrency)}
        />
      )
    }
    if (showCreateWallet && createToken) {
      return (
        <WalletListModalCreateRow
          currencyCode={createToken.currencyCode}
          image={createToken.symbolImage}
          name={createToken.currencyName}
          type="token"
          onPress={() => this.createAndSelectToken(createToken)}
        />
      )
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

const WalletListModal = connect(
  (state: RootState): StateProps => {
    const wallets = state.ui.wallets.byId
    return {
      wallets,
      activeWalletIds: global.isFioDisabled
        ? getActiveWalletIds(state).filter(id => !(wallets[id] != null && wallets[id].type === 'wallet:fio'))
        : getActiveWalletIds(state),
      mostRecentWallets: state.ui.settings.mostRecentWallets,
      account: state.core.account,
      defaultIsoFiat: state.ui.settings.defaultIsoFiat,
      customTokens: state.ui.settings.customTokens
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    tokenCreated(walletId: string, tokens: string[]) {
      dispatch({
        type: 'UPDATE_WALLET_ENABLED_TOKENS',
        data: { walletId, tokens }
      })
      dispatch(refreshWallet(walletId))
    }
  })
)(WalletListModalConnected)
export { WalletListModal }
