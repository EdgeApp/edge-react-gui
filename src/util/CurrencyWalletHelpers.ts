import { sub } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet, EdgeTokenId } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { showFullScreenSpinner } from '../components/modals/AirshipFullScreenSpinner'
import { SPECIAL_CURRENCY_INFO } from '../constants/WalletAndCurrencyConstants'
import { lstrings } from '../locales/strings'
import { getFioStakingBalances } from './stakeUtils'
import { removeIsoPrefix } from './utils'

/**
 * Safely get a wallet name, returning a fallback when the name is null.
 * See `useWalletName` for a hook version of this.
 */
export function getWalletName(wallet: EdgeCurrencyWallet): string {
  const { name } = wallet
  if (name != null) return name

  return sprintf(
    lstrings.my_crypto_wallet_name,
    wallet.currencyInfo.displayName
  )
}

/**
 * Takes any form of fiat currency code and returns a version with and without
 * the "iso:" prefix
 */
export function cleanFiatCurrencyCode(fiatCurrencyCode: string): {
  fiatCurrencyCode: string
  isoFiatCurrencyCode: string
} {
  if (fiatCurrencyCode.startsWith('iso:')) {
    return {
      fiatCurrencyCode: removeIsoPrefix(fiatCurrencyCode),
      isoFiatCurrencyCode: fiatCurrencyCode
    }
  } else {
    return { fiatCurrencyCode, isoFiatCurrencyCode: `iso:${fiatCurrencyCode}` }
  }
}

export const getAvailableBalance = (
  wallet: EdgeCurrencyWallet,
  tokenId: EdgeTokenId
): string => {
  const { pluginId } = wallet.currencyInfo

  let balance = wallet.balanceMap.get(tokenId) ?? '0'
  if (
    SPECIAL_CURRENCY_INFO[pluginId]?.isStakingSupported === true &&
    tokenId == null
  ) {
    // Special case for FIO mainnet (no token)
    const { locked } = getFioStakingBalances(wallet.stakingStatus)
    balance = sub(balance, locked)
  }
  return balance
}

/**
 * Enables tokens in a wallet, if not already enabled.
 * - If some tokens are not yet enabled, shows a full screen spinner while they
 * get enabled.
 * - If the tokens are all already enabled, this function call is a noop.
 */
export const enableTokens = async (
  newTokenIds: EdgeTokenId[],
  wallet: EdgeCurrencyWallet
): Promise<void> => {
  const { enabledTokenIds, currencyConfig } = wallet
  const { allTokens } = currencyConfig

  const tokensToEnable = Object.keys(allTokens).filter(
    tokenId =>
      newTokenIds.filter(newTokenId => newTokenId != null).includes(tokenId) &&
      !enabledTokenIds.includes(tokenId)
  )

  if (tokensToEnable.length > 0)
    await showFullScreenSpinner(
      lstrings.wallet_list_modal_enabling_token,
      wallet.changeEnabledTokenIds([...enabledTokenIds, ...tokensToEnable])
    )
}

const HEX_PRIVATE_KEY_REGEX = /^(0x)?[0-9a-fA-F]{64}$/

/**
 * Reads the 32-byte hex private key a wallet has stored, if it keeps one.
 *
 * The account-based EVM plugins name this key `${pluginId}Key`
 * (`ethereumKey`, `fantomKey` and so on) and store it next to an optional
 * `${pluginId}Mnemonic`. That field name is a shared convention rather than an
 * EVM one, and other plugin families put unrelated material there: the UTXO
 * plugins keep a base64 or WIF seed under it. So the value has to look like a
 * hex private key before we offer it as one, and anything else yields
 * undefined.
 *
 * This is not the same as `EdgeAccount.getDisplayPrivateKey`, which asks the
 * plugin to pick what a user should see and returns the seed phrase whenever
 * the wallet has one.
 */
export const getWalletHexPrivateKey = async (
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): Promise<string | undefined> => {
  const { pluginId } = wallet.currencyInfo
  const rawKeys = await account.getRawPrivateKey(wallet.id)
  const privateKey = rawKeys[`${pluginId}Key`]
  if (typeof privateKey !== 'string') return undefined
  return HEX_PRIVATE_KEY_REGEX.test(privateKey) ? privateKey : undefined
}
