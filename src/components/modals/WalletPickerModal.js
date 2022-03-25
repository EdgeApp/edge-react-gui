// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet, type EdgePluginMap } from 'edge-core-js'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { type SpecialCurrencyInfo, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import { useAsync } from '../../hooks/useAsync.js'
import s from '../../locales/strings.js'
import { useCallback, useMemo } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { WalletListCreateRow } from '../themed/WalletListCreateRow.js'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow.js'
import { ListModal } from './ListModal'

export type WalletListRowProps = {
  walletId?: string,
  tokenId?: string,
  currencyCode: string,
  pluginId: string,
  displayName: string
}

type EdgeCurrencyWallets = { [walletId: string]: EdgeCurrencyWallet }

type OwnProps = {
  bridge: AirshipBridge<$Shape<WalletListRowProps>>,
  // Defaults to 'Select Wallet'
  headerTitle?: string,
  // Filter function for which Existing wallets to allow to pick from
  // Defaults to show all wallet rows
  filterWallet?: (wallet: EdgeCurrencyWallet, specialCurrencyInfo: SpecialCurrencyInfo) => boolean,
  // Filter function for which non Existing wallets to allow to create
  // Defaults to not show any `create wallet` row
  filterCreate?: ({ tokenId: string, pluginId: string }, specialCurrencyInfo: SpecialCurrencyInfo) => boolean
}

type Props = OwnProps

const findParams = (params: string[], filterText: string) => {
  const filterString = filterText.replace(' ', '').toLowerCase()
  return params.find(item => item.replace(' ', '').toLowerCase().includes(filterString)) != null
}

const searchWalletParams = (currencyWallets: EdgeCurrencyWallets = {}) => {
  return (walletId: string, filterText: string) => {
    const { name, currencyInfo }: EdgeCurrencyWallet = currencyWallets[walletId]
    return findParams([name ?? '', currencyInfo.displayName, currencyInfo.currencyCode], filterText)
  }
}

const searchTokenParams = (currencyConfig: EdgePluginMap<EdgeCurrencyConfig> = {}) => {
  return (tokenId: string, filterText: string) => {
    const {
      currencyInfo: { displayName, currencyCode }
    } = currencyConfig[tokenId]
    return findParams([displayName, currencyCode], filterText)
  }
}

const findWallet = (activeWalletIds: string[], currencyWallets: EdgeCurrencyWallets) => {
  const search = searchWalletParams(currencyWallets)
  return filterText => {
    const walletId = activeWalletIds.find(walletId => search(walletId, filterText))
    if (walletId == null) return null
    const { currencyCode, displayName, pluginId } = currencyWallets[walletId].currencyInfo
    return { walletId, currencyCode, displayName, pluginId, tokenId: pluginId }
  }
}

const dataFilter = (currencyWallets: EdgeCurrencyWallets, currencyConfig: EdgePluginMap<EdgeCurrencyConfig>) => {
  const searchIds = { walletId: searchWalletParams(currencyWallets), tokenId: searchTokenParams(currencyConfig) }
  return (filterText, rowData) => {
    for (const id of Object.keys(searchIds)) {
      const search = searchIds[id]
      const rowId = rowData[id]
      if (rowId != null) return search(rowId, filterText)
    }
    return false
  }
}

const getRowsData = async (activeWalletIds: string[], currencyWallets: EdgeCurrencyWallets, currencyConfig: EdgePluginMap<EdgeCurrencyConfig>) => {
  const selectWalletRows: WalletListRowProps[] = []
  for (const walletId of activeWalletIds) {
    const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
    const { currencyCode, displayName, pluginId } = wallet.currencyInfo
    const tokens: string[] = await wallet.getEnabledTokens()
    if (tokens.length === 0) tokens.push(currencyCode)
    const wallets = tokens.map(currencyCode => ({ currencyCode, walletId, displayName, pluginId }))
    selectWalletRows.push(...wallets)
  }

  const createWalletRows: WalletListRowProps[] = []
  const addTokenRows: WalletListRowProps[] = []

  for (const pluginId of Object.keys(currencyConfig)) {
    const { currencyInfo, builtinTokens = {}, customTokens = {} }: EdgeCurrencyConfig = currencyConfig[pluginId]
    const { currencyCode, displayName } = currencyInfo
    createWalletRows.unshift({ tokenId: pluginId, currencyCode, displayName, pluginId })
    const allTokens = { ...builtinTokens, ...customTokens }
    const tokenRows = Object.keys(allTokens).map(tokenId => {
      const { currencyCode, displayName } = allTokens[tokenId]
      return { currencyCode, displayName, tokenId, pluginId }
    })
    addTokenRows.unshift(...tokenRows)
  }

  return selectWalletRows.concat(createWalletRows).concat(addTokenRows)
}

const toRowComponent =
  ({ filterWallet, currencyWallets, filterCreate, currencyConfig, handleSelect }) =>
  (props: WalletListRowProps) => {
    const onPress = (walletId?, currencyCode?) => handleSelect(props)
    const { walletId, tokenId, currencyCode, displayName, pluginId } = props
    const specialCurrencyInfo = getSpecialCurrencyInfo(pluginId)

    // Return a `WalletListCurrencyRow` for existing wallets
    if (walletId != null) {
      if (filterWallet != null && !filterWallet(currencyWallets[walletId], specialCurrencyInfo)) return null
      return <WalletListCurrencyRow currencyCode={currencyCode} onPress={onPress} walletId={walletId} />
    }

    // Return a `WalletListCreateRow` for non-existing currency wallets
    if (tokenId != null) {
      if (filterCreate != null && !filterCreate({ tokenId, pluginId }, specialCurrencyInfo)) return null
      const curriedCurrencyIcon = (tokenId: string = pluginId) => getCurrencyIcon(pluginId, tokenId)
      const createData = { currencyName: displayName, currencyCode }
      // Main chain Currencies
      if (tokenId === pluginId) {
        const { walletType } = currencyConfig[tokenId].currencyInfo
        return <WalletListCreateRow createWalletType={{ ...createData, walletType, ...curriedCurrencyIcon() }} onPress={onPress} />
      } else {
        // Tokens
        return <WalletListCreateRow createTokenType={{ ...createData, parentCurrencyCode: pluginId, ...curriedCurrencyIcon(tokenId) }} onPress={onPress} />
      }
    }

    return null
  }

export const WalletPickerModal = (props: Props) => {
  const { bridge, headerTitle = s.strings.select_wallet, filterWallet, filterCreate } = props
  const account = useSelector(state => state.core.account)

  const { activeWalletIds, currencyWallets, currencyConfig } = account
  const searchText = useMemo(() => findWallet(activeWalletIds, currencyWallets), [activeWalletIds, currencyWallets])
  const getRowsPromise = useCallback(() => getRowsData(activeWalletIds, currencyWallets, currencyConfig), [activeWalletIds, currencyConfig, currencyWallets])

  const rowsData = useAsync(getRowsPromise)

  const onCancel = useCallback(() => bridge.resolve({}), [bridge])
  const onSubmitEditing = useCallback(
    filterText => {
      const result = searchText(filterText)
      result != null ? bridge.resolve(result) : bridge.reject(new Error(filterText))
    },
    [bridge, searchText]
  )
  const rowComponent = useMemo(
    () => toRowComponent({ activeWalletIds, currencyWallets, currencyConfig, filterWallet, filterCreate, handleSelect: bridge.resolve }),
    [activeWalletIds, currencyWallets, currencyConfig, filterWallet, filterCreate, bridge]
  )
  const rowDataFilter = useMemo(() => dataFilter(currencyWallets, currencyConfig), [currencyWallets, currencyConfig])
  return (
    <ListModal
      bridge={bridge}
      onCancel={onCancel}
      title={headerTitle}
      label={s.strings.search_wallets}
      rowsData={rowsData.error != null || rowsData.pending ? [] : rowsData.value}
      onSubmitEditing={onSubmitEditing}
      rowComponent={rowComponent}
      rowDataFilter={rowDataFilter}
    />
  )
}
