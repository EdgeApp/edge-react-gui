import { div, log10, lt, round } from 'biggystring'
import { asArray, asBoolean, asMaybe, asObject, asString, asUnknown } from 'cleaners'
import { EdgeCurrencyWallet } from 'edge-core-js'
import hashjs from 'hash.js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { readSyncedSettings, writeMostRecentWalletsSelected, writeSyncedSettings } from '../actions/SettingsActions'
import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship, showError, showToast } from '../components/services/AirshipInstance'
import { FIO_WALLET_TYPE, getSpecialCurrencyInfo, SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { getDisplayDenomination } from '../selectors/DenominationSelectors'
import { convertCurrencyFromExchangeRates } from '../selectors/WalletSelectors'
import { Dispatch, RootState, ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { MapObject } from '../types/types'
import { getCurrencyCode, getCurrencyInfos, getToken, makeCreateWalletType } from '../util/CurrencyInfoHelpers'
import { getWalletName } from '../util/CurrencyWalletHelpers'
import { fetchInfo } from '../util/network'
import { refreshConnectedWallets } from './FioActions'

export interface SelectWalletTokenParams {
  navigation: NavigationBase
  walletId: string
  tokenId?: string
  alwaysActivate?: boolean
}

const activateWalletName: MapObject<{ name: string; notes: string }> = {
  ripple: {
    name: lstrings.activate_wallet_token_transaction_name_xrp,
    notes: lstrings.activate_wallet_token_transaction_notes_xrp
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

    const currentWalletId = state.ui.wallets.selectedWalletId
    const currentWalletCurrencyCode = state.ui.wallets.selectedCurrencyCode

    if (tokenId != null) {
      const { unactivatedTokenIds } = wallet
      if (unactivatedTokenIds.find(unactivatedTokenId => unactivatedTokenId === tokenId) != null) {
        await activateWalletTokens(dispatch, state, navigation, wallet, [tokenId])
        return false
      }
      if (walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode) {
        dispatch({
          type: 'UI/WALLETS/SELECT_WALLET',
          data: { walletId, currencyCode }
        })
      }
      return true
    }

    const { isAccountActivationRequired } = getSpecialCurrencyInfo(wallet.currencyInfo.pluginId)
    if (isAccountActivationRequired) {
      // EOS needs different path in case not activated yet
      if (alwaysActivate || walletId !== currentWalletId || currencyCode !== currentWalletCurrencyCode) {
        return await dispatch(selectEOSWallet(navigation, walletId, currencyCode))
      }
      return true
    }

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
      await dispatch(updateWalletsRequest())
      // not activated yet
      // find fiat and crypto (EOSIO) types and populate scene props
      const currencyInfos = getCurrencyInfos(state.core.account)
      const currencyInfo = currencyInfos.find(info => info.currencyCode === currencyCode)
      if (!currencyInfo) throw new Error('CannotFindCurrencyInfo')
      const selectedWalletType = makeCreateWalletType(currencyInfo)
      const specialCurrencyInfo = getSpecialCurrencyInfo(pluginId)
      if (specialCurrencyInfo.skipAccountNameValidation) {
        navigation.push('createWalletAccountSelect', {
          selectedWalletType,
          accountName: walletName,
          existingWalletId: walletId
        })
      } else {
        const createWalletAccountSetupSceneProps = {
          accountHandle: '',
          selectedWalletType,
          isReactivation: true,
          existingWalletId: walletId
        }
        navigation.push('createWalletAccountSetup', createWalletAccountSetupSceneProps)
      }

      Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.create_wallet_account_unfinished_activation_title}
          message={sprintf(lstrings.create_wallet_account_unfinished_activation_message, currencyCode)}
          buttons={{ ok: { label: lstrings.string_ok } }}
        />
      )).catch(err => showError(err))
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

    writeMostRecentWalletsSelected(account, currentMostRecentWallets)
      .then(() => {
        dispatch({
          type: 'UI/SETTINGS/SET_MOST_RECENT_WALLETS',
          data: { mostRecentWallets: currentMostRecentWallets }
        })
      })
      .catch(showError)
  }
}

export function updateWalletsRequest(): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account

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

    await refreshConnectedWallets(dispatch, getState, currencyWallets)
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
    const tileTitle = tokenIds.length > 1 ? lstrings.activate_wallet_tokens_scene_tile_title : lstrings.activate_wallet_token_scene_tile_title
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
    let bodyText = lstrings.activate_wallet_token_scene_body

    const { tokenActivationAdditionalReserveText } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
    if (tokenActivationAdditionalReserveText != null) {
      bodyText += '\n\n' + tokenActivationAdditionalReserveText
    }

    navigation.navigate('confirmScene', {
      titleText: lstrings.activate_wallet_token_scene_title,
      bodyText,
      infoTiles: [
        { label: tileTitle, value: tileBody },
        { label: lstrings.mining_fee, value: feeString }
      ],
      onConfirm: (resetSlider: () => void) => {
        if (lt(wallet.balances[paymentCurrencyCode] ?? '0', nativeFee)) {
          const msg = tokenIds.length > 1 ? lstrings.activate_wallet_tokens_insufficient_funds_s : lstrings.activate_wallet_token_insufficient_funds_s
          Airship.show<'ok' | undefined>(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={lstrings.create_wallet_account_unfinished_activation_title}
              message={sprintf(msg, feeString)}
              buttons={{ ok: { label: lstrings.string_ok } }}
            />
          )).catch(err => showError(err))
          navigation.pop()
          return
        }

        const name = activateWalletName[pluginId]?.name ?? lstrings.activate_wallet_token_transaction_name_category_generic
        const notes = activateWalletName[pluginId]?.notes ?? lstrings.activate_wallet_token_transaction_notes_generic
        activationQuote
          .approve({
            metadata: {
              name,
              category: `Expense:${lstrings.activate_wallet_token_transaction_name_category_generic}`,
              notes
            }
          })
          .then(result => {
            showToast(lstrings.activate_wallet_token_success, ACTIVATION_TOAST_AUTO_HIDE_MS)
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

const asInfoServerResponse = asObject({
  docs: asArray(asUnknown)
})

const asKeyInfo = asObject({
  pubKeyHash: asString,
  exposed: asBoolean
})

type KeyInfo = ReturnType<typeof asKeyInfo>

export function checkCompromisedKeys(navigation: NavigationBase): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const account = state.core.account

    const { activeWalletIds, currencyWallets } = account

    // Get synced setting Settings.json with public key map securityCheckedWallets: {walletId: { checked: boolean, modalShown: number }}
    const settings = await readSyncedSettings(account)
    const securityCheckedWallets = { ...settings.securityCheckedWallets }

    // Gather list to send to info server
    const hashedPubKeys = new Map<string, string>()
    for (const walletId of activeWalletIds) {
      // Add entries for walletIds that aren't recognized
      if (securityCheckedWallets[walletId] == null) {
        securityCheckedWallets[walletId] = { checked: false, modalShown: 0 }
      }

      // create public key hashes for any walletIds that have not been checked or modalshown is less than 2
      const { checked, modalShown } = securityCheckedWallets[walletId]
      if (!checked && modalShown < 2) {
        const wallet = currencyWallets[walletId]
        if (wallet == null) continue

        const pubKey = await account.getDisplayPublicKey(wallet.id)
        if (pubKey == null) continue

        const hash = hashjs.sha256().update(pubKey).digest('hex')
        hashedPubKeys.set(walletId, hash)
      }
    }
    if (hashedPubKeys.size === 0) {
      return
    }
    const allDocIds = [...hashedPubKeys.values()]

    // Send hashes to info server endpoint
    const exposedKeyInfos: KeyInfo[] = []
    const queryInfoServer = async (docIds: string[]): Promise<void> => {
      const opts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docIds })
      }
      const response = await fetchInfo('v1/exposedkeys', opts)
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`checkCompromisedKeys ${text}`)
      }
      const raw = await response.json()
      const json = asInfoServerResponse(raw)

      for (const doc of json.docs) {
        const keyInfo = asMaybe(asKeyInfo)(doc)
        if (keyInfo != null) {
          exposedKeyInfos.push(keyInfo)
        }
      }
    }

    const PAGE_LIMIT = 100
    for (let i = 0; i < allDocIds.length; i += PAGE_LIMIT) {
      const docIds = allDocIds.slice(i, i + PAGE_LIMIT)
      try {
        await queryInfoServer(docIds)
      } catch (e: any) {
        console.log('checkCompromisedKeys invalid info server response', e.message)
        break
      }
    }

    const exposedWalletIds: string[] = []
    for (const entry of hashedPubKeys.entries()) {
      const [walletId, pubkeyHash] = entry

      const keyInfo = exposedKeyInfos.find(info => info.pubKeyHash === pubkeyHash)
      if (keyInfo?.exposed) {
        exposedWalletIds.push(walletId)
      } else {
        securityCheckedWallets[walletId] = { ...securityCheckedWallets[walletId], checked: true }
      }
    }
    dispatch({ type: 'UI/SETTINGS/SET_SECURITY_CHECKED_WALLETS', data: securityCheckedWallets })

    const MigrateWalletsModal = async (walletNames: string[]): Promise<'yes' | 'no' | undefined> => {
      const message = sprintf(lstrings.migrate_wallets_modal_message, walletNames.join('\n'))

      return await Airship.show<'yes' | 'no' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={lstrings.alert_dropdown_warning}
          message={message}
          fullScreen
          warning
          buttons={{
            yes: { label: lstrings.yes },
            no: { label: lstrings.no }
          }}
        />
      ))
    }

    // If any walletId come back true show modal to go to migration scene with affected wallets preselected
    if (exposedWalletIds.length > 0) {
      const walletNames = exposedWalletIds.map(walletId => getWalletName(currencyWallets[walletId]))
      const response = await MigrateWalletsModal(walletNames)
      exposedWalletIds.forEach(walletId => {
        const { checked, modalShown } = securityCheckedWallets[walletId]
        securityCheckedWallets[walletId] = { checked, modalShown: modalShown + 1 }
      })

      if (response === 'yes') {
        navigation.push('migrateWalletSelectCrypto', { preSelectedWalletIds: exposedWalletIds })
      }
    }

    await writeSyncedSettings(account, { ...settings, securityCheckedWallets })
  }
}
