import { mul, toFixed } from 'biggystring'
import { EdgeAccount, EdgeCreateCurrencyWallet, EdgeCurrencyConfig, EdgeCurrencyWallet, EdgeMetadata, EdgeResult, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { AccountActivationPaymentInfo, HandleActivationInfo } from '../components/scenes/CreateWalletAccountSelectScene'
import { Airship } from '../components/services/AirshipInstance'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { getExchangeDenomByCurrencyCode } from '../selectors/DenominationSelectors'
import { TokenWalletCreateItem } from '../selectors/getCreateWalletList'
import { config } from '../theme/appConfig'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'
import { EdgeAsset } from '../types/types'
import { getWalletTokenId } from '../util/CurrencyInfoHelpers'
import { logActivity } from '../util/logger'
import { filterNull } from '../util/safeFilters'
import { logEvent } from '../util/tracking'

export const createWallets = async (account: EdgeAccount, items: EdgeCreateCurrencyWallet[]): Promise<Array<EdgeResult<EdgeCurrencyWallet>>> => {
  const out = await account.createCurrencyWallets(items)

  // Log the results:
  for (let i = 0; i < items.length; ++i) {
    if (!out[i].ok) continue
    const { fiatCurrencyCode, name = '', walletType } = items[i]
    logActivity(`Create Wallet: ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${name}`)
  }

  return out
}

export const createWallet = async (account: EdgeAccount, opts: EdgeCreateCurrencyWallet): Promise<EdgeCurrencyWallet> => {
  const { walletType, name, fiatCurrencyCode } = opts
  const out = await account.createCurrencyWallet(walletType, opts)

  logActivity(`Create Wallet: ${account.username} -- ${walletType} -- ${fiatCurrencyCode ?? ''} -- ${name ?? ''}`)

  return out
}

// can move to component in the future, just account and currencyConfig, etc to component through connector
export async function fetchAccountActivationInfo(account: EdgeAccount, pluginId: string): Promise<HandleActivationInfo> {
  const currencyPlugin: EdgeCurrencyConfig = account.currencyConfig[pluginId]

  const [supportedCurrencies, activationCost] = await Promise.all([
    currencyPlugin.otherMethods.getActivationSupportedCurrencies(),
    currencyPlugin.otherMethods.getActivationCost(currencyPlugin.currencyInfo.currencyCode)
  ])

  // Translate ambiguous currency codes:
  const supportedAssets: EdgeAsset[] = []
  for (const currency of Object.keys(supportedCurrencies.result)) {
    // Handle special cases:
    if (currency === 'FTC') continue
    if (currency === 'ETH') {
      supportedAssets.push({ pluginId: 'ethereum', tokenId: null })
      continue
    }

    // Find a top-level currency:
    const pluginId = Object.keys(account.currencyConfig).find(pluginId => account.currencyConfig[pluginId].currencyInfo.currencyCode === currency)
    if (pluginId != null) {
      supportedAssets.push({ pluginId, tokenId: null })
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

  return {
    supportedAssets,
    activationCost
  }
}

export function createAccountTransaction(
  navigation: NavigationBase,
  createdWalletId: string,
  accountName: string,
  paymentWalletId: string,
  activationPaymentInfo: AccountActivationPaymentInfo
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
    const { paymentAddress, amount, currencyCode } = activationPaymentInfo
    const handleAvailability = await currencyPlugin.otherMethods.validateAccount(accountName)
    const paymentDenom = getExchangeDenomByCurrencyCode(paymentWallet.currencyConfig, currencyCode)
    let nativeAmount = mul(amount, paymentDenom.multiplier)
    nativeAmount = toFixed(nativeAmount, 0, 0)
    const tokenId = getWalletTokenId(paymentWallet, currencyCode)

    if (handleAvailability.result === 'AccountAvailable') {
      navigation.push('send2', {
        tokenId,
        spendInfo: {
          tokenId,
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
          dispatch(
            logEvent('Activate_Wallet_Cancel', {
              createdWalletCurrencyCode
            })
          )
        },
        onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
          if (error) {
            console.log(error)
            setTimeout(() => {
              Airship.show<'ok' | undefined>(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  message={lstrings.create_wallet_account_error_sending_transaction}
                  buttons={{ ok: { label: lstrings.string_ok_cap } }}
                />
              )).catch(() => {})
            }, 750)
          } else if (edgeTransaction) {
            dispatch(
              logEvent('Activate_Wallet_Done', {
                createdWalletCurrencyCode
              })
            )
            const edgeMetadata: EdgeMetadata = {
              name: sprintf(lstrings.create_wallet_account_metadata_name, createdWalletCurrencyCode),
              category: 'Expense:' + sprintf(lstrings.create_wallet_account_metadata_category, createdWalletCurrencyCode),
              notes: sprintf(lstrings.create_wallet_account_metadata_notes, createdWalletCurrencyCode, createdWalletCurrencyCode, config.supportEmail)
            }
            paymentWallet.saveTxMetadata({ txid: edgeTransaction.txid, tokenId, metadata: edgeMetadata }).catch(err => console.warn(err))
            navigation.navigate('walletsTab', { screen: 'walletList' })
            setTimeout(() => {
              Airship.show<'ok' | undefined>(bridge => (
                <ButtonsModal
                  bridge={bridge}
                  title={lstrings.create_wallet_account_payment_sent_title}
                  message={lstrings.create_wallet_account_payment_sent_message}
                  buttons={{ ok: { label: lstrings.string_ok_cap } }}
                />
              )).catch(() => {})
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

export function enableTokensAcrossWallets(newTokenItems: TokenWalletCreateItem[]): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { account } = state.core
    const { currencyWallets } = account

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
