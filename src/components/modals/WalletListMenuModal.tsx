import { EdgeTokenId } from 'edge-core-js'
import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import {
  walletListMenuAction,
  WalletListMenuKey
} from '../../actions/WalletListMenuActions'
import { Fontello } from '../../assets/vector'
import {
  CURRENCY_SETTINGS_KEYS,
  SPECIAL_CURRENCY_INFO
} from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { WalletsTabSceneProps } from '../../types/routerTypes'
import {
  getCurrencyCode,
  isKeysOnlyPlugin
} from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CryptoIcon } from '../icons/CryptoIcon'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ModalTitle } from '../themed/ModalParts'
import { EdgeModal } from './EdgeModal'

interface Option {
  value: WalletListMenuKey
  label: string
}

interface Props {
  bridge: AirshipBridge<void>
  navigation: WalletsTabSceneProps<'walletList' | 'walletDetails'>['navigation']

  // Wallet identity:
  tokenId: EdgeTokenId
  walletId: string
}

const icons: { [key: string]: string } = {
  delete: 'warning',
  exportWalletTransactions: 'export',
  getRawKeys: 'lock',
  getSeed: 'key',
  goToParent: 'upcircleo',
  manageTokens: 'plus',
  rawDelete: 'warning',
  rename: 'edit',
  resync: 'sync',
  split: 'arrowsalt',
  togglePause: 'pause',
  viewPrivateViewKey: 'eye',
  viewXPub: 'eye',
  settings: 'control-panel-settings'
}

/**
 * Customizes which coins get which options on the wallet list scene.
 */
export const WALLET_LIST_MENU: Array<{
  pluginIds?: string[]
  label: string
  value: WalletListMenuKey
}> = [
  {
    label: lstrings.settings_asset_settings,
    value: 'settings'
  },
  {
    label: lstrings.string_rename,
    value: 'rename'
  },
  {
    label: lstrings.string_resync,
    value: 'resync'
  },
  {
    label: lstrings.fragment_wallets_export_transactions,
    value: 'exportWalletTransactions'
  },
  {
    label: lstrings.string_master_private_key,
    value: 'getSeed'
  },
  {
    label: lstrings.string_add_edit_tokens,
    value: 'manageTokens'
  },
  {
    pluginIds: [
      'bitcoincash',
      'bitcoinsv',
      'bitcoin',
      'bitcoingold',
      'dash',
      'digibyte',
      'dogecoin',
      'eboost',
      'eos',
      'zcoin',
      'feathercoin',
      'groestlcoin',
      'litecoin',
      'qtum',
      'ravencoin',
      'smartcash',
      'bitcointestnet',
      'bitcointestnet4',
      'telos',
      'ufo',
      'vertcoin',
      'wax'
    ],
    label: lstrings.fragment_wallets_view_xpub,
    value: 'viewXPub'
  },
  {
    pluginIds: ['monero', 'piratechain', 'zcash', 'zano'],
    label: lstrings.fragment_wallets_view_private_view_key,
    value: 'viewPrivateViewKey'
  },
  {
    label: lstrings.string_get_raw_keys,
    value: 'getRawKeys'
  },
  {
    label: lstrings.fragment_wallets_split_wallet,
    value: 'split'
  },
  {
    label: lstrings.string_archive_wallet,
    value: 'delete'
  }
]

export function WalletListMenuModal(props: Props) {
  const { bridge, tokenId, navigation, walletId } = props

  const [options, setOptions] = React.useState<Option[]>([])
  const [splitPluginIds, setSplitPluginIds] = React.useState<string[]>([])
  const [loadingOption, setLoadingOption] =
    React.useState<WalletListMenuKey | null>(null)

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const pausedWallets = useSelector(
    state => state.ui.settings.userPausedWalletsSet
  )

  const wallet = useWatch(account, 'currencyWallets')[walletId]

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = () => {
    props.bridge.resolve()
  }

  const optionAction = useHandler(async (option: WalletListMenuKey) => {
    if (loadingOption != null) return // Prevent multiple actions

    setLoadingOption(option)
    try {
      await dispatch(
        walletListMenuAction(
          navigation,
          walletId,
          option,
          tokenId,
          splitPluginIds
        )
      )
      bridge.resolve()
    } catch (error) {
      setLoadingOption(null)
      showError(error)
    }
  })

  useAsyncEffect(
    async () => {
      if (wallet == null) {
        setOptions([
          { label: lstrings.string_get_raw_keys, value: 'getRawKeys' },
          { label: lstrings.string_archive_wallet, value: 'rawDelete' }
        ])
        return
      }

      if (tokenId != null) {
        setOptions([
          {
            label: lstrings.go_to_parent_wallet,
            value: 'goToParent'
          },
          {
            label: lstrings.string_resync,
            value: 'resync'
          },
          {
            label: lstrings.fragment_wallets_export_transactions,
            value: 'exportWalletTransactions'
          },
          {
            label: lstrings.fragment_wallets_delete_token,
            value: 'delete'
          }
        ])
        return
      }

      const result: Option[] = []

      // First add the settings option to make it appear at the top, but only if
      // the plugin supports asset settings
      const settingsOption = WALLET_LIST_MENU.find(
        option => option.value === 'settings'
      )
      const { pluginId } = wallet.currencyInfo
      if (
        settingsOption != null &&
        CURRENCY_SETTINGS_KEYS.includes(pluginId) &&
        account.currencyConfig[pluginId] != null
      ) {
        result.push({
          label: settingsOption.label,
          value: settingsOption.value
        })
      }

      if (pausedWallets != null && !isKeysOnlyPlugin(pluginId)) {
        result.push({
          label: pausedWallets.has(walletId)
            ? lstrings.fragment_wallets_unpause_wallet
            : lstrings.fragment_wallets_pause_wallet,
          value: 'togglePause'
        })
      }

      const splitTypes = await account.listSplittableWalletTypes(wallet.id)
      const splitPluginIds: string[] = []
      for (const splitType of splitTypes) {
        const pluginId = Object.keys(account.currencyConfig).find(
          pluginId =>
            account.currencyConfig[pluginId].currencyInfo.walletType ===
            splitType
        )
        if (pluginId == null) continue
        if (SPECIAL_CURRENCY_INFO[pluginId]?.isSplittingDisabled === true)
          continue
        splitPluginIds.push(pluginId)
      }
      setSplitPluginIds(splitPluginIds)

      for (const option of WALLET_LIST_MENU) {
        const { pluginIds, label, value } = option

        // Skip settings since we already added it
        if (value === 'settings') continue

        if (value === 'split' && splitPluginIds.length <= 0) continue

        if (Array.isArray(pluginIds) && !pluginIds.includes(pluginId)) continue

        // Special case for `manageTokens`. Only allow pluginsIds that have metatokens
        if (value === 'manageTokens') {
          if (
            Object.keys(account.currencyConfig[pluginId].builtinTokens)
              .length === 0
          )
            continue
        }

        // Special case for light accounts. Don't allow `getSeed` or `getRawKeys`
        if (
          account.username == null &&
          (value === 'getSeed' || value === 'getRawKeys')
        )
          continue

        result.push({ label, value })
      }

      setOptions(result)

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
    'WalletListMenuModal'
  )

  return (
    <EdgeModal
      bridge={bridge}
      title={
        wallet == null ? null : (
          <View>
            <ModalTitle paddingRem={[0, 0, 0.5]}>
              {getWalletName(wallet)}
            </ModalTitle>
            <View style={styles.row}>
              <CryptoIcon
                marginRem={[0, 0, 0, 0.5]}
                sizeRem={1}
                tokenId={tokenId}
                pluginId={wallet.currencyInfo.pluginId}
              />
              <ModalTitle>{getCurrencyCode(wallet, tokenId)}</ModalTitle>
            </View>
          </View>
        )
      }
      onCancel={handleCancel}
      scroll
    >
      {options.map((option: Option) => {
        const isLoading = loadingOption === option.value
        const isDisabled = loadingOption != null && !isLoading

        return (
          <EdgeTouchableOpacity
            key={option.value}
            onPress={async () => await optionAction(option.value)}
            style={isDisabled ? [styles.row, styles.disabled] : styles.row}
            disabled={isDisabled}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.primaryText}
                style={styles.optionIcon}
              />
            ) : option.value === 'settings' ? (
              // Special case for settings to keep it consistent with our side
              // menu.
              // We eventually will move to using our own custom icons for all
              // icons instead of picking from different RN vector icon packs
              <Fontello
                name={icons[option.value]}
                style={styles.optionIcon}
                size={theme.rem(1)}
              />
            ) : (
              <AntDesignIcon
                name={icons[option.value]} // for split keys like splitBCH, splitETH, etc.
                size={theme.rem(1)}
                style={
                  option.value === 'delete'
                    ? [styles.optionIcon, styles.warningColor]
                    : styles.optionIcon
                }
              />
            )}
            <Text
              style={[
                option.value === 'delete'
                  ? [styles.optionText, styles.warningColor]
                  : styles.optionText,
                isDisabled && styles.disabled
              ]}
            >
              {option.label}
            </Text>
          </EdgeTouchableOpacity>
        )
      })}
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  disabled: {
    opacity: 0.5
  },
  optionIcon: {
    color: theme.primaryText,
    margin: theme.rem(0.5)
  },
  optionText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    margin: theme.rem(0.5)
  },
  modalCloseButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: theme.rem(4),
    height: theme.rem(3)
  },
  warningColor: {
    color: theme.warningText
  }
}))
