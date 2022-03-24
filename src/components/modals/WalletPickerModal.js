// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { type SpecialCurrencyInfo, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { WalletListCreateRow } from '../themed/WalletListCreateRow.js'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow.js'
import { ListModal } from './ListModal'

export type WalletListRowData = {
  walletId?: string,
  tokenId?: string,
  currencyCode?: string
}

type OwnProps = {
  bridge: AirshipBridge<WalletListRowData>,
  headerTitle: string,
  // Filter function for which Existing wallets to allow to pick from
  // Defaults to null which will show all wallets
  filterWallet?: (wallet: EdgeCurrencyWallet, specialCurrencyInfo: SpecialCurrencyInfo) => boolean,
  // Filter function for which non Existing wallets to allow to create
  // Defaults to null which won't show any `create wallet` row
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

  useEffect(() => {
    const getRows = async () => {
      const selectWalletRows: WalletListRowData[] = []

      for (const walletId of activeWalletIds) {
        const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
        const tokens: string[] = await wallet.getEnabledTokens()
        if (tokens.length === 0) tokens.push(wallet.currencyInfo.currencyCode)
        const wallets = tokens.map(currencyCode => ({ currencyCode, walletId }))
        selectWalletRows.push(...wallets)
      }

      const createWalletRows: WalletListRowData[] = []
      const addTokenRows: WalletListRowData[] = []

      for (const pluginId of Object.keys(currencyConfig)) {
        if (currencyConfig[pluginId] == null) continue
        const { currencyInfo, builtinTokens = {}, customTokens = {} }: EdgeCurrencyConfig = currencyConfig[pluginId]
        createWalletRows.push({ tokenId: pluginId, currencyCode: currencyInfo.currencyCode })
        const builtinRows = Object.keys(builtinTokens).map(tokenId => ({ tokenId }))
        const customRows = Object.keys(customTokens).map(tokenId => ({ tokenId }))

        addTokenRows.push(...builtinRows, ...customRows)
      }

      const rows = selectWalletRows.concat(createWalletRows).concat(addTokenRows)

      setRowsData(rows)
    }
    getRows()
  }, [activeWalletIds, currencyConfig, currencyWallets])

  const rowComponent = ({ walletId, tokenId, currencyCode }) => {
    // Return a `WalletListCurrencyRow` for existing wallets
    if (walletId != null) {
      const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
      const { walletType, currencyCode: chainCode } = wallet.currencyInfo
      const specialCurrencyInfo = getSpecialCurrencyInfo(walletType)
      if (filterWallet != null && !filterWallet(wallet, specialCurrencyInfo)) return null
      // console.log('82. currencyCode', currencyCode)
      return <WalletListCurrencyRow currencyCode={currencyCode ?? chainCode} onPress={() => bridge.resolve({ walletId, currencyCode })} walletId={walletId} />
    }

    // Return a `WalletListCreateRow` for non-existing tokenId
    if (tokenId != null) {
      console.log('106. tokenId', tokenId)
      if (currencyConfig[tokenId] == null) return null
      const { currencyInfo }: EdgeCurrencyConfig = currencyConfig[tokenId]

      const { displayName, walletType, currencyCode, pluginId } = currencyInfo
      const specialCurrencyInfo = getSpecialCurrencyInfo(walletType)
      if (filterCreate != null && !filterCreate(tokenId, specialCurrencyInfo)) return null
      const onPress = (walletId, currencyCode) => bridge.resolve({ walletId, currencyCode })

      if (tokenId === pluginId) {
        const createWalletType = {
          currencyName: displayName,
          walletType,
          currencyCode,
          ...getCurrencyIcon(pluginId)
        }
        return <WalletListCreateRow createWalletType={createWalletType} onPress={onPress} />
      }

      // const createTokenType = {
      //   currencyCode,
      //   currencyName: displayName,
      //   ...getCurrencyIcon(pluginId),
      //   parentCurrencyCode: pluginId
      // }

      // return <WalletListCreateRow createTokenType={createTokenType} onPress={onPress} />
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
    if (walletId == null) return bridge.resolve({})
    const { currencyCode } = currencyWallets[walletId].currencyInfo
    return bridge.resolve({ walletId, currencyCode })
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

// const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
// const tokens = wallet.getEnabledTokens()
// const account = useSelector(state => state.core.account)
// const createWalletTypes = useMemo(() => getCreateWalletTypes(account, true), [account])
// import { useEffect, useState } from '../../types/reactHooks.js'
// import { getCreateWalletTypes, getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'

// export type CreateWalletType = {
//   currencyName: string,
//   walletType: string,
//   symbolImage?: string,
//   symbolImageDarkMono?: string,
//   currencyCode: string
// }

// export type CreateTokenType = {
//   currencyCode: string,
//   currencyName: string,
//   symbolImage?: string,
//   parentCurrencyCode: string
// }
