import type { EdgeAccount } from 'edge-core-js'

const STORE_ID = 'walletConnectSessions'

/**
 * Remembers which wallet approved a WalletConnect session.
 *
 * A session's namespace carries the wallet's address, and that is the only
 * identifier the dapp ever sees. Resolving an incoming request back to a wallet
 * by that address alone is fragile on chains whose receive address rotates:
 * once a UTXO wallet's fresh address advances, the address on the session no
 * longer matches anything the account currently reports, and the request would
 * be dropped. This store keeps the topic-to-wallet mapping we already knew at
 * approval time, so the lookup survives rotation.
 */
export const rememberSessionWallet = async (
  account: EdgeAccount,
  topic: string,
  walletId: string
): Promise<void> => {
  await account.dataStore.setItem(STORE_ID, topic, walletId)
}

export const lookupSessionWallet = async (
  account: EdgeAccount,
  topic: string
): Promise<string | undefined> => {
  try {
    return await account.dataStore.getItem(STORE_ID, topic)
  } catch {
    // A topic we never stored, or a store that has not been created yet.
    return undefined
  }
}

export const forgetSessionWallet = async (
  account: EdgeAccount,
  topic: string
): Promise<void> => {
  await account.dataStore.deleteItem(STORE_ID, topic).catch(() => {
    // Nothing to forget.
  })
}
