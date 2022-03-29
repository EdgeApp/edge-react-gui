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
import { showError } from '../services/AirshipInstance.js'
import { useTheme } from '../services/ThemeContext.js'
import { type WalletListCreateRowProps, WalletListCreateRow } from '../themed/WalletListCreateRow.js'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow.js'
import { ListModal } from './ListModal'

export type WalletListRowProps = {
  walletId?: string,
  tokenId?: string,
  currencyCode: string,
  pluginId: string,
  displayName: string,
  symbolImage?: string,
  symbolImageDarkMono?: string
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

const getRowsData = async (
  activeWalletIds: string[],
  currencyWallets: EdgeCurrencyWallets,
  currencyConfig: EdgePluginMap<EdgeCurrencyConfig>,
  filterWallet,
  filterCreate
) => {
  const existingPlugins = {}
  const walletRows = []
  const filter = (item: any, pluginId, filter) => filter != null && !filter(item, getSpecialCurrencyInfo(pluginId))

  const getWalletData = async (walletId: string) => {
    // Creating the existing main chain wallet row
    const wallet = currencyWallets[walletId]
    const { currencyCode, displayName, pluginId } = wallet.currencyInfo
    // Save the plugin id to filter it out from the "create wallet" list
    existingPlugins[`${pluginId}.${pluginId}`] = true
    if (filter(wallet, pluginId, filterWallet)) return
    // Get all enabled tokens for a wallet
    const tokenIds: string[] = await wallet.getEnabledTokens()
    // If there isn't any token in the list, we need to add the main chain's currencyCode to the list
    if (tokenIds.length === 0) tokenIds.push(currencyCode)
    // Creating the existing token wallets rows
    for (const tokenId of tokenIds) {
      walletRows.push({ currencyCode: tokenId, walletId, displayName, pluginId })
      // Save the token id to filter it out from the "add token" list
      existingPlugins[`${pluginId}.${tokenId}`] = true
    }
  }

  await Promise.all(activeWalletIds.map(walletid => getWalletData(walletid))).catch(showError)
  const createWalletRows: WalletListRowProps[] = []
  const addTokenRows: WalletListRowProps[] = []

  for (const pluginId of Object.keys(currencyConfig)) {
    // Creating the "create wallet" rows for main chain wallets
    const curriedCurrencyIcon = (tokenId: string = pluginId) => getCurrencyIcon(pluginId, tokenId)
    const { currencyInfo, builtinTokens = {}, customTokens = {} }: EdgeCurrencyConfig = currencyConfig[pluginId]
    const { currencyCode, displayName } = currencyInfo
    if (filter({ tokenId: pluginId, pluginId }, pluginId, filterCreate)) continue
    // Don't add a "create wallet" row if we already have an existing wallet of this type
    if (existingPlugins[`${pluginId}.${pluginId}`] !== true) {
      createWalletRows.unshift({ tokenId: pluginId, currencyCode, displayName, pluginId, ...curriedCurrencyIcon() })
    }
    // Creating the "add token" rows for token wallets
    const allTokens = { ...builtinTokens, ...customTokens }
    Object.keys(allTokens).forEach(tokenId => {
      // Don't add a "add token" row if we already have an existing wallet of this type
      if (existingPlugins[`${pluginId}.${tokenId}`] === true) return
      const { currencyCode, displayName } = allTokens[tokenId]
      if (filter({ tokenId, pluginId }, pluginId, filterCreate)) return
      addTokenRows.unshift({ currencyCode, displayName, tokenId, pluginId, ...curriedCurrencyIcon(tokenId) })
    })
  }
  const result = walletRows.concat(createWalletRows).concat(addTokenRows)
  return result
}

const toRowComponent =
  ({ filterWallet, currencyWallets, filterCreate, currencyConfig, handleSelect }) =>
  (props: WalletListRowProps) => {
    const onPress = (walletId?, currencyCode?) => handleSelect(props)
    const { walletId, tokenId, currencyCode, displayName, pluginId, symbolImage } = props

    // Return a `WalletListCurrencyRow` for existing wallets
    if (walletId != null) {
      return <WalletListCurrencyRow key={walletId} currencyCode={currencyCode} onPress={onPress} walletId={walletId} />
    }
    // Return a `WalletListCreateRow` for non-existing currency wallets
    if (tokenId != null) {
      const createRowProps: { key?: string } & WalletListCreateRowProps = { currencyName: displayName, currencyCode, symbolImage }
      if (tokenId === pluginId) {
        createRowProps.key = pluginId
        createRowProps.walletType = currencyConfig[tokenId].currencyInfo.walletType
      } else {
        createRowProps.key = `${pluginId}.${tokenId}`
        createRowProps.parentCurrencyCode = pluginId
      }

      return <WalletListCreateRow {...createRowProps} />
    }

    return null
  }

export const WalletPickerModal = (props: Props) => {
  const { bridge, headerTitle = s.strings.select_wallet, filterWallet, filterCreate } = props
  const account = useSelector(state => state.core.account)
  const theme = useTheme()
  const { activeWalletIds, currencyWallets, currencyConfig } = account
  // Change the return type when canceling the modal to an empty object
  const onCancel = useCallback(() => bridge.resolve({}), [bridge])

  // Change the return type when canceling the modal to an empty object
  const getRowsPromise = useCallback(
    () => getRowsData(activeWalletIds, currencyWallets, currencyConfig, filterWallet, filterCreate),
    [activeWalletIds, currencyConfig, currencyWallets, filterWallet, filterCreate]
  )
  const [rowsData] = useAsync(getRowsPromise)

  const searchText = useMemo(() => findWallet(activeWalletIds, currencyWallets), [activeWalletIds, currencyWallets])
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
  const searchWalletId = useMemo(() => searchWalletParams(currencyWallets), [currencyWallets])
  const searchTokenId = useMemo(() => searchTokenParams(currencyConfig), [currencyConfig])

  const rowDataFilter = useCallback(
    (filterText, { walletId, tokenId }) => {
      if (walletId != null) return searchWalletId(walletId, filterText)
      if (tokenId != null) return searchTokenId(tokenId, filterText)
      return false
    },
    [searchTokenId, searchWalletId]
  )

  return (
    <ListModal
      bridge={bridge}
      onCancel={onCancel}
      title={headerTitle}
      getItemLayout={(data, index) => ({ length: theme.rem(4.25), offset: theme.rem(4.25) * index, index })}
      label={s.strings.search_wallets}
      rowsData={rowsData.error != null || rowsData.pending ? [] : rowsData.value}
      onSubmitEditing={onSubmitEditing}
      rowComponent={rowComponent}
      rowDataFilter={rowDataFilter}
      onEndReachedThreshold={theme.rem(4.25) * 11}
    />
  )
}
