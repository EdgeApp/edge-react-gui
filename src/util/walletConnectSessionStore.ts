import { asJSON, asObject, asString } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

const SESSION_WALLETS_FILENAME = 'walletConnectSessions.json'

const asSessionWallets = asJSON(asObject(asString))

/** Approving wallet id, keyed by WalletConnect session topic. */
export type SessionWallets = ReturnType<typeof asSessionWallets>

/**
 * Remembers which wallet approved a WalletConnect session.
 *
 * A session's namespace carries the wallet's address, and that is the only
 * identifier the dapp ever sees. Resolving an incoming request back to a wallet
 * by that address alone is fragile on chains whose receive address rotates:
 * once a UTXO wallet's fresh address advances, the address on the session no
 * longer matches anything the account currently reports, and the request would
 * be dropped. This map keeps the topic-to-wallet pairing we already knew at
 * approval time, so the lookup survives rotation.
 *
 * The map is device-local, in `account.localDisklet`, because a WalletConnect
 * session is device-local too: the sign client keeps the session and its keys
 * in that device's own storage, and no other device subscribes to the topic. A
 * synced copy would give every other device entries it can never use, and would
 * make pruning unsafe, since one device's unknown topic is another device's
 * live session.
 */
export const rememberSessionWallet = async (
  account: EdgeAccount,
  topic: string,
  walletId: string
): Promise<void> => {
  await queueStoreUpdate(async () => {
    const sessionWallets = await readSessionWallets(account)
    await writeSessionWallets(account, { ...sessionWallets, [topic]: walletId })
  })
}

/**
 * The stored map, pruned to the topics the local sign client still holds. The
 * client drops expired sessions and dapp disconnects from that list on its own,
 * so pruning against it is the only expiry this store needs.
 *
 * `getActiveTopics` runs inside the store's update queue rather than before
 * it: a topic list captured before a concurrent approval finishes writing would
 * not contain the new session, and the prune would delete its entry.
 */
export const readActiveSessionWallets = async (
  account: EdgeAccount,
  getActiveTopics: () => string[]
): Promise<SessionWallets> => {
  return await queueStoreUpdate(async () => {
    const sessionWallets = await readSessionWallets(account)

    const activeWallets: SessionWallets = {}
    for (const topic of getActiveTopics()) {
      const walletId = sessionWallets[topic]
      if (walletId != null) activeWallets[topic] = walletId
    }

    // Only rewrite the file when something actually fell out of it.
    const storedCount = Object.keys(sessionWallets).length
    if (Object.keys(activeWallets).length !== storedCount) {
      await writeSessionWallets(account, activeWallets)
    }
    return activeWallets
  })
}

export const forgetSessionWallet = async (
  account: EdgeAccount,
  topic: string
): Promise<void> => {
  await queueStoreUpdate(async () => {
    const sessionWallets = await readSessionWallets(account)
    if (sessionWallets[topic] == null) return

    const remaining: SessionWallets = {}
    for (const storedTopic of Object.keys(sessionWallets)) {
      if (storedTopic !== topic) {
        remaining[storedTopic] = sessionWallets[storedTopic]
      }
    }
    await writeSessionWallets(account, remaining)
  })
}

/**
 * Runs read-modify-write cycles on the map one at a time. The whole map is one
 * file, so two interleaved cycles would each write back a copy missing the
 * other's change.
 */
let storeQueue: Promise<unknown> = Promise.resolve()
const queueStoreUpdate = async <T>(update: () => Promise<T>): Promise<T> => {
  const result = storeQueue.then(update, update)
  storeQueue = result.catch(() => undefined)
  return await result
}

const readSessionWallets = async (
  account: EdgeAccount
): Promise<SessionWallets> => {
  try {
    return asSessionWallets(
      await account.localDisklet.getText(SESSION_WALLETS_FILENAME)
    )
  } catch {
    // No file yet, or contents this version can no longer read. Either way the
    // address on the session remains as the fallback, so start over rather than
    // taking down session listing and request routing.
    return {}
  }
}

const writeSessionWallets = async (
  account: EdgeAccount,
  sessionWallets: SessionWallets
): Promise<void> => {
  await account.localDisklet.setText(
    SESSION_WALLETS_FILENAME,
    JSON.stringify(sessionWallets)
  )
}
