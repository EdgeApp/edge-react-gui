import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { PaymentMethod, PaymentMethodsMap } from '../../controllers/action-queue/WyreClient'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { BooleanMap, EdgeTokenId } from '../../types/types'
import { getCurrencyCode, isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { CustomAsset } from '../data/row/CustomAssetRow'
import { PaymentMethodRow } from '../data/row/PaymentMethodRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ModalFooterFade, ModalTitle } from '../themed/ModalParts'
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
}

const KeysOnlyModeTokenIds: EdgeTokenId[] = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => isKeysOnlyPlugin(pluginId))
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
    showCreateWallet
  } = props

  // #region Constants

  const showCustomAssets = customAssets != null && customAssets.length > 0

  const account = useSelector(state => state.core.account)
  const theme = useTheme()
  const styles = getStyles(theme)

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

  // Prevent plugins that are "watch only" from being used unless it's explicitly allowed
  const walletListExcludeAssets = React.useMemo(() => {
    const result = excludeAssets
    return allowKeysOnlyMode ? result : KeysOnlyModeTokenIds.concat(result ?? [])
  }, [allowKeysOnlyMode, excludeAssets])

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
      showError(lstrings.network_alert_title)
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
        title={lstrings.deposit_to_bank}
        message={sprintf(lstrings.wallet_list_modal_confirm_s_bank_withdrawal, config.appName)}
        buttons={{
          continue: { label: lstrings.legacy_address_modal_continue }
        }}
      />
    ))
    if (result === 'continue') await bridge.resolve({ isBankSignupRequest: true })
  })

  // #endregion Handlers

  // #region Renderers

  const renderPaymentMethod: ListRenderItem<PaymentMethod> = useHandler(item => {
    return (
      <TouchableOpacity onPress={handlePaymentMethodPress(item.item.id)}>
        <PaymentMethodRow paymentMethod={item.item} pluginId="wyre" key={item.item.id} />
      </TouchableOpacity>
    )
  })

  const renderCustomAsset: ListRenderItem<CustomAsset> = useHandler(item => {
    return <WalletListCurrencyRow wallet={item.item.wallet} tokenId={item.item.referenceTokenId} customAsset={item.item} onPress={handleWalletListPress} />
  })

  const bankSection = React.useMemo<React.ReactNode>(() => {
    if (bankAccountsMap == null) return null
    if (!showBankOptions) return null
    if (Object.keys(bankAccountsMap).length === 0) {
      return <MainButton label={lstrings.deposit_to_bank} marginRem={[0, 0.75, 1.5, 0.75]} type="secondary" onPress={handleShowBankPlugin} />
    }
    return (
      <View style={styles.bankMargin}>
        <FlashList
          estimatedItemSize={theme.rem(4.25)}
          data={Object.values(bankAccountsMap)}
          keyboardShouldPersistTaps="handled"
          renderItem={renderPaymentMethod}
          keyExtractor={item => item.id}
        />
      </View>
    )
  }, [bankAccountsMap, handleShowBankPlugin, renderPaymentMethod, showBankOptions, styles.bankMargin, theme])

  const customAssetSection = React.useMemo<React.ReactNode>(() => {
    if (!showCustomAssets) return null
    return (
      <View style={styles.customAssetMargin}>
        <FlashList
          estimatedItemSize={theme.rem(4.25)}
          data={customAssets}
          keyboardShouldPersistTaps="handled"
          renderItem={renderCustomAsset}
          keyExtractor={item => item.referenceTokenId}
        />
      </View>
    )
  }, [customAssets, renderCustomAsset, showCustomAssets, styles.customAssetMargin, theme])

  // #endregion Renderers

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle center>{headerTitle}</ModalTitle>
      {bankSection}
      {customAssetSection}
      {showBankOptions || showCustomAssets ? <EdgeText>{lstrings.your_wallets}</EdgeText> : null}
      <OutlinedTextInput
        returnKeyType="search"
        label={lstrings.search_wallets}
        onChangeText={setSearchText}
        onFocus={handleSearchFocus}
        onBlur={handleSearchUnfocus}
        onClear={handleSearchClear}
        value={searchText}
        marginRem={[0.5, 0, 1.25, 0]}
        searchIcon
      />
      <View style={styles.walletsMargin}>
        <WalletList
          allowedAssets={allowedAssets}
          allowedWalletIds={allowedWalletIds}
          excludeAssets={walletListExcludeAssets}
          excludeWalletIds={excludeWalletIds}
          filterActivation={filterActivation}
          searching={searching}
          searchText={searchText}
          showCreateWallet={showCreateWallet}
          createWalletId={createWalletId}
          onPress={handleWalletListPress}
          navigation={navigation}
        />
        <ModalFooterFade />
      </View>
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  bankMargin: {
    flex: 1,
    marginBottom: theme.rem(1),
    marginHorizontal: theme.rem(-1),
    marginTop: theme.rem(-1)
  },
  customAssetMargin: {
    flex: 1,
    marginBottom: theme.rem(1),
    marginHorizontal: theme.rem(-1),
    marginTop: theme.rem(-0.5)
  },
  walletsMargin: {
    flex: 1,
    marginHorizontal: theme.rem(-1)
  }
}))

// Given a list of assets, shows a modal for a user to pick a wallet for that asset.
// If only one wallet exists for that asset, auto pick that wallet
export const pickWallet = async ({
  account,
  allowedWalletIds,
  assets,
  headerTitle = lstrings.select_wallet,
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
