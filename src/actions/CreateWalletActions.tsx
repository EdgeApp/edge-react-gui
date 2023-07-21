import { mul, toFixed } from 'biggystring'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeMetadata, EdgeTransaction, JsonObject } from 'edge-core-js'
import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { AccountPaymentParams } from '../components/scenes/CreateWalletAccountSelectScene'
import { Airship, showError } from '../components/services/AirshipInstance'
import { WalletCreateItem } from '../components/themed/WalletList'
import { getPluginId, SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { getExchangeDenomination } from '../selectors/DenominationSelectors'
import { config } from '../theme/appConfig'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { EdgeTokenId } from '../types/types'
import { logActivity } from '../util/logger'
import { filterNull } from '../util/safeFilters'
import { logEvent, TrackingEventName } from '../util/tracking'

export interface CreateWalletOptions {
  walletType: string
  fiatCurrencyCode?: string
  importText?: string // for creating wallet from private seed / key
  trackingEventFailed?: TrackingEventName
  trackingEventSuccess?: TrackingEventName
  walletName?: string
  keyOptions?: JsonObject
}

export const createWallet = async (account: EdgeAccount, { walletType, walletName, fiatCurrencyCode, importText, keyOptions = {} }: CreateWalletOptions) => {
  // Try and get the new format param from the legacy walletType if it's mentioned
  const [type, format] = walletType.split('-')
  const opts = {
    name: walletName,
    fiatCurrencyCode,
    keyOptions: format != null ? { ...keyOptions, format } : { ...keyOptions },
    importText
  }
  const out = await account.createCurrencyWallet(type, opts)
  logActivity(`Create Wallet: ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${opts.name ?? ''}`)
  return out
}

export function createCurrencyWallet(
  walletName: string,
  walletType: string,
  fiatCurrencyCode?: string,
  importText?: string
): ThunkAction<Promise<EdgeCurrencyWallet>> {
  return async (dispatch, getState) => {
    const state = getState()
    fiatCurrencyCode = fiatCurrencyCode ?? state.ui.settings.defaultIsoFiat
    return await createWallet(state.core.account, { walletName, walletType, fiatCurrencyCode, importText })
  }
}

// can move to component in the future, just account and currencyConfig, etc to component through connector
export function fetchAccountActivationInfo(walletType: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const currencyPluginName = getPluginId(walletType)
    const currencyPlugin: EdgeCurrencyConfig = account.currencyConfig[currencyPluginName]
    try {
      const [supportedCurrencies, activationCost] = await Promise.all([
        currencyPlugin.otherMethods.getActivationSupportedCurrencies(),
        currencyPlugin.otherMethods.getActivationCost(currencyPlugin.currencyInfo.currencyCode)
      ])

      // Translate ambiguous currency codes:
      const supportedAssets: EdgeTokenId[] = []
      for (const currency of Object.keys(supportedCurrencies.result)) {
        // Handle special cases:
        if (currency === 'FTC') continue
        if (currency === 'ETH') {
          supportedAssets.push({ pluginId: 'ethereum' })
          continue
        }

        // Find a top-level currency:
        const pluginId = Object.keys(account.currencyConfig).find(pluginId => account.currencyConfig[pluginId].currencyInfo.currencyCode === currency)
        if (pluginId != null) {
          supportedAssets.push({ pluginId })
          continue
        }

        // Find an Ethereum mainnet token:
        const { ethereum } = account.currencyConfig
        if (ethereum == null) continue
        const tokenId = Object.keys(ethereum.allTokens).find(tokenId => ethereum.allTokens[tokenId].currencyCode === currency)
        if (tokenId != null) {
          supportedAssets.push({ pluginId: 'ethereum', tokenId })
        }
      }

      dispatch({
        type: 'ACCOUNT_ACTIVATION_INFO',
        data: {
          supportedAssets,
          activationCost
        }
      })
    } catch (error: any) {
      showError(error)
    }
  }
}

export function fetchWalletAccountActivationPaymentInfo(paymentParams: AccountPaymentParams, createdCoreWallet: EdgeCurrencyWallet): ThunkAction<void> {
  return (dispatch, getState) => {
    try {
      const networkTimeout = setTimeout(() => {
        showError('Network Timeout')
        dispatch({
          type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR',
          data: 'Network Timeout'
        })
      }, 26000)
      createdCoreWallet.otherMethods
        .getAccountActivationQuote(paymentParams)
        // @ts-expect-error
        .then(activationQuote => {
          dispatch({
            type: 'ACCOUNT_ACTIVATION_PAYMENT_INFO',
            data: {
              ...activationQuote,
              currencyCode: paymentParams.currencyCode
            }
          })
          clearTimeout(networkTimeout)
        })
        .catch(showError)
    } catch (error: any) {
      showError(error)
    }
  }
}

export function createAccountTransaction(
  navigation: NavigationBase,
  createdWalletId: string,
  accountName: string,
  paymentWalletId: string
): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    // check available funds
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account
    const createdCurrencyWallet = currencyWallets[createdWalletId]
    const paymentWallet: EdgeCurrencyWallet = currencyWallets[paymentWalletId]
    const createdWalletCurrencyCode = createdCurrencyWallet.currencyInfo.currencyCode
    const currencyPlugin = account.currencyConfig[createdCurrencyWallet.currencyInfo.pluginId]
    const { paymentAddress, amount, currencyCode } = state.ui.createWallet.walletAccountActivationPaymentInfo
    const handleAvailability = await currencyPlugin.otherMethods.validateAccount(accountName)
    const paymentDenom = getExchangeDenomination(state, paymentWallet.currencyInfo.pluginId, currencyCode)
    let nativeAmount = mul(amount, paymentDenom.multiplier)
    nativeAmount = toFixed(nativeAmount, 0, 0)
    if (handleAvailability.result === 'AccountAvailable') {
      navigation.push('send2', {
        spendInfo: {
          currencyCode,
          spendTargets: [
            {
              nativeAmount,
              publicAddress: paymentAddress
            }
          ]
        },
        lockTilesMap: {
          address: true,
          amount: true,
          wallet: true
        },
        walletId: paymentWalletId,
        onBack: () => {
          // Hack. Keyboard pops up for some reason. Close it
          logEvent('Activate_Wallet_Cancel', {
            currencyCode: createdWalletCurrencyCode
          })
        },
        onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
          if (error) {
            console.log(error)
            setTimeout(() => {
              Alert.alert(lstrings.create_wallet_account_error_sending_transaction)
            }, 750)
          } else if (edgeTransaction) {
            logEvent('Activate_Wallet_Done', {
              currencyCode: createdWalletCurrencyCode
            })
            const edgeMetadata: EdgeMetadata = {
              name: sprintf(lstrings.create_wallet_account_metadata_name, createdWalletCurrencyCode),
              category: 'Expense:' + sprintf(lstrings.create_wallet_account_metadata_category, createdWalletCurrencyCode),
              notes: sprintf(lstrings.create_wallet_account_metadata_notes, createdWalletCurrencyCode, createdWalletCurrencyCode, config.supportEmail)
            }
            paymentWallet.saveTxMetadata(edgeTransaction.txid, currencyCode, edgeMetadata).catch(err => console.warn(err))
            navigation.navigate('walletsTab', { screen: 'walletList' })
            setTimeout(() => {
              Alert.alert(lstrings.create_wallet_account_payment_sent_title, lstrings.create_wallet_account_payment_sent_message)
            }, 750)
          }
        },
        alternateBroadcast:
          createdCurrencyWallet.otherMethods.submitActivationPayment != null ? createdCurrencyWallet.otherMethods.submitActivationPayment : undefined
      })
    } else {
      // if handle is now unavailable
      await dispatch(createHandleUnavailableModal(navigation, createdWalletId, accountName))
    }
  }
}

export function createHandleUnavailableModal(navigation: NavigationBase, newWalletId: string, accountName: string): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    await account.changeWalletStates({
      [newWalletId]: {
        deleted: true
      }
    })
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={lstrings.create_wallet_account_handle_unavailable_modal_title}
        message={sprintf(lstrings.create_wallet_account_handle_unavailable_modal_message, accountName)}
        buttons={{ ok: { label: lstrings.string_ok } }}
      />
    ))
    navigation.pop()
  }
}

export const PLACEHOLDER_WALLET_ID = 'NEW_WALLET_UNIQUE_STRING'
export interface MainWalletCreateItem extends WalletCreateItem {
  walletType: string
}
interface TokenWalletCreateItem extends WalletCreateItem {
  tokenId: string
  createWalletIds: string[]
}

export const splitCreateWalletItems = (createItems: WalletCreateItem[]): { newWalletItems: MainWalletCreateItem[]; newTokenItems: TokenWalletCreateItem[] } => {
  const newWalletItems: MainWalletCreateItem[] = []
  const newTokenItems: TokenWalletCreateItem[] = []
  createItems.forEach(item => {
    if (item.walletType != null) {
      newWalletItems.push(item as MainWalletCreateItem)
    } else if (item.tokenId != null) {
      if (item.createWalletIds == null) item.createWalletIds = []
      newTokenItems.push(item as TokenWalletCreateItem)
    }
  })
  return { newWalletItems, newTokenItems }
}

export function enableTokensAcrossWallets(newTokenItems: TokenWalletCreateItem[]): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { currencyWallets } = state.core.account

    const walletIdTokenMap = newTokenItems.reduce((map: { [walletId: string]: string[] }, item) => {
      const { createWalletIds, tokenId } = item

      const walletId = createWalletIds[0]
      if (map[walletId] == null) map[walletId] = []
      map[walletId].push(tokenId)

      return map
    }, {})

    // Create the enableToken promises to be promise.all'd later
    const promises: Array<Promise<void>> = Object.keys(walletIdTokenMap).map(async walletId => {
      const wallet = currencyWallets[walletId]
      if (wallet == null) return
      return await wallet.changeEnabledTokenIds([...wallet.enabledTokenIds, ...walletIdTokenMap[walletId]])
    })

    await Promise.all(promises)
  }
}

export const getUniqueWalletName = (account: EdgeAccount, pluginId: string): string => {
  const { currencyWallets, currencyConfig } = account
  const { displayName } = currencyConfig[pluginId].currencyInfo
  const defaultName = SPECIAL_CURRENCY_INFO[pluginId]?.initWalletName ?? sprintf(lstrings.my_crypto_wallet_name, displayName)

  const existingWalletNames = Object.keys(currencyWallets)
    .filter(walletId => currencyWallets[walletId].currencyInfo.pluginId === pluginId)
    .map(walletId => currencyWallets[walletId].name)
  const filteredWalletNames = filterNull(existingWalletNames).filter((name: string) => name.startsWith(defaultName))

  let newWalletName = defaultName
  let count = 2

  while (true) {
    if (filteredWalletNames.includes(newWalletName)) {
      newWalletName = `${defaultName} ${count++}`
    } else {
      return newWalletName
    }
  }
}
