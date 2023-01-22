import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { walletListMenuAction, WalletListMenuKey } from '../../actions/WalletListMenuActions'
import { getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useWatch } from '../../hooks/useWatch'
import s from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { getCurrencyCode, getCurrencyInfos } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

interface Option {
  value: WalletListMenuKey
  label: string
}

interface Props {
  bridge: AirshipBridge<void>
  navigation: NavigationProp<'walletList'> | NavigationProp<'transactionList'>

  // Wallet identity:
  tokenId?: string
  walletId: string
}

const icons = {
  delete: 'warning',
  rawDelete: 'warning',
  exportWalletTransactions: 'export',
  getRawKeys: 'lock',
  getSeed: 'key',
  manageTokens: 'plus',
  rename: 'edit',
  resync: 'sync',
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
    label: s.strings.string_rename,
    value: 'rename'
  },
  {
    label: s.strings.string_resync,
    value: 'resync'
  },
  {
    label: s.strings.fragment_wallets_export_transactions,
    value: 'exportWalletTransactions'
  },
  {
    label: s.strings.string_master_private_key,
    value: 'getSeed'
  },
  {
    pluginIds: Object.keys(SPECIAL_CURRENCY_INFO).filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isCustomTokensSupported),
    label: s.strings.string_add_edit_tokens,
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
      'wax',
      'monero',
      'piratechain',
      'zcash'
    ],
    label: s.strings.fragment_wallets_view_xpub,
    value: 'viewXPub'
  },
  {
    label: s.strings.string_get_raw_keys,
    value: 'getRawKeys'
  },
  {
    label: s.strings.string_archive_wallet,
    value: 'delete'
  }
]

export function WalletListMenuModal(props: Props) {
  const { bridge, tokenId, navigation, walletId } = props

  const [options, setOptions] = React.useState<Option[]>([])

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const wallet = useWatch(account, 'currencyWallets')[walletId]

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = () => props.bridge.resolve()

  const optionAction = (option: WalletListMenuKey) => {
    dispatch(walletListMenuAction(navigation, walletId, option, tokenId))
    bridge.resolve()
  }

  useAsyncEffect(async () => {
    if (wallet == null) {
      setOptions([
        { label: s.strings.string_get_raw_keys, value: 'getRawKeys' },
        { label: s.strings.string_archive_wallet, value: 'rawDelete' }
      ])
      return
    }

    if (tokenId != null) {
      setOptions([
        {
          label: s.strings.string_resync,
          value: 'resync'
        },
        {
          label: s.strings.fragment_wallets_export_transactions,
          value: 'exportWalletTransactions'
        },
        {
          label: s.strings.fragment_wallets_delete_wallet,
          value: 'delete'
        }
      ])
      return
    }

    const result: Option[] = []

    const splittable = await account.listSplittableWalletTypes(wallet.id)

    const currencyInfos = getCurrencyInfos(account)
    for (const splitWalletType of splittable) {
      const info = currencyInfos.find(({ walletType }) => walletType === splitWalletType)
      if (info == null || getSpecialCurrencyInfo(info.pluginId).isSplittingDisabled) continue
      result.push({ label: sprintf(s.strings.string_split_wallet, info.displayName), value: `split${info.currencyCode}` })
    }

    const { pluginId } = wallet.currencyInfo
    for (const option of WALLET_LIST_MENU) {
      const { pluginIds, label, value } = option

      if (Array.isArray(pluginIds) && !pluginIds.includes(pluginId)) continue
      result.push({ label, value })
    }
    setOptions(result)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      {wallet != null && (
        <View>
          <ModalTitle>{getWalletName(wallet)}</ModalTitle>
          <View style={styles.row}>
            <CryptoIcon marginRem={[0, 0, 0, 0.5]} sizeRem={1} tokenId={tokenId} walletId={walletId} />
            <ModalTitle>{getCurrencyCode(wallet, tokenId)}</ModalTitle>
          </View>
        </View>
      )}

      {options.map((option: Option) => (
        <TouchableOpacity key={option.value} onPress={() => optionAction(option.value)} style={styles.row}>
          <AntDesignIcon
            // @ts-expect-error
            name={icons[option.value] ?? 'arrowsalt'} // for split keys like splitBCH, splitETH, etc.
            size={theme.rem(1)}
            style={option.value === 'delete' ? [styles.optionIcon, styles.warningColor] : styles.optionIcon}
          />
          <Text style={option.value === 'delete' ? [styles.optionText, styles.warningColor] : styles.optionText}>{option.label}</Text>
        </TouchableOpacity>
      ))}
      <ModalCloseArrow onPress={handleCancel} />
    </ThemedModal>
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
  warningColor: {
    color: theme.warningText
  }
}))
