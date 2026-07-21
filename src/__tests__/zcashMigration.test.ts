import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { getZcashMigrationStatus } from '../util/zcashMigration'

const goodStatus = {
  state: 'required',
  completedTransfers: 0,
  totalTransfers: 0,
  remainingOrchardZatoshi: '123',
  hasOverdueTransfers: false,
  isSynced: true
}

const makeFakeWallet = (opts: {
  pluginId: string
  otherMethods?: object
}): EdgeCurrencyWallet =>
  ({
    currencyInfo: { pluginId: opts.pluginId },
    otherMethods: opts.otherMethods ?? {}
  } as any)

describe('zcashMigration util', () => {
  it('returns status for a migration-capable zcash wallet', async () => {
    const wallet = makeFakeWallet({
      pluginId: 'zcash',
      otherMethods: {
        getMigrationStatus: async () => goodStatus
      }
    })
    const status = await getZcashMigrationStatus(wallet)
    expect(status?.state).toBe('required')
    expect(status?.remainingOrchardZatoshi).toBe('123')
  })

  it('returns undefined for non-zcash wallets', async () => {
    const wallet = makeFakeWallet({
      pluginId: 'bitcoin',
      otherMethods: { getMigrationStatus: async () => goodStatus }
    })
    expect(await getZcashMigrationStatus(wallet)).toBeUndefined()
  })

  it('returns undefined when the engine lacks the method (old accountbased)', async () => {
    const wallet = makeFakeWallet({ pluginId: 'zcash' })
    expect(await getZcashMigrationStatus(wallet)).toBeUndefined()
  })

  it('returns undefined when the engine call throws', async () => {
    const wallet = makeFakeWallet({
      pluginId: 'zcash',
      otherMethods: {
        getMigrationStatus: async () => {
          throw new Error('engine broke')
        }
      }
    })
    expect(await getZcashMigrationStatus(wallet)).toBeUndefined()
  })

  it('returns undefined on malformed status shapes', async () => {
    const wallet = makeFakeWallet({
      pluginId: 'zcash',
      otherMethods: {
        getMigrationStatus: async () => ({ state: 'bogus' })
      }
    })
    expect(await getZcashMigrationStatus(wallet)).toBeUndefined()
  })
})
