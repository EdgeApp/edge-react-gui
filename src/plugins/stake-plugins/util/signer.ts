import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

/**
 * Returns the hex private key the uniswapV2 policies sign with.
 *
 * `ethers.Wallet` only accepts a private key, so these policies cannot use
 * `EdgeAccount.getDisplayPrivateKey`, which returns the wallet's seed phrase
 * whenever it has one. The account-based EVM plugins store the hex key under
 * `${pluginId}Key` (`fantomKey`, `optimismKey` and so on) for created,
 * imported and split wallets alike. That name is a convention of those
 * plugins rather than something the core documents, and it only holds for
 * the EVM chains these policies run on.
 */
export const getSignerSeed = async (
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): Promise<string> => {
  const { pluginId } = wallet.currencyInfo
  const rawKeys = await account.getRawPrivateKey(wallet.id)
  const privateKey = rawKeys[`${pluginId}Key`]
  if (typeof privateKey !== 'string') {
    throw new Error(`Missing private key for ${pluginId} wallet`)
  }
  return privateKey
}
