import { EdgeAccount, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'
import { ListRenderItem, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { FlatList } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { updateMostRecentWalletsSelected } from '../../actions/WalletActions'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { PaymentMethod, PaymentMethodsMap } from '../../controllers/action-queue/PaymentMethod'
import { useAsyncValue } from '../../hooks/useAsyncValue'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { CustomAsset } from '../rows/CustomAssetRow'
import { PaymentMethodRow } from '../rows/PaymentMethodRow'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ModalTitle } from '../themed/ModalParts'
import { SimpleTextInput } from '../themed/SimpleTextInput'
import { WalletList } from '../themed/WalletList'
import { WalletListCurrencyRow } from '../themed/WalletListCurrencyRow'
import { ButtonsModal } from './ButtonsModal'
import { EdgeModal } from './EdgeModal'

export const ErrorNoMatchingWallets = 'ErrorNoMatchingWallets'
export type WalletListResult =
  | {
      type: 'wallet'
      walletId: string
      tokenId: EdgeTokenId
    }
  | { type: 'wyre'; fiatAccountId: string }
  | { type: 'bankSignupRequest' }
  | { type: 'custom'; customAsset?: CustomAsset }
  // User cancelled.
  // This is consistent with other modals that return `T | undefined`:
  | undefined

interface Props {
  bridge: AirshipBridge<WalletListResult>
  navigation: NavigationBase

  // Filtering:
  allowedAssets?: EdgeAsset[]
  allowedWalletIds?: string[]
  allowKeysOnlyMode?: boolean
  customAssets?: CustomAsset[]
  excludeAssets?: EdgeAsset[]
  excludeWalletIds?: string[]
  filterActivation?: boolean

  // Visuals:
  createWalletId?: string
  headerTitle: string
  showBankOptions?: boolean
  showCreateWallet?: boolean
  parentWalletId?: string
}

const keysOnlyModeAssets: EdgeAsset[] = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => isKeysOnlyPlugin(pluginId))
  .map(pluginId => ({
    pluginId,
    tokenId: null
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
    parentWalletId
  } = props

  // #region Constants

  const showCustomAssets = customAssets != null && customAssets.length > 0

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const theme = useTheme()
  const styles = getStyles(theme)

  // #endregion Constants

  // #region State

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
    return allowKeysOnlyMode ? result : keysOnlyModeAssets.concat(result ?? [])
  }, [allowKeysOnlyMode, excludeAssets])

  // #endregion Init

  // #region Handlers

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })
  const handlePaymentMethodPress = useHandler((fiatAccountId: string) => () => {
    bridge.resolve({ type: 'wyre', fiatAccountId })
  })
  const handleWalletListPress = useHandler(async (walletId: string, tokenId: EdgeTokenId, customAsset?: CustomAsset) => {
    if (walletId === '') {
      handleCancel()
      showError(lstrings.network_alert_title)
    } else if (customAsset != null) {
      bridge.resolve({ type: 'custom', customAsset })
    } else {
      dispatch(updateMostRecentWalletsSelected(walletId, tokenId))
      bridge.resolve({ type: 'wallet', walletId, tokenId })
    }
  })
  const handleSearchClear = useHandler(() => {
    setSearchText('')
  })

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
    if (result === 'continue') await bridge.resolve({ type: 'bankSignupRequest' })
  })

  // #endregion Handlers

  // #region Renderers

  const renderPaymentMethod: ListRenderItem<PaymentMethod> = useHandler(item => {
    return (
      <EdgeTouchableOpacity onPress={handlePaymentMethodPress(item.item.id)}>
        <PaymentMethodRow paymentMethod={item.item} pluginId="wyre" key={item.item.id} />
      </EdgeTouchableOpacity>
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
        <FlatList data={Object.values(bankAccountsMap)} keyboardShouldPersistTaps="handled" renderItem={renderPaymentMethod} keyExtractor={item => item.id} />
      </View>
    )
  }, [bankAccountsMap, handleShowBankPlugin, renderPaymentMethod, showBankOptions, styles.bankMargin])

  const customAssetSection = React.useMemo<React.ReactNode>(() => {
    if (!showCustomAssets) return null
    return (
      <View style={styles.customAssetMargin}>
        <FlatList data={customAssets} keyboardShouldPersistTaps="handled" renderItem={renderCustomAsset} keyExtractor={item => item.referenceTokenId} />
      </View>
    )
  }, [customAssets, renderCustomAsset, showCustomAssets, styles.customAssetMargin])

  // #endregion Renderers

  return (
    <EdgeModal
      bridge={bridge}
      title={
        <View style={styles.header}>
          <ModalTitle>{headerTitle}</ModalTitle>
          <SimpleTextInput
            aroundRem={0.5}
            autoFocus
            returnKeyType="search"
            placeholder={lstrings.search_wallets}
            onChangeText={setSearchText}
            onClear={handleSearchClear}
            value={searchText}
            iconComponent={SearchIconAnimated}
          />
        </View>
      }
      onCancel={handleCancel}
    >
      {bankSection}
      {customAssetSection}
      {showBankOptions || showCustomAssets ? <EdgeText>{lstrings.your_wallets}</EdgeText> : null}
      <WalletList
        allowedAssets={allowedAssets}
        allowedWalletIds={allowedWalletIds}
        excludeAssets={walletListExcludeAssets}
        excludeWalletIds={excludeWalletIds}
        filterActivation={filterActivation}
        searchText={searchText}
        showCreateWallet={showCreateWallet}
        createWalletId={createWalletId}
        parentWalletId={parentWalletId}
        onPress={handleWalletListPress}
        navigation={navigation}
      />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  header: {
    flexGrow: 1
  },
  bankMargin: {
    flex: 1,
    marginBottom: theme.rem(1),
    marginTop: theme.rem(-1)
  },
  customAssetMargin: {
    flex: 1,
    marginBottom: theme.rem(1),
    marginTop: theme.rem(-0.5)
  }
}))

// Given a list of assets, shows a modal for a user to pick a wallet for that asset.
// If only one wallet exists for that asset, auto pick that wallet
export const pickWallet = async (args: {
  account: EdgeAccount
  assets?: EdgeAsset[]
  headerTitle?: string
  navigation: NavigationBase
  showCreateWallet?: boolean
}): Promise<WalletListResult> => {
  const { account, assets = [], headerTitle = lstrings.select_wallet, navigation, showCreateWallet } = args
  const { currencyWallets } = account

  const matchingWallets: Array<{ walletId: string; tokenId: EdgeTokenId }> = []
  const matchingAssets: EdgeAsset[] = []

  for (const asset of assets) {
    const { pluginId, tokenId } = asset
    for (const walletId of Object.keys(currencyWallets)) {
      const wallet = currencyWallets[walletId]
      const pluginIdMatch = wallet.currencyInfo.pluginId === pluginId

      // No wallet with matching pluginId, fail this asset
      if (!pluginIdMatch) continue
      if (tokenId == null) {
        matchingWallets.push({ walletId, tokenId })
        matchingAssets.push(asset)
        continue
      }
      // See if this wallet has a matching token enabled
      const tokenIdMatch = wallet.enabledTokenIds.find(tid => tokenId)

      if (tokenIdMatch != null) {
        matchingWallets.push({ walletId, tokenId })
        matchingAssets.push(asset)
        continue
      }
    }
  }

  // If there are not matching wallets and we can't create any wallets then error
  if (showCreateWallet !== true && matchingWallets.length === 0) {
    throw new Error(ErrorNoMatchingWallets)
  }

  if (matchingWallets.length === 1) {
    // Only one matching wallet and asset. Auto pick the wallet and token
    const { walletId, tokenId } = matchingWallets[0]
    return { type: 'wallet', walletId, tokenId }
  } else {
    // There is more than one match or we don't have a wallet for this asset. Launch the picker
    const walletListResult = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={navigation} headerTitle={headerTitle} allowedAssets={assets} showCreateWallet={showCreateWallet} />
    ))
    return walletListResult
  }
}
