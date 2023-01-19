import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { PaymentMethodsMap } from '../../controllers/action-queue/WyreClient'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import s from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { BooleanMap, EdgeTokenId } from '../../types/types'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { makeCurrencyCodeTable } from '../../util/utils'
import { CustomAsset } from '../data/row/CurrencyRow'
import { PaymentMethodRow } from '../data/row/PaymentMethodRow'
import { Airship, showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { ThemedModal } from '../themed/ThemedModal'
import { WalletList } from '../themed/WalletList'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow'
import { ButtonsModal } from './ButtonsModal'

export interface WalletListResult {
  currencyCode?: string
  tokenId?: string
  walletId?: string

  // Wyre buy/sell
  isBankSignupRequest?: boolean
  fiatAccountId?: string

  // Custom asset selection
  customAsset?: CustomAsset
}

interface Props {
  bridge: AirshipBridge<WalletListResult>
  navigation: NavigationBase

  // Filtering:
  allowedAssets?: EdgeTokenId[]
  allowedWalletIds?: string[]
  allowKeysOnlyMode?: boolean
  customAssets?: CustomAsset[]
  excludeAssets?: EdgeTokenId[]
  excludeWalletIds?: string[]
  filterActivation?: boolean

  // Visuals:
  createWalletId?: string
  headerTitle: string
  showBankOptions?: boolean
  showCreateWallet?: boolean

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
    navigation,

    // Filtering:
    allowedAssets,
    allowKeysOnlyMode = false,
    allowedWalletIds,
    customAssets,
    excludeAssets,
    excludeWalletIds,
    filterActivation,

    // Visuals:
    createWalletId,
    headerTitle,
    showBankOptions = false,
    showCreateWallet,

    // Deprecated:
    allowedCurrencyCodes,
    excludeCurrencyCodes
  } = props

  // #region Constants

  const showCustomAssets = customAssets != null && customAssets.length > 0

  const account = useSelector(state => state.core.account)
  const theme = useTheme()

  // #endregion Constants

  // #region State

  const [searching, setSearching] = React.useState(false)
  const [searchText, setSearchText] = React.useState('')

  const [bankAccountsMap] = useAsyncValue(async (): Promise<PaymentMethodsMap | null> => {
    // TODO: Re-enable once new fiat ramp partner is re-integrated
    return null
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
  const handlePaymentMethodPress = useHandler((fiatAccountId: string) => () => {
    bridge.resolve({ fiatAccountId })
  })
  const handleWalletListPress = useHandler((walletId: string, currencyCode: string, _tokenId?: string, customAsset?: CustomAsset) => {
    if (walletId === '') {
      handleCancel()
      showError(s.strings.network_alert_title)
    } else bridge.resolve({ walletId, currencyCode, customAsset })
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

  const renderCustomAsset = useHandler(item => {
    return <WalletListCurrencyRow wallet={item.item.wallet} tokenId={item.tokenId} customAsset={item.item} onPress={handleWalletListPress} />
  })

  const renderBankSection = () => {
    if (bankAccountsMap == null) return null
    if (!showBankOptions) return null
    if (Object.keys(bankAccountsMap).length === 0) return renderBankSignupButton()
    return (
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
    )
  }

  const renderCustomAssetSection = () =>
    showCustomAssets ? (
      <View>
        <FlatList
          data={customAssets}
          keyboardShouldPersistTaps="handled"
          renderItem={renderCustomAsset}
          getItemLayout={handleItemLayout}
          keyExtractor={item => item.referenceTokenId}
          style={sidesToMargin(mapSides(fixSides([-0.5, -1, 1, -1], 0), theme.rem))}
        />
      </View>
    ) : null

  // #endregion Renderers

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle center>{headerTitle}</ModalTitle>
      {renderBankSection()}
      {renderCustomAssetSection()}
      {showBankOptions || showCustomAssets ? <EdgeText>{s.strings.your_wallets}</EdgeText> : null}
      <OutlinedTextInput
        returnKeyType="search"
        label={s.strings.search_wallets}
        onChangeText={setSearchText}
        onFocus={handleSearchFocus}
        onBlur={handleSearchUnfocus}
        onClear={handleSearchClear}
        value={searchText}
        marginRem={[0.5, 0, 1.25, 0]}
        searchIcon
      />
      <WalletList
        allowedAssets={allowedAssets ?? legacyAllowedAssets}
        allowedWalletIds={allowedWalletIds}
        excludeAssets={walletListExcludeAssets}
        excludeWalletIds={excludeWalletIds}
        filterActivation={filterActivation}
        marginRem={listMargin}
        searching={searching}
        searchText={searchText}
        showCreateWallet={showCreateWallet}
        createWalletId={createWalletId}
        onPress={handleWalletListPress}
        navigation={navigation}
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

// Given a list of assets, shows a modal for a user to pick a wallet for that asset.
// If only one wallet exists for that asset, auto pick that wallet
export const pickWallet = async ({
  account,
  allowedWalletIds,
  assets,
  headerTitle = s.strings.select_wallet,
  navigation,
  showCreateWallet
}: {
  account: EdgeAccount
  allowedWalletIds?: string[]
  assets?: EdgeTokenId[]
  headerTitle?: string
  navigation: NavigationBase
  showCreateWallet?: boolean
}): Promise<WalletListResult | undefined> => {
  const { currencyWallets } = account

  const walletIdMap: BooleanMap = {}

  // Check if user owns any wallets that
  const matchingAssets = (assets ?? []).filter(asset => {
    const matchingWalletIds: string[] = Object.keys(currencyWallets).filter(key => {
      const { pluginId, tokenId } = asset
      const currencyWallet = currencyWallets[key]
      const pluginIdMatch = currencyWallet.currencyInfo.pluginId === pluginId

      // No wallet with matching pluginId, fail this asset
      if (!pluginIdMatch) return false
      if (tokenId == null) {
        walletIdMap[key] = true
        return true
      }
      // See if this wallet has a matching token enabled
      const tokenIdMatch = currencyWallet.enabledTokenIds.find(tid => tokenId)
      if (tokenIdMatch != null) {
        const cc = getCurrencyCode(currencyWallet, tokenIdMatch)
        walletIdMap[`${key}:${cc}`] = true
        return true
      }
      return false
    })
    return matchingWalletIds.length !== 0
  })

  if (assets != null && matchingAssets.length === 0) return

  if (assets != null && matchingAssets.length === 1 && Object.keys(walletIdMap).length === 1) {
    // Only one matching wallet and asset. Auto pick the wallet
    const [walletId, currencyCode] = Object.keys(walletIdMap)[0].split(':')
    return { walletId, currencyCode }
  } else {
    const walletListResult = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal
        bridge={bridge}
        navigation={navigation}
        headerTitle={headerTitle}
        allowedWalletIds={allowedWalletIds}
        allowedAssets={assets}
        showCreateWallet={showCreateWallet}
      />
    ))
    return walletListResult
  }
}
