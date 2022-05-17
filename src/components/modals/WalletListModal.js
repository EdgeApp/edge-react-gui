// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler.js'
import s from '../../locales/strings.js'
import { useMemo, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type EdgeTokenId } from '../../types/types.js'
import { makeCurrencyCodeTable } from '../../util/utils.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { WalletList } from '../themed/WalletList.js'

export type WalletListResult = {
  walletId?: string,
  currencyCode?: string
}

type Props = {|
  bridge: AirshipBridge<WalletListResult>,

  // Filtering:
  allowedAssets?: EdgeTokenId[],
  excludeAssets?: EdgeTokenId[],
  excludeWalletIds?: string[],
  filterActivation?: boolean,

  // Visuals:
  headerTitle: string,
  showCreateWallet?: boolean,

  // Deprecated. Use `allowedAssets` and `excludeAssets` instead.
  // Valid formats include "ETH", "REP", or "ETH-REP",
  // and an empty list is the same as an undefined list:
  allowedCurrencyCodes?: string[],
  excludeCurrencyCodes?: string[]
|}

export function WalletListModal(props: Props) {
  const {
    bridge,

    // Filtering:
    allowedAssets,
    excludeAssets,
    excludeWalletIds,
    filterActivation,

    // Visuals:
    headerTitle,
    showCreateWallet,

    // Deprecated:
    allowedCurrencyCodes,
    excludeCurrencyCodes
  } = props

  const account = useSelector(state => state.core.account)
  const [searching, setSearching] = useState(false)
  const [searchText, setSearchText] = useState('')

  // Upgrade deprecated props:
  const [legacyAllowedAssets, legacyExcludeAssets] = useMemo(() => {
    if (allowedCurrencyCodes == null && excludeCurrencyCodes == null) return []

    const lookup = makeCurrencyCodeTable(account)
    const allowedAssets = upgradeCurrencyCodes(lookup, allowedCurrencyCodes)
    const excludeAssets = upgradeCurrencyCodes(lookup, excludeCurrencyCodes)

    return [allowedAssets, excludeAssets]
  }, [account, allowedCurrencyCodes, excludeCurrencyCodes])

  const handleCancel = useHandler(() => {
    bridge.resolve({})
  })
  const handlePress = useHandler((walletId: string, currencyCode: string) => {
    bridge.resolve({ walletId, currencyCode })
  })
  const handleSearchClear = useHandler(() => {
    setSearchText('')
    setSearching(false)
  })
  const handleSearchUnfocus = useHandler(() => setSearching(searchText.length > 0))
  const handleSearchFocus = useHandler(() => setSearching(true))

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle center>{headerTitle}</ModalTitle>
      <OutlinedTextInput
        returnKeyType="search"
        label={s.strings.search_wallets}
        onChangeText={setSearchText}
        onFocus={handleSearchFocus}
        onBlur={handleSearchUnfocus}
        onClear={handleSearchClear}
        value={searchText}
        marginRem={[0.5, 0.75, 1.25]}
        searchIcon
      />
      <WalletList
        allowedAssets={allowedAssets ?? legacyAllowedAssets}
        excludeAssets={excludeAssets ?? legacyExcludeAssets}
        excludeWalletIds={excludeWalletIds}
        filterActivation={filterActivation}
        marginRem={listMargin}
        searching={searching}
        searchText={searchText}
        showCreateWallet={showCreateWallet}
        onPress={handlePress}
      />
      <ModalCloseArrow onPress={handleCancel} />
    </ThemedModal>
  )
}

const listMargin = [0, -1]

/**
 * Precisely identify the assets named by a currency-code array.
 * Accepts plain currency codes, such as "ETH" or "REP",
 * but also scoped currency codes like "ETH-REP".
 *
 * The goal is to delete this once the wallet stops using this legacy format
 * internally.
 */
export function upgradeCurrencyCodes(lookup: (currencyCode: string) => EdgeTokenId[], currencyCodes?: string[]): EdgeTokenId[] | void {
  if (currencyCodes == null || currencyCodes.length === 0) return

  const out: EdgeTokenId[] = []
  for (const currencyCode of currencyCodes) {
    const [parentCode, tokenCode] = currencyCode.split('-')

    if (tokenCode == null) {
      // It's a plain code, like "REP", so add all matches:
      out.push(...lookup(parentCode))
    } else {
      // It's a scoped code, like "ETH-REP", so filter using the parent:
      const parent = lookup(parentCode).find(match => match.tokenId == null)
      if (parent == null) continue
      out.push(...lookup(tokenCode).filter(match => match.pluginId === parent.pluginId))
    }
  }
  return out
}
