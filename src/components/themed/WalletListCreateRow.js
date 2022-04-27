// @flow

import * as React from 'react'
import { View } from 'react-native'

import { type CreateWalletOptions, createWallet } from '../../actions/CreateWalletActions.js'
import { approveTokenTerms } from '../../actions/TokenTermsActions.js'
import { refreshWallet } from '../../actions/WalletActions.js'
import { showFullScreenSpinner } from '../../components/modals/AirshipFullScreenSpinner.js'
import { showError } from '../../components/services/AirshipInstance.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { setEnabledTokens } from '../../modules/Core/Wallets/EnabledTokens.js'
import { memo, useCallback, useMemo } from '../../types/reactHooks.js'
import { useDispatch } from '../../types/reactRedux.js'
import type { Dispatch, GetState } from '../../types/reduxTypes.js'
import { getCreateWalletType } from '../../util/CurrencyInfoHelpers.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletListRow } from './WalletListRow.js'

export type WalletListCreateRowProps = {
  onPress?: (walletId: string, currencyCode: string) => void,
  currencyCode: string,
  currencyName: string,
  walletType?: string,
  pluginId?: string
}

export const createAndSelectToken =
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
      let walletId = Object.keys(currencyWallets).find(walletId => currencyWallets[walletId].currencyInfo.currencyCode === currencyCode)
      let wallet = walletId != null ? currencyWallets[walletId] : null
      // If no parent chain wallet exists, create it
      if (wallet == null) {
        const { walletType } = getCreateWalletType(account, parentCurrencyCode) ?? {}
        if (walletType == null) throw new Error(s.strings.create_wallet_failed_message)
        wallet = await createWallet(account, { walletType, walletName: getSpecialCurrencyInfo(walletType).initWalletName, fiatCurrencyCode: defaultIsoFiat })
      }
      // Reassign walletId just in case we created a new wallet
      walletId = wallet.id

      const addToken = async () => {
        if (wallet == null) throw new Error(s.strings.create_wallet_failed_message)
        const enabledTokens = (await wallet.getEnabledTokens()) ?? []
        const tokens = enabledTokens.filter(tokenId => tokenId !== wallet?.currencyInfo?.currencyCode)
        await setEnabledTokens(wallet, [...tokens, currencyCode], [])
        return [...tokens, currencyCode]
      }

      const enabledTokens = await showFullScreenSpinner(s.strings.wallet_list_modal_enabling_token, addToken())

      dispatch({
        type: 'UPDATE_WALLET_ENABLED_TOKENS',
        data: { walletId, tokens: enabledTokens }
      })
      dispatch(refreshWallet(walletId))

      return walletId
    } catch (error) {
      showError(error)
    }
    return ''
  }

export const createAndSelectWallet = ({ walletType, fiatCurrencyCode, walletName }: CreateWalletOptions) => {
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

export const WalletListCreateRowComponent = (props: WalletListCreateRowProps) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { currencyCode = '', currencyName = '', walletType, pluginId, onPress } = props

  const handlePress = useCallback(() => {
    const handleRes = walletId => (onPress != null ? onPress(walletId, currencyCode) : null)
    if (walletType != null) {
      dispatch(createAndSelectWallet({ walletType })).then(handleRes)
    } else if (pluginId != null) {
      dispatch(createAndSelectToken({ currencyCode, pluginId })).then(handleRes)
    }
  }, [walletType, pluginId, onPress, currencyCode, dispatch])

  const children = useMemo(
    () => (
      <View style={styles.labelContainer}>
        <EdgeText style={styles.labelText}>{walletType != null ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token}</EdgeText>
      </View>
    ),
    [styles.labelContainer, styles.labelText, walletType]
  )

  return (
    <WalletListRow currencyCode={currencyCode} pluginId={pluginId} onPress={handlePress} walletName={currencyName}>
      {children}
    </WalletListRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Label
  labelContainer: { justifyContent: 'center' },
  labelText: { fontFamily: theme.fontFaceMedium }
}))

export const WalletListCreateRow = memo(WalletListCreateRowComponent)
