import { EdgeTokenId } from 'edge-core-js'
import React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { walletListMenuAction, WalletListMenuKey } from '../../actions/WalletListMenuActions'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { getCurrencyCode, isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
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
  navigation: NavigationProp<'walletList'> | NavigationProp<'transactionList'>

  // Wallet identity:
  tokenId: EdgeTokenId
  walletId: string
}

const icons: { [key: string]: string } = {
  delete: 'warning',
  exportWalletTransactions: 'export',
  getRawKeys: 'lock',
  getSeed: 'key',
  manageTokens: 'plus',
  rawDelete: 'warning',
  rename: 'edit',
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
      'telos',
      'ufo',
      'vertcoin',
      'wax'
    ],
    label: lstrings.fragment_wallets_view_xpub,
    value: 'viewXPub'
  },
  {
    pluginIds: ['monero', 'piratechain', 'zcash'],
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

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const pausedWallets = useSelector(state => state.ui.settings.userPausedWalletsSet)

  const wallet = useWatch(account, 'currencyWallets')[walletId]

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = () => props.bridge.resolve()

  const optionAction = useHandler((option: WalletListMenuKey) => {
    bridge.resolve()
    dispatch(walletListMenuAction(navigation, walletId, option, tokenId, splitPluginIds)).catch(error => showError(error))
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
      if (pausedWallets != null && !isKeysOnlyPlugin(pluginId)) {
        result.push({
          label: pausedWallets.has(walletId) ? lstrings.fragment_wallets_unpause_wallet : lstrings.fragment_wallets_pause_wallet,
          value: 'togglePause'
        })
      }

      const splitTypes = await account.listSplittableWalletTypes(wallet.id)
      const splitPluginIds: string[] = []
      for (const splitType of splitTypes) {
        const pluginId = Object.keys(account.currencyConfig).find(pluginId => account.currencyConfig[pluginId].currencyInfo.walletType === splitType)
        if (pluginId == null) continue
        if (SPECIAL_CURRENCY_INFO[pluginId]?.isSplittingDisabled === true) continue
        splitPluginIds.push(pluginId)
      }
      setSplitPluginIds(splitPluginIds)

      for (const option of WALLET_LIST_MENU) {
        const { pluginIds, label, value } = option

        if (value === 'split' && splitPluginIds.length <= 0) continue

        if (Array.isArray(pluginIds) && !pluginIds.includes(pluginId)) continue

        // Special case for `manageTokens`. Only allow pluginsIds that have metatokens
        if (value === 'manageTokens') {
          if (Object.keys(account.currencyConfig[pluginId].builtinTokens).length === 0) continue
        }

        // Special case for light accounts. Don't allow `getSeed` or `getRawKeys`
        if (account.username == null && (value === 'getSeed' || value === 'getRawKeys')) continue

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
            <ModalTitle paddingRem={[0, 0, 0.5]}>{getWalletName(wallet)}</ModalTitle>
            <View style={styles.row}>
              <CryptoIcon marginRem={[0, 0, 0, 0.5]} sizeRem={1} tokenId={tokenId} walletId={walletId} />
              <ModalTitle>{getCurrencyCode(wallet, tokenId)}</ModalTitle>
            </View>
          </View>
        )
      }
      onCancel={handleCancel}
      scroll
    >
      {options.map((option: Option) => (
        <EdgeTouchableOpacity key={option.value} onPress={() => optionAction(option.value)} style={styles.row}>
          <AntDesignIcon
            name={icons[option.value]} // for split keys like splitBCH, splitETH, etc.
            size={theme.rem(1)}
            style={option.value === 'delete' ? [styles.optionIcon, styles.warningColor] : styles.optionIcon}
          />
          <Text style={option.value === 'delete' ? [styles.optionText, styles.warningColor] : styles.optionText}>{option.label}</Text>
        </EdgeTouchableOpacity>
      ))}
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  row: {
    alignItems: 'center',
    flexDirection: 'row'
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
