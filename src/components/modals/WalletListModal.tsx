import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { makeWyreClient, PaymentMethodsMap } from '../../controllers/action-queue/WyreClient'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import s from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeTokenId } from '../../types/types'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { makeCurrencyCodeTable } from '../../util/utils'
import { PaymentMethodRow } from '../data/row/PaymentMethodRow'
import { Airship, showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { ThemedModal } from '../themed/ThemedModal'
import { WalletList } from '../themed/WalletList'
import { ButtonsModal } from './ButtonsModal'

export type WalletListResult = {
  walletId?: string
  currencyCode?: string
  tokenId?: string

  // Wyre buy/sell
  isBankSignupRequest?: boolean
  wyreAccountId?: string
}

type Props = {
  bridge: AirshipBridge<WalletListResult>

  // Filtering:
  allowedAssets?: EdgeTokenId[]
  excludeAssets?: EdgeTokenId[]
  excludeWalletIds?: string[]
  filterActivation?: boolean
  allowKeysOnlyMode?: boolean

  // Visuals:
  headerTitle: string
  showWithdrawToBank?: boolean
  showCreateWallet?: boolean
  createWalletId?: string

  // Deprecated. Use `allowedAssets` and `excludeAssets` instead.
  // Valid formats include "ETH", "REP", or "ETH-REP",
  // and an empty list is the same as an undefined list:
  allowedCurrencyCodes?: string[]
  excludeCurrencyCodes?: string[]
}

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
  const theme = useTheme()

  // #endregion Constants

  // #region State

  const [searching, setSearching] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')

  const [bankAccountsMap] = useAsyncValue(async (): Promise<PaymentMethodsMap> => {
    const wyreClient = await makeWyreClient({ account })
    if (!wyreClient.isAccountSetup) return {}
    return await wyreClient.getPaymentMethods()
  }, [account])

  // #endregion State

  // #region Init

  // Upgrade deprecated props
  const [legacyAllowedAssets, legacyExcludeAssets] = React.useMemo(() => {
    if (allowedCurrencyCodes == null && excludeCurrencyCodes == null) return []

    const lookup = makeCurrencyCodeTable(account.currencyConfig)
    const allowedAssets = upgradeCurrencyCodes(lookup, allowedCurrencyCodes)
    const excludeAssets = upgradeCurrencyCodes(lookup, excludeCurrencyCodes)

    return [allowedAssets, excludeAssets]
  }, [account, allowedCurrencyCodes, excludeCurrencyCodes])

  // Prevent plugins that are "watch only" from being used unless it's explicitly allowed
  const walletListExcludeAssets = React.useMemo(() => {
    const result = excludeAssets ?? legacyExcludeAssets
    return allowKeysOnlyMode ? result : KeysOnlyModeTokenIds.concat(result ?? [])
  }, [allowKeysOnlyMode, excludeAssets, legacyExcludeAssets])

  // #endregion Init

  // #region Handlers

  const handleCancel = useHandler(() => {
    bridge.resolve({})
  })
  const handlePaymentMethodPress = useHandler((paymentMethodId: string) => () => {
    bridge.resolve({ wyreAccountId: paymentMethodId })
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
  const handleShowBankPlugin = useHandler(async () => {
    const result = await Airship.show<'continue' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.deposit_to_bank}
        message={sprintf(s.strings.wallet_list_modal_confirm_s_bank_withdrawal, config.appName)}
        buttons={{
          continue: { label: s.strings.legacy_address_modal_continue }
        }}
      />
    ))
    if (result === 'continue') await bridge.resolve({ isBankSignupRequest: true })
  })

  const handleItemLayout = useRowLayout()

  // #endregion Handlers

  // #region Renderers

  const renderBankSignupButton = () => (
    <MainButton label={s.strings.deposit_to_bank} type="secondary" onPress={handleShowBankPlugin} marginRem={[0, 0.75, 1.5, 0.75]} />
  )

  const renderPaymentMethod = useHandler(item => {
    return (
      <TouchableOpacity onPress={handlePaymentMethodPress(item.item.id)}>
        <PaymentMethodRow paymentMethod={item.item} pluginId="wyre" key={item.item.id} />
      </TouchableOpacity>
    )
  })

  const renderBankSection = () =>
    showWithdrawToBank ? (
      <>
        {bankAccountsMap == null || Object.keys(bankAccountsMap).length === 0 ? (
          renderBankSignupButton()
        ) : (
          <View>
            <FlatList
              data={Object.values(bankAccountsMap)}
              keyboardShouldPersistTaps="handled"
              renderItem={renderPaymentMethod}
              getItemLayout={handleItemLayout}
              keyExtractor={item => item.id}
              style={sidesToMargin(mapSides(fixSides([-1, -1, 1, -0.5], 0), theme.rem))}
            />
          </View>
        )}
        <EdgeText>{s.strings.deposit_to_edge}</EdgeText>
      </>
    ) : null

  // #endregion Renderers

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle center>{headerTitle}</ModalTitle>
      {renderBankSection()}
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
export function upgradeCurrencyCodes(lookup: (currencyCode: string) => EdgeTokenId[], currencyCodes?: string[]): EdgeTokenId[] | undefined {
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
