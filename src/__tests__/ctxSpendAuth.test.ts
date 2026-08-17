import { describe, expect, jest, test } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

// `ctxSpendAuth` reaches for the platform CSPRNG and a native uuid; both are
// React Native modules, so they are stubbed to keep this runnable in Node.
let mockRandomCallCount = 0
jest.mock('react-native-securerandom', () => ({
  generateSecureRandom: async (length: number) => {
    mockRandomCallCount += 1
    // A valid, distinct secp256k1 scalar per call.
    const bytes = new Uint8Array(length)
    bytes[length - 1] = mockRandomCallCount
    return bytes
  }
}))
jest.mock('../util/rnUtils', () => ({
  makeUuid: async () => `uuid-${mockRandomCallCount}`
}))

const { makeCtxSpendSession } = require('../plugins/gift-cards/ctxSpendAuth')

/** Minimal account whose dataStore records what was written. */
const makeAccount = (): {
  account: EdgeAccount
  items: Map<string, string>
} => {
  const items = new Map<string, string>()
  const account = {
    username: 'test-user',
    dataStore: {
      listItemIds: async () => [...items.keys()],
      getItem: async (_storeId: string, itemId: string) => {
        const text = items.get(itemId)
        if (text == null) throw new Error('missing')
        return text
      },
      setItem: async (_storeId: string, itemId: string, text: string) => {
        items.set(itemId, text)
      }
    }
  } as unknown as EdgeAccount
  return { account, items }
}

describe('ensureIdentity', () => {
  test('concurrent callers share one keypair instead of racing', async () => {
    // The Connect and Buy buttons can both call this on a first run. Two
    // keypairs would strand whichever CTX user lost, with no recovery.
    const { account, items } = makeAccount()
    const session = makeCtxSpendSession({
      clientId: 'edge',
      baseUrl: 'https://staging.spend.ctx.com'
    })

    const results = await Promise.all([
      session.ensureIdentity(account),
      session.ensureIdentity(account),
      session.ensureIdentity(account)
    ])

    expect(results).toEqual(['ready', 'ready', 'ready'])
    expect(items.size).toBe(1)
    expect(session.getPublicKeyHex()).toBeDefined()
  })

  test('a second call reuses the stored identity rather than making another', async () => {
    const { account, items } = makeAccount()
    const session = makeCtxSpendSession({
      clientId: 'edge',
      baseUrl: 'https://staging.spend.ctx.com'
    })

    expect(await session.ensureIdentity(account)).toBe('ready')
    const firstKey = session.getPublicKeyHex()

    // A fresh session over the same store recovers the same user.
    const session2 = makeCtxSpendSession({
      clientId: 'edge',
      baseUrl: 'https://staging.spend.ctx.com'
    })
    expect(await session2.ensureIdentity(account)).toBe('ready')

    expect(session2.getPublicKeyHex()).toBe(firstKey)
    expect(items.size).toBe(1)
  })

  test('a light account gets no identity and no stored key', async () => {
    const { account, items } = makeAccount()
    const lightAccount = {
      ...account,
      username: null
    } as unknown as EdgeAccount
    const session = makeCtxSpendSession({
      clientId: 'edge',
      baseUrl: 'https://staging.spend.ctx.com'
    })

    expect(await session.ensureIdentity(lightAccount)).toBe('light-account')
    expect(items.size).toBe(0)
  })
})
