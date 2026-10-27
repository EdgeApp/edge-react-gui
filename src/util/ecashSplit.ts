import {
  asJSON,
  asMaybe,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

//
// Splitting a Bitcoin wallet into eCash (ECX) makes edge-core-js sweep the new
// ECX wallet to itself. Until that sweep confirms, both wallets still share
// UTXOs, so a Bitcoin send can be replayed on ECX and move the ECX as well.
//

/** The eCash (ECX) plugins whose wallets split from Bitcoin wallets. */
export const ECASH_BITCOIN_PLUGIN_IDS = ['ecashbitcoin', 'ecashbitcoinbetanet']

/**
 * The file edge-core-js keeps in a split ECX wallet's synced storage:
 * `pending` until the sweep goes out, then `sent` with its txid, or `empty`
 * when the wallet had nothing to sweep.
 */
const PROTECTION_FILE = 'EcxProtection.json'
const asProtectionFile = asJSON(
  asObject({
    status: asValue('pending', 'sent', 'empty'),
    txid: asOptional(asString)
  })
)

const asUtxoPublicKeys = asObject({
  publicKeys: asObject(asOptional(asString))
})

/**
 * Whether a Bitcoin send from a wallet can be replayed on an eCash (ECX)
 * wallet split from it:
 * - `unsent`: a split wallet has not sent its protection sweep yet.
 * - `unconfirmed`: a split wallet's protection sweep has not confirmed.
 * - `clear`: nothing is pending, though a new split can change that.
 * - `settled`: nothing can become pending until the wallet splits again,
 *   because it is not a Bitcoin wallet or every split wallet is protected.
 */
export type EcashSplitStatus = 'unsent' | 'unconfirmed' | 'clear' | 'settled'

export async function getEcashSplitStatus(
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): Promise<EcashSplitStatus> {
  if (wallet.currencyInfo.pluginId !== 'bitcoin') return 'settled'
  const xpubs = getXpubs(wallet)
  if (xpubs.length === 0) return 'settled'

  const statuses: EcashSplitStatus[] = []
  for (const ecashWallet of Object.values(account.currencyWallets)) {
    const { pluginId } = ecashWallet.currencyInfo
    if (!ECASH_BITCOIN_PLUGIN_IDS.includes(pluginId)) continue

    // A split wallet derives the same xpubs as the wallet it came from:
    if (!getXpubs(ecashWallet).some(xpub => xpubs.includes(xpub))) continue
    statuses.push(await getSweepStatus(ecashWallet))
  }

  if (statuses.includes('unsent')) return 'unsent'
  if (statuses.includes('unconfirmed')) return 'unconfirmed'
  return statuses.length > 0 && statuses.every(status => status === 'settled')
    ? 'settled'
    : 'clear'
}

async function getSweepStatus(
  wallet: EdgeCurrencyWallet
): Promise<EcashSplitStatus> {
  const protection = await loadProtectionFile(wallet)

  // An ECX wallet that did not split from Bitcoin has nothing to sweep:
  if (protection == null) return 'clear'
  if (protection.status === 'empty') return 'settled'
  if (protection.status === 'pending' || protection.txid == null) {
    return 'unsent'
  }

  const { txid } = protection
  const stream = wallet.streamTransactions({
    tokenId: null,
    searchString: txid
  })
  // Leaving the loop early closes the stream over the core bridge:
  for await (const transactions of stream) {
    const sweep = transactions.find(transaction => transaction.txid === txid)
    if (sweep != null) {
      return sweep.confirmations === 'confirmed' ? 'settled' : 'unconfirmed'
    }
  }
  return 'unconfirmed'
}

async function loadProtectionFile(
  wallet: EdgeCurrencyWallet
): Promise<ReturnType<typeof asProtectionFile> | undefined> {
  try {
    return asMaybe(asProtectionFile)(
      await wallet.disklet.getText(PROTECTION_FILE)
    )
  } catch (error: unknown) {
    // A wallet edge-core-js never protected has no file:
    return undefined
  }
}

function getXpubs(wallet: EdgeCurrencyWallet): string[] {
  const keys = asMaybe(asUtxoPublicKeys)(wallet.publicWalletInfo.keys)
  if (keys == null) return []
  return Object.values(keys.publicKeys).filter(
    (xpub): xpub is string => xpub != null
  )
}
