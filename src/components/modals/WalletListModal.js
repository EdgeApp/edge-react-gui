// @flow

import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import { makeWyreClient } from '../../controllers/action-queue/WyreClient.js'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler.js'
import { useRowLayout } from '../../hooks/useRowLayout'
import s from '../../locales/strings.js'
import { useMemo, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type EdgeTokenId } from '../../types/types.js'
import { makeCurrencyCodeTable } from '../../util/utils.js'
import { PaymentMethodRow } from '../data/row/PaymentMethodRow'
import { showError } from '../services/AirshipInstance.js'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { WalletList } from '../themed/WalletList.js'

export type WalletListResult = {
  walletId?: string,
  currencyCode?: string,
  tokenId?: string,

  // Wyre buy/sell
  isBankSignupRequest?: boolean,
  wyreAccountId?: string
}

type Props = {|
  bridge: AirshipBridge<WalletListResult>,

  // Filtering:
  allowedAssets?: EdgeTokenId[],
  excludeAssets?: EdgeTokenId[],
  excludeWalletIds?: string[],
  filterActivation?: boolean,
  allowKeysOnlyMode?: boolean,

  // Visuals:
  headerTitle: string,
  showWithdrawToBank?: boolean,
  showCreateWallet?: boolean,
  createWalletId?: string,

  // Deprecated. Use `allowedAssets` and `excludeAssets` instead.
  // Valid formats include "ETH", "REP", or "ETH-REP",
  // and an empty list is the same as an undefined list:
  allowedCurrencyCodes?: string[],
  excludeCurrencyCodes?: string[]
|}

const KeysOnlyModeTokenIds: EdgeTokenId[] = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId].keysOnlyMode ?? false)
  .map(pluginId => ({
    pluginId
  }))

export function WalletListModal(props: Props) {
  const {
    bridge,

    // Filtering:
    allowedAssets,
    excludeAssets,
    excludeWalletIds,
    filterActivation,
    allowKeysOnlyMode = false,

    // Visuals:
    headerTitle,
    showWithdrawToBank = false,
    showCreateWallet,
    createWalletId,

    // Deprecated:
    allowedCurrencyCodes,
    excludeCurrencyCodes
  } = props

  // #region Constants
  const account = useSelector(state => state.core.account)
  // #endregion Constants

  // #region State
  const [searching, setSearching] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [bankAccountsMap, setBankAccountsMap] = useState()

  useAsyncEffect(async () => {
    const wyreClient = await makeWyreClient({ account })
    if (wyreClient.isAccountSetup) {
      setBankAccountsMap(await wyreClient.getPaymentMethods())
    }
  })
  // #endregion State

  // #region Init - Upgrade deprecated props

  const [legacyAllowedAssets, legacyExcludeAssets] = useMemo(() => {
    if (allowedCurrencyCodes == null && excludeCurrencyCodes == null) return []

    const lookup = makeCurrencyCodeTable(account.currencyConfig)
    const allowedAssets = upgradeCurrencyCodes(lookup, allowedCurrencyCodes)
    const excludeAssets = upgradeCurrencyCodes(lookup, excludeCurrencyCodes)

    return [allowedAssets, excludeAssets]
  }, [account, allowedCurrencyCodes, excludeCurrencyCodes])

  // #endregion Init - Upgrade deprecated props

  // #region Handlers

  const handleCancel = useHandler(() => {
    bridge.resolve({})
  })
  const handleWalletListPress = useHandler((walletId: string, currencyCode: string) => {
    if (walletId === '') {
      handleCancel()
      showError(s.strings.network_alert_title)
    } else bridge.resolve({ walletId, currencyCode })
  })
  const handleSearchClear = useHandler(() => {
    setSearchText('')
    setSearching(false)
  })
  const handleSearchUnfocus = useHandler(() => setSearching(searchText.length > 0))
  const handleSearchFocus = useHandler(() => setSearching(true))

  // Pull up the signup workflow on the calling scene if the user does not yet have a linked bank account
  const handleShowBankPlugin = useHandler(() => bridge.resolve({ isBankSignupRequest: true }))

  const handleItemLayout = useRowLayout()

  // #endregion Handlers

  // #region Dependent Constants

  // Prevent plugins that are "watch only" from being used unless it's explicitly allowed
  const walletListExcludeAssets = useMemo(() => {
    const result = excludeAssets ?? legacyExcludeAssets
    return allowKeysOnlyMode ? result : KeysOnlyModeTokenIds.concat(result ?? [])
  }, [allowKeysOnlyMode, excludeAssets, legacyExcludeAssets])

  // #region Bank Button/Row Display
  const bankSignupButton = <MainButton label={s.strings.deposit_to_bank} type="secondary" onPress={handleShowBankPlugin} marginRem={[0.5, 0.75, 1.5, 0.75]} />
  const renderPaymentMethod = useHandler(item => {
    return <PaymentMethodRow paymentMethod={item.item} pluginId="wyre" />
  })

  // TODO: Fix spacings
  const bankSection = showWithdrawToBank ? (
    <>
      {bankAccountsMap == null || Object.keys(bankAccountsMap).length === 0 ? (
        bankSignupButton
      ) : (
        <FlatList
          data={Object.values(bankAccountsMap)}
          keyboardShouldPersistTaps="handled"
          renderItem={renderPaymentMethod}
          getItemLayout={handleItemLayout}
          keyExtractor={item => item.pluginId}
        />
      )}
      <EdgeText>{s.strings.deposit_to_edge}</EdgeText>
    </>
  ) : null
  // #endregion Bank Button/Row Display

  // #endregion Dependent Constants

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle center>{headerTitle}</ModalTitle>
      <View
        style={{
          width: '100%',
          padding: 0
        }}
      >
        {bankSection}
      </View>
      <OutlinedTextInput
        returnKeyType="search"
        label={s.strings.search_wallets}
        onChangeText={setSearchText}
        onFocus={handleSearchFocus}
        onBlur={handleSearchUnfocus}
        onClear={handleSearchClear}
        value={searchText}
        marginRem={[1, 0.75, 1.25]}
        searchIcon
      />
      <WalletList
        allowedAssets={allowedAssets ?? legacyAllowedAssets}
        excludeAssets={walletListExcludeAssets}
        excludeWalletIds={excludeWalletIds}
        filterActivation={filterActivation}
        marginRem={listMargin}
        searching={searching}
        searchText={searchText}
        showCreateWallet={showCreateWallet}
        createWalletId={createWalletId}
        onPress={handleWalletListPress}
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
