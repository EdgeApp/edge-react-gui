// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { type SpecialCurrencyInfo, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { useCallback, useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { WalletListCreateRow } from '../themed/WalletListCreateRow.js'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow.js'
import { ListModal } from './ListModal'

export type WalletListRowData = {
  walletId?: string,
  tokenId?: string,
  currencyCode: string,
  pluginId: string,
  displayName: string
}

type OwnProps = {
  bridge: AirshipBridge<WalletListRowData | null>,
  headerTitle: string,
  // Filter function for which Existing wallets to allow to pick from
  // Defaults to show all wallet rows
  filterWallet?: (wallet: EdgeCurrencyWallet, specialCurrencyInfo: SpecialCurrencyInfo) => boolean,
  // Filter function for which non Existing wallets to allow to create
  // Defaults to not show any `create wallet` row
  filterCreate?: (tokenId: string, specialCurrencyInfo: SpecialCurrencyInfo) => boolean
}

type Props = OwnProps

const findParams = filterText => {
  const filterString = filterText.replace(' ', '').toLowerCase()
  return params => params.find(item => item.replace(' ', '').toLowerCase().includes(filterString)) != null
}

export const WalletPickerModal = (props: Props) => {
  const { bridge, headerTitle, filterWallet, filterCreate } = props
  const [rowsData, setRowsData] = useState([])
  const account = useSelector(state => state.core.account)
  const { activeWalletIds, currencyWallets, currencyConfig } = account

  const walletSearchParams = walletId => {
    const { name, currencyInfo }: EdgeCurrencyWallet = currencyWallets[walletId]
    return [name ?? '', currencyInfo.displayName, currencyInfo.currencyCode]
  }

  const tokenSearchParams = tokenId => {
    const { currencyInfo }: EdgeCurrencyConfig = currencyConfig[tokenId]
    return [currencyInfo.displayName, currencyInfo.currencyCode]
  }

  const getRows = useCallback(async () => {
    const selectWalletRows: WalletListRowData[] = []
    for (const walletId of activeWalletIds) {
      const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
      const { currencyCode, displayName, pluginId } = wallet.currencyInfo
      const tokens: string[] = await wallet.getEnabledTokens()
      if (tokens.length === 0) tokens.push(currencyCode)
      const wallets = tokens.map(currencyCode => ({ currencyCode, walletId, displayName, pluginId }))
      selectWalletRows.push(...wallets)
    }

    const createWalletRows: WalletListRowData[] = []
    const addTokenRows: WalletListRowData[] = []

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

    const rows = selectWalletRows.concat(createWalletRows).concat(addTokenRows)

    setRowsData(rows)
  }, [activeWalletIds, currencyConfig, currencyWallets])

  useEffect(() => {
    if (rowsData.length > 0) return
    getRows()
  }, [getRows, rowsData])

  const rowComponent = tokenData => {
    const onPress = (walletId?, currencyCode?) => bridge.resolve(tokenData)
    const { walletId, tokenId, currencyCode, displayName, pluginId } = tokenData
    const specialCurrencyInfo = getSpecialCurrencyInfo(pluginId)
    // Return a `WalletListCurrencyRow` for existing wallets
    if (walletId != null) {
      if (filterWallet != null && !filterWallet(currencyWallets[walletId], specialCurrencyInfo)) return null
      return <WalletListCurrencyRow currencyCode={currencyCode} onPress={onPress} walletId={walletId} />
    }

    // Return a `WalletListCreateRow` for non-existing currency wallets
    if (tokenId != null) {
      if (filterCreate != null && !filterCreate(tokenId, specialCurrencyInfo)) return null
      const createData = { currencyName: displayName, currencyCode }
      const createRowProps = {}
      // Main chain Currencies
      if (tokenId === pluginId) {
        createRowProps.createWalletType = {
          ...createData,
          walletType: currencyConfig[tokenId]?.currencyInfo?.walletType,
          ...getCurrencyIcon(pluginId)
        }
      } else {
        // Tokens
        createRowProps.createTokenType = {
          ...createData,
          parentCurrencyCode: pluginId,
          ...getCurrencyIcon(pluginId, tokenId)
        }
      }

      return <WalletListCreateRow {...createRowProps} onPress={onPress} />
    }

    return null
  }

  const rowDataFilter = (filterText, { walletId, tokenId }) => {
    const filter = findParams(filterText)
    if (walletId != null) return filter(walletSearchParams(walletId))
    if (tokenId != null) return filter(tokenSearchParams(tokenId))
    return false
  }

  const handleSubmitEditing = filterText => {
    const filter = findParams(filterText)
    const walletId = activeWalletIds.find(walletId => filter(walletSearchParams(walletId)))
    if (walletId == null) return bridge.resolve(null)
    const { currencyCode, displayName, pluginId } = currencyWallets[walletId].currencyInfo
    return bridge.resolve({ walletId, currencyCode, displayName, pluginId, tokenId: pluginId })
  }

  return (
    <ListModal
      bridge={bridge}
      title={headerTitle}
      label={s.strings.search_wallets}
      rowsData={rowsData}
      onSubmitEditing={handleSubmitEditing}
      rowComponent={rowComponent}
      rowDataFilter={rowDataFilter}
    />
  )
}
