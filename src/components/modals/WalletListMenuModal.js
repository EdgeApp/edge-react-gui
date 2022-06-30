// @flow

import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { type WalletListMenuKey, walletListMenuAction } from '../../actions/WalletListMenuActions.js'
import { getSpecialCurrencyInfo, WALLET_LIST_MENU } from '../../constants/WalletAndCurrencyConstants.js'
import { useWatchAccount } from '../../hooks/useWatch.js'
import s from '../../locales/strings.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type NavigationProp } from '../../types/routerTypes.js'
import { getCurrencyCode, getCurrencyInfos } from '../../util/CurrencyInfoHelpers.js'
import { CryptoIcon } from '../icons/CryptoIcon.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type Option = {
  value: WalletListMenuKey,
  label: string
}

type Props = {
  bridge: AirshipBridge<null>,
  navigation: NavigationProp<'walletList'>,

  // Wallet identity:
  tokenId?: string,
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

const getWalletOptions = async (params: { wallet: EdgeCurrencyWallet, tokenId?: string, account: EdgeAccount }): Promise<Option[]> => {
  const { wallet, tokenId, account } = params

  if (wallet == null) {
    return [
      { label: s.strings.string_get_raw_keys, value: 'getRawKeys' },
      { label: s.strings.string_archive_wallet, value: 'rawDelete' }
    ]
  }

  if (tokenId != null) {
    return [
      {
        label: s.strings.string_resync,
        value: 'resync'
      },
      {
        label: s.strings.fragment_wallets_export_transactions,
        value: 'exportWalletTransactions'
      }
    ]
  }

  const result = []

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
  return result
}

export function WalletListMenuModal(props: Props) {
  const { bridge, tokenId, navigation, walletId } = props

  const [options, setOptions] = useState([])

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const wallet = useWatchAccount(account, 'currencyWallets')[walletId]

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = () => props.bridge.resolve(null)

  const optionAction = (option: WalletListMenuKey) => {
    dispatch(walletListMenuAction(navigation, walletId, option, tokenId))
    bridge.resolve(null)
  }

  useEffect(() => {
    getWalletOptions({ wallet, tokenId, account }).then(options => setOptions(options))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      {wallet != null && (
        <View>
          <ModalTitle>{wallet.name}</ModalTitle>
          <View style={styles.row}>
            <CryptoIcon marginRem={[0, 0, 0, 0.5]} sizeRem={1} tokenId={tokenId} walletId={walletId} />
            <ModalTitle>{getCurrencyCode(wallet, tokenId)}</ModalTitle>
          </View>
        </View>
      )}

      {options.map((option: Option) => (
        <TouchableOpacity key={option.value} onPress={() => optionAction(option.value)} style={styles.row}>
          <AntDesignIcon
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
