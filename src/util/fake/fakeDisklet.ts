/**
 * Accounts and wallets whose disklets return whatever a test supplies.
 *
 * Several suites built the same two stubs by hand — "an account whose
 * disklet returns this text", "a bitcoin wallet with one denomination" —
 * under the same names, with the `File not found` sentinel repeated because
 * that is what `isMissingFile` matches. Eleven ad-hoc
 * `as unknown as EdgeAccount` literals across seven files, which is how a
 * change to what counts as an absent file ends up fixed in some of them.
 */
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

/**
 * The error disklet raises for a file that is not there.
 *
 * Three backends spell it three ways and `isMissingFile` knows all three;
 * this is the memory backend's, which is what a stub should imitate.
 */
export function missingFileError(): Error {
  return new Error('File not found')
}

export interface FakeDiskletAccountOpts {
  /** Text the *synced* disklet returns, or absent for a missing file. */
  synced?: string
  /** Text the *local* disklet returns, or absent for a missing file. */
  local?: string
  /**
   * An error the *local* disklet raises instead of answering.
   *
   * For a file that is present and unreadable, which is a different case
   * from absent: `account.localDisklet` is core's `encryptDisklet`, so a
   * truncated file fails inside `JSON.parse`/`decryptText` and does not
   * match `isMissingFile`.
   */
  localError?: Error
  /** Counts each synced read, for a test measuring repeat reads. */
  onSyncedRead?: () => void
  username?: string
  rootLoginId?: string
}

/** An account that is nothing but two disklets. */
export function makeFakeDiskletAccount(
  opts: FakeDiskletAccountOpts = {}
): EdgeAccount {
  const read = async (text: string | undefined): Promise<string> => {
    if (text == null) throw missingFileError()
    return text
  }
  return {
    username: opts.username ?? 'clitester',
    rootLoginId: opts.rootLoginId ?? 'root123',
    logout: async () => {},
    waitForAllWallets: async () => {},
    disklet: {
      getText: async () => {
        opts.onSyncedRead?.()
        return await read(opts.synced)
      }
    },
    localDisklet: {
      getText: async () => {
        if (opts.localError != null) throw opts.localError
        return await read(opts.local)
      }
    }
  } as unknown as EdgeAccount
}

const BTC_DENOM = { name: 'BTC', multiplier: '100000000', symbol: '₿' }

/** A wallet with one denomination and no tokens. */
export function makeFakeDenomWallet(
  opts: { pluginId?: string; id?: string } = {}
): EdgeCurrencyWallet {
  const pluginId = opts.pluginId ?? 'bitcoin'
  return {
    id: opts.id ?? 'wallet-1',
    currencyInfo: {
      pluginId,
      currencyCode: 'BTC',
      denominations: [BTC_DENOM]
    },
    currencyConfig: {
      currencyInfo: { pluginId, denominations: [BTC_DENOM] },
      allTokens: {}
    }
  } as unknown as EdgeCurrencyWallet
}
