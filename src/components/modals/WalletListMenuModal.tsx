import AntDesignIcon from '@expo/vector-icons/AntDesign'
import type { EdgeTokenId } from 'edge-core-js'
import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import {
  walletListMenuAction,
  type WalletListMenuKey
} from '../../actions/WalletListMenuActions'
import { Fontello } from '../../assets/vector'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import type { WalletsTabSceneProps } from '../../types/routerTypes'
import {
  getCurrencyCode,
  isKeysOnlyPlugin
} from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { CryptoIcon } from '../icons/CryptoIcon'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'
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

const icons: Record<string, string> = {
  delete: 'warning',
  exportWalletTransactions: 'export',
  getRawKeys: 'lock',
  getSeed: 'key',
  goToParent: 'upcircleo',
  manageTokens: 'plus',
  rawDelete: 'warning',
  signMessage: 'edit',
  walletSettings: 'control-panel-settings',
  resync: 'sync',
  split: 'arrowsalt',
  togglePause: 'pause',
  viewPrivateViewKey: 'eye',
  viewXPub: 'eye'
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
    label: lstrings.wallet_settings_title,
    value: 'walletSettings'
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
    pluginIds: [
      'badcoin',
      'bitcoin',
      'bitcoincash',
      'bitcoincashtestnet',
      'bitcoingold',
      'bitcoingoldtestnet',
      'bitcoinsv',
      'bitcointestnet',
      'bitcointestnet4',
      'dash',
      'digibyte',
      'dogecoin',
      'eboost',
      'ecash',
      'feathercoin',
      'groestlcoin',
      'litecoin',
      'pivx',
      'qtum',
      'ravencoin',
      'smartcash',
      'ufo',
      'vertcoin',
      'zcoin'
    ],
    label: lstrings.fragment_wallets_sign_message,
    value: 'signMessage'
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

export const WalletListMenuModal: React.FC<Props> = props => {
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
  const developerModeOn = useSelector(
    state => state.ui.settings.developerModeOn
  )

  const wallet = useWatch(account, 'currencyWallets')[walletId]

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = (): void => {
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
      const { pluginId } = wallet.currencyInfo

      // Wallet Settings first
      const walletSettingsOption = WALLET_LIST_MENU.find(
        option => option.value === 'walletSettings'
      )
      if (walletSettingsOption != null) {
        result.push({
          label: walletSettingsOption.label,
          value: walletSettingsOption.value
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

        // Skip the option we already added at the top
        if (value === 'walletSettings') continue

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

        // Hide `getRawKeys` behind Developer Mode. Wallets that fail to load
        // still expose raw keys via the `wallet == null` branch above, so a
        // broken wallet can always be recovered regardless of this setting.
        if (value === 'getRawKeys' && !developerModeOn) continue

        result.push({ label, value })
      }

      setOptions(result)
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
            testID={`walletListMenu_${option.value}`}
            onPress={async () => {
              await optionAction(option.value)
            }}
            style={isDisabled ? [styles.row, styles.disabled] : styles.row}
            disabled={isDisabled}
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={theme.primaryText}
                style={styles.optionIcon}
              />
            ) : option.value === 'walletSettings' ? (
              // Special case for the settings gear to keep it consistent with
              // our side menu.
              // We eventually will move to using our own custom icons for all
              // icons instead of picking from different RN vector icon packs
              <Fontello
                name={icons[option.value]}
                style={styles.optionIcon}
                size={theme.rem(1)}
              />
            ) : (
              <AntDesignIcon
                name={
                  icons[option.value] as React.ComponentProps<
                    typeof AntDesignIcon
                  >['name']
                } // for split keys like splitBCH, splitETH, etc.
                size={theme.rem(1)}
                style={
                  option.value === 'delete'
                    ? [styles.optionIcon, styles.warningColor]
                    : styles.optionIcon
                }
              />
            )}
            <UnscaledText
              style={[
                option.value === 'delete'
                  ? [styles.optionText, styles.warningColor]
                  : styles.optionText,
                isDisabled && styles.disabled
              ]}
            >
              {option.label}
            </UnscaledText>
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
