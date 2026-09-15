import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { getWalletHexPrivateKey } from '../../../util/CurrencyWalletHelpers'

/**
 * Returns the hex private key the uniswapV2 policies sign with.
 *
 * `ethers.Wallet` only accepts a private key, so these policies cannot use
 * `EdgeAccount.getDisplayPrivateKey`, which returns the wallet's seed phrase
 * whenever it has one.
 */
export const getSignerSeed = async (
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): Promise<string> => {
  const privateKey = await getWalletHexPrivateKey(account, wallet)
  if (privateKey == null) {
    throw new Error(
      `Missing private key for ${wallet.currencyInfo.pluginId} wallet`
    )
  }
  return privateKey
}
