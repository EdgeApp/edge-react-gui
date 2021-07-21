// @flow

import { type EdgeAccount } from 'edge-core-js'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { sprintf } from 'sprintf-js'

import { type WalletListMenuKey, walletListMenuAction } from '../../actions/WalletListMenuActions.js'
import { WALLET_LIST_MENU } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { getCurrencyInfos } from '../../util/CurrencyInfoHelpers.js'
import { useDispatch, useEffect, useSelector, useState } from '../../util/hooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { type AirshipBridge } from './modalParts'
type Option = {
  value: WalletListMenuKey,
  label: string
}

type Props = {
  bridge: AirshipBridge<null>,
  currencyCode?: string,
  image?: string,
  isToken?: boolean,
  walletId: string,
  walletName?: string
}

const icons = {
  delete: 'warning',
  exportWalletTransactions: 'export',
  getRawKeys: 'lock',
  getSeed: 'key',
  manageTokens: 'plus',
  rename: 'edit',
  resync: 'sync',
  split: 'arrowsalt',
  viewXPub: 'eye'
}

const getWalletOptions = async (params: {
  walletId: string,
  walletName?: string,
  currencyCode?: string,
  isToken?: boolean,
  account: EdgeAccount
}): Promise<Option[]> => {
  const { walletId, currencyCode, isToken, account } = params

  if (!currencyCode) {
    return [{ label: s.strings.string_get_raw_keys, value: 'getRawKeys' }]
  }

  if (isToken) {
    return [{ label: s.strings.fragment_wallets_export_transactions, value: 'exportWalletTransactions' }]
  }

  const result = []

  const splittable = await account.listSplittableWalletTypes(walletId)

  for (const splitWalletType of splittable) {
    if (splitWalletType === 'wallet:bitcoingold') continue // TODO: Remove after fixing BTG splitting
    const info = getCurrencyInfos(account).find(({ walletType }) => walletType === splitWalletType)

    result.push({ label: sprintf(s.strings.string_split_wallet, info?.displayName), value: 'split' })
  }

  for (const option of WALLET_LIST_MENU) {
    const { currencyCodes, label, value } = option

    if (Array.isArray(currencyCodes) && !currencyCodes.includes(currencyCode)) continue

    result.push({ label, value })
  }
  return result
}

export function WalletListMenuModal(props: Props) {
  const { bridge, walletName, walletId, image, currencyCode, isToken } = props

  const [options, setOptions] = useState([])

  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const wallets = useSelector(state => state.ui.wallets.byId)

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = () => props.bridge.resolve(null)

  const optionAction = (option: WalletListMenuKey) => {
    if (currencyCode == null && wallets[walletId] != null) {
      dispatch(walletListMenuAction(walletId, option, wallets[walletId].currencyCode))
    } else {
      dispatch(walletListMenuAction(walletId, option, currencyCode))
    }
    bridge.resolve(null)
  }

  useEffect(() => {
    getWalletOptions({ walletId, walletName, currencyCode, isToken, account }).then(options => setOptions(options))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      {walletName ? <ModalTitle>{walletName}</ModalTitle> : null}
      <View style={styles.headerRow}>
        {image ? <Image resizeMode="cover" source={{ uri: image }} style={styles.currencyImage} /> : null}
        {currencyCode ? <ModalTitle>{currencyCode}</ModalTitle> : null}
      </View>
      {options.map((option: Option) => (
        <TouchableOpacity key={option.value} onPress={() => optionAction(option.value)} style={styles.optionRow}>
          <AntDesignIcon
            name={icons[option.value]}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  currencyImage: {
    width: theme.rem(1),
    height: theme.rem(1),
    padding: theme.rem(0.5),
    marginLeft: theme.rem(0.5)
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  optionIcon: {
    color: theme.primaryText,
    padding: theme.rem(0.5)
  },
  optionText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    padding: theme.rem(0.5)
  },
  warningColor: {
    color: theme.warningText
  }
}))
