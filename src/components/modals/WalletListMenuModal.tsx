import { EdgeTokenId } from 'edge-core-js'
import React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { walletListMenuAction, WalletListMenuKey } from '../../actions/WalletListMenuActions'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { getCurrencyCode, getCurrencyInfos, isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ModalTitle } from '../themed/ModalParts'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { ModalUi4 } from '../ui4/ModalUi4'

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

const icons = {
  delete: 'warning',
  exportWalletTransactions: 'export',
  getRawKeys: 'lock',
  getSeed: 'key',
  manageTokens: 'plus',
  rawDelete: 'warning',
  rename: 'edit',
  resync: 'sync',
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
    label: lstrings.string_archive_wallet,
    value: 'delete'
  }
]

export function WalletListMenuModal(props: Props) {
  const { bridge, tokenId, navigation, walletId } = props

  const [options, setOptions] = React.useState<Option[]>([])

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const pausedWallets = useSelector(state => state.ui.settings.userPausedWalletsSet)

  const wallet = useWatch(account, 'currencyWallets')[walletId]

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = () => props.bridge.resolve()

  const optionAction = useHandler((option: WalletListMenuKey) => {
    bridge.resolve()
    dispatch(walletListMenuAction(navigation, walletId, option, tokenId)).catch(error => showError(error))
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

      for (const option of WALLET_LIST_MENU) {
        const { pluginIds, label, value } = option

        if (Array.isArray(pluginIds) && !pluginIds.includes(pluginId)) continue

        // Special case for `manageTokens`. Only allow pluginsIds that have metatokens
        if (value === 'manageTokens') {
          if (Object.keys(account.currencyConfig[pluginId].builtinTokens).length === 0) continue
        }

        // Special case for light accounts. Don't allow `getSeed` or `getRawKeys`
        if (account.username == null && (value === 'getSeed' || value === 'getRawKeys')) continue

        result.push({ label, value })
      }

      const splittable = await account.listSplittableWalletTypes(wallet.id)

      const currencyInfos = getCurrencyInfos(account)
      for (const splitWalletType of splittable) {
        const info = currencyInfos.find(({ walletType }) => walletType === splitWalletType)
        if (info == null || getSpecialCurrencyInfo(info.pluginId).isSplittingDisabled) continue
        result.push({ label: sprintf(lstrings.string_split_wallet, info.displayName), value: `split${info.pluginId}` })
      }

      setOptions(result)

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
    'WalletListMenuModal'
  )

  return (
    <ModalUi4
      bridge={bridge}
      title={
        wallet == null ? null : (
          <View>
            <ModalTitle paddingRem={[0, 0, 0.5]}>{getWalletName(wallet)}</ModalTitle>
            <View style={styles.row}>
              <CryptoIconUi4 marginRem={[0, 0, 0, 0.5]} sizeRem={1} tokenId={tokenId} walletId={walletId} />
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
            // @ts-expect-error
            name={icons[option.value] ?? 'arrowsalt'} // for split keys like splitBCH, splitETH, etc.
            size={theme.rem(1)}
            style={option.value === 'delete' ? [styles.optionIcon, styles.warningColor] : styles.optionIcon}
          />
          <Text style={option.value === 'delete' ? [styles.optionText, styles.warningColor] : styles.optionText}>{option.label}</Text>
        </EdgeTouchableOpacity>
      ))}
    </ModalUi4>
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
