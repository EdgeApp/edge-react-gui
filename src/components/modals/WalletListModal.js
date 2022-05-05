// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import s from '../../locales/strings.js'
import { useCallback, useState } from '../../types/reactHooks.js'
import { type EdgeTokenIdExtended } from '../../types/types.js'
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
  allowedCurrencyCodes?: string[] | EdgeTokenIdExtended[],
  excludeCurrencyCodes?: string[],
  excludeWalletIds?: string[],
  filterActivation?: boolean,

  // Visuals:
  headerTitle: string,
  showCreateWallet?: boolean
|}

export function WalletListModal(props: Props) {
  const {
    bridge,

    // Filtering:
    allowedCurrencyCodes,
    excludeCurrencyCodes,
    excludeWalletIds,
    filterActivation,

    // Visuals:
    headerTitle,
    showCreateWallet
  } = props

  const [searching, setSearching] = useState(false)
  const [searchText, setSearchText] = useState('')

  const handleCancel = useCallback(() => {
    bridge.resolve({})
  }, [bridge])
  const handlePress = useCallback(
    (walletId: string, currencyCode: string) => {
      bridge.resolve({ walletId, currencyCode })
    },
    [bridge]
  )
  const handleClearText = useCallback(() => setSearchText(''), [])
  const handleTextFieldBlur = useCallback(() => setSearching(false), [])
  const handleTextFieldFocus = useCallback(() => setSearching(true), [])

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle center>{headerTitle}</ModalTitle>
      <OutlinedTextInput
        returnKeyType="search"
        label={s.strings.search_wallets}
        onChangeText={setSearchText}
        onFocus={handleTextFieldFocus}
        onBlur={handleTextFieldBlur}
        onClear={handleClearText}
        value={searchText}
        marginRem={[0.5, 0.75, 1.25]}
        searchIcon
      />
      <WalletList
        allowedCurrencyCodes={allowedCurrencyCodes}
        excludeCurrencyCodes={excludeCurrencyCodes}
        excludeWalletIds={excludeWalletIds}
        filterActivation={filterActivation}
        isModal
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
