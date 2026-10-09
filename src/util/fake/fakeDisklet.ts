/**
 * The fixtures the shared GUI/CLI suites read and write files with.
 *
 * Several suites built the same two stubs by hand — "an account whose
 * disklet returns this text", "a bitcoin wallet with one denomination" —
 * under the same names, each repeating its own absent-file sentinel, which
 * is how a change to what counts as an absent file ends up fixed in some of
 * them and not others. The suites that read or write an account file come
 * through here now; the ad-hoc `as unknown as EdgeAccount` literals that
 * remain elsewhere stand in for an account that is never read from.
 *
 * The denominations and the token map are here with them because the same
 * suites need both halves — a wallet to read a threshold from and a config
 * to look a denomination up in — and `spamThreshold.test.ts` was writing the
 * wallet out by hand twelve lines after importing this module. The
 * `currencyConfig` inside comes from the GUI's own `makeFakeCurrencyConfig`.
 */
import type {
  EdgeAccount,
  EdgeCurrencyWallet,
  EdgeTokenMap
} from 'edge-core-js'

import { makeFakeCurrencyConfig } from './fakeCurrencyConfig'

/**
 * The error disklet raises for a file that is not there.
 *
 * Verbatim from `node_modules/disklet/lib/disklet.js`, which rejects a
 * missing `getText` with `Cannot load "<path>"` from every in-memory backend
 * — and so does core's `encryptDisklet`, which is what the engine actually
 * reads through. A stub that invents its own wording tests the predicate
 * against a string production never produces: the sentinel here used to be
 * `File not found`, which appears in no JavaScript under `node_modules`.
 */
export function missingFileError(path = 'file.json'): Error {
  return new Error(`Cannot load "${path}"`)
}

/**
 * The same thing from disklet's node backend, which fails with an errno.
 *
 * `isMissingFile` matches this by `code`, not by message, so it is the one
 * absent-file shape that does not depend on anyone's prose.
 */
export function missingFileErrnoError(path = 'file.json'): Error {
  return Object.assign(
    new Error(`ENOENT: no such file or directory, open '${path}'`),
    { code: 'ENOENT' }
  )
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
  /** The same, for the *synced* disklet — `Categories.json` lives there. */
  syncedError?: Error
  /** Counts each synced read, for a test measuring repeat reads. */
  onSyncedRead?: () => void
  /**
   * Every write, so a suite can assert what reached the disklet.
   *
   * There was no seam for one, so `localSettingsTrust.test.ts` replaced the
   * fixture's own `setText` through `as any` at three sites — a cast through
   * the return type, which is the hazard this module exists to remove, one
   * layer up. An absent callback keeps the old behaviour: `setText` resolves
   * and discards.
   */
  onLocalWrite?: (path: string, text: string) => void
  /** The same for the synced disklet, where `Categories.json` lives. */
  onSyncedWrite?: (path: string, text: string) => void
  /** An error either `setText` raises instead of resolving. */
  writeError?: Error
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
        if (opts.syncedError != null) throw opts.syncedError
        return await read(opts.synced)
      },
      setText: async (path: string, text: string) => {
        if (opts.writeError != null) throw opts.writeError
        opts.onSyncedWrite?.(path, text)
      }
    },
    localDisklet: {
      getText: async () => {
        if (opts.localError != null) throw opts.localError
        return await read(opts.local)
      },
      setText: async (path: string, text: string) => {
        if (opts.writeError != null) throw opts.writeError
        opts.onLocalWrite?.(path, text)
      }
    }
  } as unknown as EdgeAccount
}

/**
 * A wallet that is nothing but a disklet, for the per-wallet files.
 *
 * `exportTxInfo.json` lives on `wallet.disklet`, and `mergeExportTxInfo`
 * keys its serialisation on `wallet.id`, so a suite needs both — and a
 * writable one, since the whole point of that module is what it leaves on
 * disk after a merge. Reads come from the map this holds, so a write is
 * visible to the next read the way a real disklet is.
 */
export function makeFakeDiskletWallet(
  opts: {
    id?: string
    currencyCode?: string
    files?: Record<string, string>
    readError?: Error
    onWrite?: (path: string, text: string) => void
  } = {}
): EdgeCurrencyWallet {
  const files = opts.files ?? {}
  return {
    id: opts.id ?? 'wallet-1',
    currencyInfo: {
      pluginId: 'bitcoin',
      currencyCode: opts.currencyCode ?? 'BTC',
      denominations: [BTC_DENOM]
    },
    disklet: {
      getText: async (path: string) => {
        if (opts.readError != null) throw opts.readError
        const text = files[path]
        if (text == null) throw missingFileError(path)
        return text
      },
      setText: async (path: string, text: string) => {
        files[path] = text
        opts.onWrite?.(path, text)
      }
    }
  } as unknown as EdgeCurrencyWallet
}

/** Bitcoin's real display denomination, as core reports it. */
export const BTC_DENOM = { name: 'BTC', multiplier: '100000000', symbol: '₿' }

/** A six-decimal token denomination, for the token arm of a denom lookup. */
export const USDC_DENOM = { name: 'USDC', multiplier: '1000000', symbol: '' }

/** One token map with `deadbeef` as its id, which the denom tests look up. */
export const USDC_TOKENS: EdgeTokenMap = {
  deadbeef: {
    currencyCode: 'USDC',
    displayName: 'USD Coin',
    denominations: [USDC_DENOM],
    networkLocation: {}
  }
}

/**
 * A wallet with one denomination, and tokens if a test asks for them.
 *
 * Its `currencyConfig` comes from the GUI's own `makeFakeCurrencyConfig`, so
 * a wallet fixture and a config fixture are the same shape. Three suites
 * wrote this value out by hand — one of them twelve lines after importing
 * this module — which is how `allTokens` and the denomination list end up
 * answering differently in two tests of the same function.
 */
export function makeFakeDenomWallet(
  opts: { pluginId?: string; id?: string; tokens?: EdgeTokenMap } = {}
): EdgeCurrencyWallet {
  const pluginId = opts.pluginId ?? 'bitcoin'
  const tokens = opts.tokens ?? {}
  return {
    id: opts.id ?? 'wallet-1',
    currencyInfo: {
      pluginId,
      currencyCode: 'BTC',
      denominations: [BTC_DENOM]
    },
    currencyConfig: makeFakeCurrencyConfig(
      { pluginId, currencyCode: 'BTC', denominations: [BTC_DENOM] },
      tokens
    )
  } as unknown as EdgeCurrencyWallet
}

/**
 * An account whose wallet ids are all a resolver needs.
 *
 * `findWallet`, `findWalletId` and `displayKey` read `currencyWallets` — and
 * `findWalletId` reads `allKeys` as well, because core builds
 * `currencyWallets` only from `activeWalletIds` and only for wallets whose
 * api exists: an archived wallet is in `allKeys` and absent from the map,
 * which is the distinction those resolvers are about. Three suites wrote
 * this out by hand, two of them in one file, one a strict superset of the
 * other.
 *
 * `loaded` defaults to `allKeys`, so a caller that does not care about the
 * distinction passes one list.
 */
export function makeFakeWalletAccount(opts: {
  allKeys: string[]
  loaded?: string[]
}): EdgeAccount {
  const loaded = opts.loaded ?? opts.allKeys
  const currencyWallets: Record<string, EdgeCurrencyWallet> = {}
  for (const id of loaded) {
    currencyWallets[id] = { id } as unknown as EdgeCurrencyWallet
  }
  return {
    allKeys: opts.allKeys.map(id => ({ id })),
    currencyWallets
  } as unknown as EdgeAccount
}
