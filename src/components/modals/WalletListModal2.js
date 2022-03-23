// @flow

import { type EdgeCurrencyConfig, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { type SpecialCurrencyInfo, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { useMemo } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
// import { getCreateWalletTypes, getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { WalletListCreateRow } from '../themed/WalletListCreateRow.js'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow.js'
import { ListModal } from './ListModal'

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

export type WalletListResult = {
  walletId?: string,
  tokenId?: string,
  currencyCode?: string
}

type OwnProps = {
  bridge: AirshipBridge<WalletListResult>,
  headerTitle: string,
  // Filter function for which Existing wallets to allow to pick from
  // Defaults to null which will show all wallets
  filterWallet?: (wallet: EdgeCurrencyWallet, specialCurrencyInfo: SpecialCurrencyInfo) => boolean,
  // Filter function for which non Existing wallets to allow to create
  // Defaults to null which won't show any `create wallet` row
  filterCreate?: (tokenId: string, specialCurrencyInfo: SpecialCurrencyInfo) => boolean
}

type Props = OwnProps

export const WalletPickerModal = (props: Props) => {
  const { bridge, headerTitle, filterWallet, filterCreate } = props

  const activeWalletIds = useSelector(state => state.core.account.activeWalletIds)
  const currencyWallets = useSelector(state => state.core.account.currencyWallets)
  const currencyConfigs = useSelector(state => state.core.account.currencyConfig)

  // const account = useSelector(state => state.core.account)
  // const createWalletTypes = useMemo(() => getCreateWalletTypes(account, true), [account])

  const rowsData: Array<{ walletId?: string, tokenId?: string }> = useMemo(() => {
    const walletRows = activeWalletIds.map(walletId => ({ walletId }))
    return walletRows
  }, [activeWalletIds])

  const rowComponent = ({ walletId, tokenId }) => {
    // Return a `WalletListCurrencyRow` for existing wallets
    if (walletId != null) {
      const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
      const { walletType, currencyCode } = wallet.currencyInfo
      const specialCurrencyInfo = getSpecialCurrencyInfo(walletType)
      if (filterWallet != null && !filterWallet(wallet, specialCurrencyInfo)) return null
      // getEnabledTokens
      return <WalletListCurrencyRow currencyCode={currencyCode} onPress={() => bridge.resolve({ walletId, currencyCode })} walletId={walletId} paddingRem={0} />
    }

    // Return a `WalletListCreateRow` for non-existing tokenId
    if (tokenId != null) {
      const currencyConfig: EdgeCurrencyConfig = currencyConfigs[tokenId]
      const { displayName, walletType, currencyCode, pluginId } = currencyConfig.currencyInfo
      const specialCurrencyInfo = getSpecialCurrencyInfo(tokenId)
      if (filterCreate != null && !filterCreate(tokenId, specialCurrencyInfo)) return null

      const createWalletType = {
        currencyName: displayName,
        walletType,
        currencyCode,
        ...getCurrencyIcon(pluginId)
      }

      return <WalletListCreateRow createWalletType={createWalletType} onPress={(walletId, currencyCode) => bridge.resolve({ walletId, currencyCode })} />
    }
    return null
  }

  const rowDataFilter = (filterText, { walletId, tokenId }) => {
    const searchableParams = []
    const filterString = filterText.replace(' ', '').toLowerCase()
    if (walletId != null) {
      const { name, currencyInfo }: EdgeCurrencyWallet = currencyWallets[walletId]
      searchableParams.push(name ?? '', currencyInfo.displayName, currencyInfo.currencyCode)
    }
    if (tokenId != null) {
      const { currencyInfo }: EdgeCurrencyConfig = currencyConfigs[tokenId]
      searchableParams.push(currencyInfo.displayName, currencyInfo.currencyCode)
    }

    return searchableParams.find(item => item.replace(' ', '').toLowerCase().includes(filterString)) != null
  }

  const handleSubmitEditing = () => {}

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
