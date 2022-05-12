// @flow

import * as React from 'react'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

import { type CreateWalletOptions, createWallet } from '../../actions/CreateWalletActions.js'
import { approveTokenTerms } from '../../actions/TokenTermsActions.js'
import { showFullScreenSpinner } from '../../components/modals/AirshipFullScreenSpinner.js'
import { showError } from '../../components/services/AirshipInstance.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { memo, useCallback } from '../../types/reactHooks.js'
import { useDispatch } from '../../types/reactRedux.js'
import type { Dispatch, GetState } from '../../types/reduxTypes.js'
import { getCreateWalletType } from '../../util/CurrencyInfoHelpers.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from './CurrencyIcon.js'
import { EdgeText } from './EdgeText.js'

export type WalletListCreateRowProps = {|
  currencyCode: string,
  currencyName: string,
  pluginId?: string,
  walletType?: string,

  onPress?: (walletId: string, currencyCode: string) => void
|}

export const WalletListCreateRowComponent = (props: WalletListCreateRowProps) => {
  const {
    currencyCode = '',
    currencyName = '',
    walletType,
    pluginId,

    // Callbacks:
    onPress
  } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const handlePress = useCallback(() => {
    const handleRes = walletId => (onPress != null ? onPress(walletId, currencyCode) : null)
    if (walletType != null) {
      dispatch(createAndSelectWallet({ walletType })).then(handleRes)
    } else if (pluginId != null) {
      dispatch(createAndSelectToken({ currencyCode, pluginId })).then(handleRes)
    }
  }, [walletType, pluginId, onPress, currencyCode, dispatch])

  return (
    <TouchableOpacity style={styles.row} onPress={handlePress}>
      <CurrencyIcon currencyCode={currencyCode} marginRem={1} pluginId={pluginId} sizeRem={2} />
      <View style={styles.nameColumn}>
        <EdgeText style={styles.currencyText}>{currencyCode}</EdgeText>
        <EdgeText style={styles.nameText}>{currencyName}</EdgeText>
      </View>
      <View style={styles.labelColumn}>
        <EdgeText style={styles.labelText}>{walletType != null ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token}</EdgeText>
      </View>
    </TouchableOpacity>
  )
}

const createAndSelectToken =
  ({ currencyCode, pluginId }: { currencyCode: string, pluginId: string }) =>
  async (dispatch: Dispatch, getState: GetState): Promise<string> => {
    const state = getState()
    const { account, disklet } = state.core
    // const { wallets } = state.ui.wallets.byId
    const { defaultIsoFiat } = state.ui.settings
    const parentCurrencyCode = account.currencyConfig[pluginId].currencyInfo.currencyCode

    try {
      // Show the user the token terms modal only once
      await approveTokenTerms(disklet, parentCurrencyCode)
      // Try to find existing Parent Edge Wallet
      const { currencyWallets } = account
      const walletId = Object.keys(currencyWallets).find(walletId => currencyWallets[walletId].currencyInfo.currencyCode === currencyCode)
      let wallet = walletId != null ? currencyWallets[walletId] : null
      // If no parent chain wallet exists, create it
      if (wallet == null) {
        const { walletType } = getCreateWalletType(account, parentCurrencyCode) ?? {}
        if (walletType == null) throw new Error(s.strings.create_wallet_failed_message)
        wallet = await createWallet(account, { walletType, walletName: getSpecialCurrencyInfo(walletType).initWalletName, fiatCurrencyCode: defaultIsoFiat })
      }
      await showFullScreenSpinner(s.strings.wallet_list_modal_enabling_token, wallet.enableTokens([currencyCode]))
      return wallet.id
    } catch (error) {
      showError(error)
    }
    return ''
  }

const createAndSelectWallet = ({ walletType, fiatCurrencyCode, walletName }: CreateWalletOptions) => {
  walletName = walletName ?? getSpecialCurrencyInfo(walletType).initWalletName
  return async (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    const { account } = state.core
    try {
      const wallet = await showFullScreenSpinner(
        s.strings.wallet_list_modal_creating_wallet,
        createWallet(account, { walletName, walletType, fiatCurrencyCode })
      )
      return wallet.id
    } catch (error) {
      showError(error)
    }
    return ''
  }
}

/**
 * Renders a WalletListRow with "Create Wallet" children
 * */
const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: theme.rem(4.25)
  },
  labelColumn: {
    justifyContent: 'center',
    paddingRight: theme.rem(1)
  },
  nameColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5)
  },

  // Text:
  currencyText: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  labelText: {
    fontFamily: theme.fontFaceMedium
  },
  nameText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const WalletListCreateRow = memo(WalletListCreateRowComponent)
