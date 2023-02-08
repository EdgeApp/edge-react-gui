import { div, log10, lt, round } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError, showToast } from '../components/services/AirshipInstance'
import { FIO_WALLET_TYPE, getSpecialCurrencyInfo } from '../constants/WalletAndCurrencyConstants'
import s from '../locales/strings'
import { setMostRecentWalletsSelected } from '../modules/Core/Account/settings'
import { getDisplayDenomination } from '../selectors/DenominationSelectors'
import { convertCurrencyFromExchangeRates } from '../selectors/WalletSelectors'
import { Dispatch, RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { MapObject } from '../types/types'
import { getCurrencyCode, getCurrencyInfos, getToken, makeCreateWalletType } from '../util/CurrencyInfoHelpers'
import { getSupportedFiats } from '../util/utils'
import { refreshConnectedWallets } from './FioActions'
import { registerNotificationsV2 } from './NotificationActions'

export interface SelectWalletTokenParams {
  navigation: NavigationBase
  walletId: string
  tokenId?: string
  alwaysActivate?: boolean
}

const activateWalletName: MapObject<{ name: string; notes: string }> = {
  ripple: {
    name: s.strings.activate_wallet_token_transaction_name_xrp,
    notes: s.strings.activate_wallet_token_transaction_notes_xrp
  }
}

const ACTIVATION_TOAST_AUTO_HIDE_MS = 5000

export function selectWalletToken({ navigation, walletId, tokenId, alwaysActivate }: SelectWalletTokenParams): ThunkAction<Promise<boolean>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { currencyWallets } = state.core.account

    // Manually un-pause the wallet, if necessary:
    const wallet: EdgeCurrencyWallet = currencyWallets[walletId]
    if (wallet.paused) wallet.changePaused(false).catch(showError)

    // XXX Still need a darn currencyCode. Hope to deprecate later
    const currencyCode = getCurrencyCode(wallet, tokenId)
    dispatch(updateMostRecentWalletsSelected(walletId, currencyCode))

    if (tokenId != null) {
      const { unactivatedTokenIds } = wallet
      if (unactivatedTokenIds.find(unactivatedTokenId => unactivatedTokenId === tokenId) != null) {
        activateWalletTokens(dispatch, state, navigation, wallet, [tokenId])
        return false
      }
      return true
    }

    const { isAccountActivationRequired } = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId)
    if (isAccountActivationRequired) {
      // EOS needs different path in case not activated yet
      const currentWalletId = state.ui.wallets.selectedWalletId
      const currentWalletCurrencyCode = state.ui.wallets.selectedCurrencyCode
      if (alwaysActivate || walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode) {
        return await dispatch(selectEOSWallet(navigation, walletId, currencyCode))
      }
      return true
    }
    const currentWalletId = state.ui.wallets.selectedWalletId
    const currentWalletCurrencyCode = state.ui.wallets.selectedCurrencyCode
    if (walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode) {
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { walletId, currencyCode }
      })
    }
    return true
  }
}

// check if the EOS wallet is activated (via public address blank string check) and route to activation scene(s)
function selectEOSWallet(navigation: NavigationBase, walletId: string, currencyCode: string): ThunkAction<Promise<boolean>> {
  return async (dispatch, getState) => {
    const state = getState()
    const wallet = state.core.account.currencyWallets[walletId]
    const {
      fiatCurrencyCode,
      name,
      currencyInfo: { currencyCode, pluginId }
    } = wallet
    const walletName = name ?? ''
    const { publicAddress } = await wallet.getReceiveAddress()

    if (publicAddress !== '') {
      // already activated
      dispatch({
        type: 'UI/WALLETS/SELECT_WALLET',
        data: { walletId, currencyCode }
      })
      return true
    } else {
      // Update all wallets' addresses. Hopefully gets the updated address for the next time
      // We enter the EOSIO wallet
      dispatch(updateWalletsRequest())
      // not activated yet
      // find fiat and crypto (EOSIO) types and populate scene props
      const supportedFiats = getSupportedFiats()
      const fiatTypeIndex = supportedFiats.findIndex(fiatType => fiatType.value === fiatCurrencyCode.replace('iso:', ''))
      const selectedFiat = supportedFiats[fiatTypeIndex]
      const currencyInfos = getCurrencyInfos(state.core.account)
      const currencyInfo = currencyInfos.find(info => info.currencyCode === currencyCode)
      if (!currencyInfo) throw new Error('CannotFindCurrencyInfo')
      const selectedWalletType = makeCreateWalletType(currencyInfo)
      const specialCurrencyInfo = getSpecialCurrencyInfo(pluginId)
      if (specialCurrencyInfo.skipAccountNameValidation) {
        navigation.push('createWalletAccountSelect', {
          selectedFiat: selectedFiat,
          selectedWalletType,
          accountName: walletName,
          existingWalletId: walletId
        })
      } else {
        const createWalletAccountSetupSceneProps = {
          accountHandle: '',
          selectedWalletType,
          selectedFiat,
          isReactivation: true,
          existingWalletId: walletId
        }
        navigation.push('createWalletAccountSetup', createWalletAccountSetupSceneProps)
      }

      Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={s.strings.create_wallet_account_unfinished_activation_title}
          message={sprintf(s.strings.create_wallet_account_unfinished_activation_message, currencyCode)}
          buttons={{ ok: { label: s.strings.string_ok } }}
        />
      ))
      return false
    }
  }
}

export function updateWalletLoadingProgress(walletId: string, newWalletProgress: number): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const currentWalletProgress = state.ui.wallets.walletLoadingProgress[walletId]
    const marginalProgress = newWalletProgress - currentWalletProgress
    if (newWalletProgress !== 1 && marginalProgress < 0.1) return

    dispatch({
      type: 'UPDATE_WALLET_LOADING_PROGRESS',
      data: { walletId, addressLoadingProgress: newWalletProgress }
    })
  }
}

export function updateMostRecentWalletsSelected(walletId: string, currencyCode: string): ThunkAction<void> {
  return (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { mostRecentWallets } = state.ui.settings
    const currentMostRecentWallets = mostRecentWallets.filter(wallet => {
      return wallet.id !== walletId || wallet.currencyCode !== currencyCode
    })
    if (currentMostRecentWallets.length === 100) {
      currentMostRecentWallets.pop()
    }
    currentMostRecentWallets.unshift({ id: walletId, currencyCode })

    setMostRecentWalletsSelected(account, currentMostRecentWallets)
      .then(() => {
        dispatch({
          type: 'UI/SETTINGS/SET_MOST_RECENT_WALLETS',
          data: { mostRecentWallets: currentMostRecentWallets }
        })
      })
      .catch(showError)
  }
}

// This gets called a bunch on launch so we need to limit it otherwise duplicate notifications will get registered
let limitRegistrations = false
export function updateWalletsRequest(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { activeWalletIds, currencyWallets } = account

    if (activeWalletIds.length === Object.keys(currencyWallets).length && !limitRegistrations) {
      limitRegistrations = true
      await dispatch(registerNotificationsV2())
      limitRegistrations = false
    }

    const fioWallets: EdgeCurrencyWallet[] = []
    for (const walletId of Object.keys(currencyWallets)) {
      if (currencyWallets[walletId].type === FIO_WALLET_TYPE) {
        fioWallets.push(currencyWallets[walletId])
      }
    }
    dispatch({
      type: 'UPDATE_FIO_WALLETS',
      data: { fioWallets }
    })

    refreshConnectedWallets(dispatch, getState, currencyWallets)
  }
}

const activateWalletTokens = async (
  dispatch: Dispatch,
  state: RootState,
  navigation: NavigationBase,
  wallet: EdgeCurrencyWallet,
  tokenIds?: string[]
): Promise<void> => {
  if (tokenIds == null) throw new Error('Activating mainnet wallets unsupported')
  const { account } = state.core
  const { assetOptions } = await account.getActivationAssets({ activateWalletId: wallet.id, activateTokenIds: tokenIds })
  const { pluginId } = wallet.currencyInfo
  const { fiatCurrencyCode } = wallet

  // See if there is only one wallet option for activation
  if (assetOptions.length === 1 && assetOptions[0].paymentWalletId != null) {
    const { paymentWalletId, tokenId } = assetOptions[0]
    const activationQuote = await account.activateWallet({
      activateWalletId: wallet.id,
      activateTokenIds: tokenIds,
      paymentWalletId,
      paymentTokenId: tokenId
    })
    const tokensText = tokenIds.map(tokenId => {
      const { currencyCode, displayName } = getToken(wallet, tokenId) ?? {}
      return `${displayName} (${currencyCode})`
    })
    const tileTitle = tokenIds.length > 1 ? s.strings.activate_wallet_tokens_scene_tile_title : s.strings.activate_wallet_token_scene_tile_title
    const tileBody = tokensText.join(', ')

    const { networkFee } = activationQuote
    const { nativeAmount: nativeFee, currencyPluginId, tokenId: feeTokenId } = networkFee
    if (currencyPluginId !== pluginId) throw new Error('Internal Error: Fee asset mismatch.')

    const paymentCurrencyCode = getCurrencyCode(wallet, feeTokenId)

    const exchangeNetworkFee = await wallet.nativeToDenomination(nativeFee, paymentCurrencyCode)
    const feeDenom = getDisplayDenomination(state, pluginId, paymentCurrencyCode)
    const displayFee = div(nativeFee, feeDenom.multiplier, log10(feeDenom.multiplier))
    let fiatFee = convertCurrencyFromExchangeRates(state.exchangeRates, paymentCurrencyCode, fiatCurrencyCode, exchangeNetworkFee)
    if (lt(fiatFee, '0.001')) fiatFee = '<0.001'
    fiatFee = round(fiatFee, -3)
    const feeString = `${displayFee} ${feeDenom.name} (${fiatFee} ${fiatCurrencyCode.replace('iso:', '')})`

    navigation.navigate('confirmScene', {
      titleText: s.strings.activate_wallet_token_scene_title,
      bodyText: s.strings.activate_wallet_token_scene_body,
      infoTiles: [
        { label: tileTitle, value: tileBody },
        { label: s.strings.mining_fee, value: feeString }
      ],
      onConfirm: (resetSlider: () => void) => {
        if (lt(wallet.balances[paymentCurrencyCode] ?? '0', nativeFee)) {
          const msg = tokenIds.length > 1 ? s.strings.activate_wallet_tokens_insufficient_funds_s : s.strings.activate_wallet_token_insufficient_funds_s
          Airship.show<'ok' | undefined>(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={s.strings.create_wallet_account_unfinished_activation_title}
              message={sprintf(msg, feeString)}
              buttons={{ ok: { label: s.strings.string_ok } }}
            />
          ))
          navigation.pop()
          return
        }

        const name = activateWalletName[pluginId]?.name ?? s.strings.activate_wallet_token_transaction_name_category_generic
        const notes = activateWalletName[pluginId]?.notes ?? s.strings.activate_wallet_token_transaction_notes_generic
        activationQuote
          .approve({
            metadata: {
              name,
              category: `Expense:${s.strings.activate_wallet_token_transaction_name_category_generic}`,
              notes
            }
          })
          .then(result => {
            showToast(s.strings.activate_wallet_token_success, ACTIVATION_TOAST_AUTO_HIDE_MS)
            navigation.pop()
          })
          .catch(e => {
            navigation.pop()
            showError(e)
          })
      }
    })
  } else {
    throw new Error('Activation with multiple wallet options not supported yet')
  }
}
