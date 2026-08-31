import { existsSync } from 'fs'
import { join } from 'path'

export interface NativeDashAddon {
  setDocumentDirectory: (path: string) => void
  initialize: (
    mnemonicSeed: string,
    account: number,
    alias: string,
    networkName: string,
    defaultHost: string,
    defaultPort: number
  ) => Promise<void>
  stop: (alias: string) => Promise<string>
  startSync: (alias: string) => Promise<void>
  stopSync: (alias: string) => Promise<void>
  deriveShieldedAddress: (alias: string) => Promise<{ shieldedAddress: string }>
  isValidAddress: (address: string, network: string) => boolean
  deriveViewingKey: (mnemonicSeed: string, network: string) => string
  warmUpProver: () => Promise<void>
  isProverReady: () => boolean
  poll: (
    alias: string
  ) => Promise<{
    alias: string
    status: string
    scanProgress: number
    networkBlockHeight: number
    availableCredits: string
    totalCredits: string
    transactions: Array<{
      txid: string
      blockTimeInSeconds: number
      minedHeight: number
      value: string
      fee?: string
      toAddress?: string
      memos: string[]
    }>
  }>
  proposeTransfer: (
    alias: string,
    amountCredits: string,
    toAddress: string,
    memo?: string
  ) => Promise<string>
  createTransfer: (
    alias: string,
    proposalId: string,
    mnemonicSeed: string
  ) => Promise<string>
}

function candidatePaths(): string[] {
  const here = __dirname
  const platform = `${process.platform}-${process.arch}`
  const out: string[] = []
  let dir = here
  for (let i = 0; i < 6; i++) {
    out.push(join(dir, 'prebuilds', platform, 'dashshielded.node'))
    out.push(join(dir, 'rust', 'target', 'release', 'libdashshielded.dylib'))
    out.push(join(dir, 'rust', 'target', 'release', 'libdashshielded.so'))
    const parent = join(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return out
}

let cached: NativeDashAddon | undefined

export function loadNativeAddon(): NativeDashAddon {
  if (cached != null) return cached

  const errors: string[] = []
  const missing: string[] = []
  for (const candidate of candidatePaths()) {
    try {
      if (!existsSync(candidate)) {
        missing.push(candidate)
        continue
      }
      const mod = require(candidate) as NativeDashAddon
      if (typeof mod.initialize !== 'function') continue
      cached = mod
      return cached
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${candidate}: ${message}`)
    }
  }

  throw new Error(
    'dash-shielded-native Node addon not found. Run `npm run build-native-host`. ' +
      (errors.length > 0
        ? errors.join('; ')
        : `Looked in: ${missing.join(', ')}`)
  )
}
