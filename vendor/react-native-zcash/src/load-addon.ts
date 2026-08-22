import { existsSync } from 'fs'
import { join } from 'path'

export interface NativeZcashAddon {
  setDocumentDirectory: (path: string) => void
  initialize: (
    mnemonicSeed: string,
    birthdayHeight: number,
    alias: string,
    networkName: string,
    defaultHost: string,
    defaultPort: number,
    newWallet: boolean
  ) => Promise<void>
  stop: (alias: string) => Promise<string>
  rescan: (alias: string) => Promise<void>
  deriveUnifiedAddress: (alias: string) => Promise<{
    unifiedAddress: string
    saplingAddress: string
    transparentAddress: string
  }>
  getLatestNetworkHeight: (alias: string) => Promise<number>
  getBirthdayHeight: (host: string, port: number) => Promise<number>
  isValidAddress: (address: string, network: string) => boolean
  deriveViewingKey: (mnemonicSeed: string, network: string) => string
  ironwoodActivationHeight: (network: string) => number | null
  poll: (alias: string) => Promise<{
    alias: string
    status: string
    scanProgress: number
    networkBlockHeight: number
    balances: {
      transparentAvailableZatoshi: string
      transparentTotalZatoshi: string
      saplingAvailableZatoshi: string
      saplingTotalZatoshi: string
      orchardAvailableZatoshi: string
      orchardTotalZatoshi: string
      ironwoodAvailableZatoshi: string
      ironwoodTotalZatoshi: string
    }
    transactions: Array<{
      rawTransactionId: string
      blockTimeInSeconds: number
      minedHeight: number
      value: string
      fee?: string
      toAddress?: string
      isShielding: boolean
      isExpired: boolean
      memos: string[]
    }>
  }>
  proposeTransfer: (
    alias: string,
    zatoshi: string,
    toAddress: string,
    memo?: string
  ) => Promise<string>
  createTransfer: (
    alias: string,
    proposalBase64: string,
    mnemonicSeed: string
  ) => Promise<string>
  shieldFunds: (
    alias: string,
    seed: string,
    memo: string,
    threshold: string
  ) => Promise<string>
  proposeOrchardToIronwoodMigration: (alias: string) => Promise<string>
  proposeFulfillingPaymentUri: (
    alias: string,
    paymentUri: string
  ) => Promise<string>
  emitExistingTransactions: (alias: string) => Promise<void>
}

function candidatePaths(): string[] {
  const here = __dirname
  const platform = `${process.platform}-${process.arch}`
  const out: string[] = []
  let dir = here
  for (let i = 0; i < 6; i++) {
    out.push(join(dir, 'prebuilds', platform, 'zcash.node'))
    out.push(join(dir, 'rust', 'target', 'release', 'libzcash.dylib'))
    out.push(join(dir, 'rust', 'target', 'release', 'libzcash.so'))
    const parent = join(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return out
}

let cached: NativeZcashAddon | undefined

export function loadNativeAddon(): NativeZcashAddon {
  if (cached != null) return cached

  const errors: string[] = []
  const missing: string[] = []
  for (const candidate of candidatePaths()) {
    try {
      if (!existsSync(candidate)) {
        missing.push(candidate)
        continue
      }
      // Native addon loaded at runtime when the .node binary exists.
      const mod = require(candidate) as NativeZcashAddon
      if (typeof mod.initialize !== 'function') continue
      cached = mod
      return cached
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${candidate}: ${message}`)
    }
  }

  throw new Error(
    'react-native-zcash Node addon not found. Run `npm run build-native-host`. ' +
      (errors.length > 0
        ? errors.join('; ')
        : `Looked in: ${missing.join(', ')}`)
  )
}
