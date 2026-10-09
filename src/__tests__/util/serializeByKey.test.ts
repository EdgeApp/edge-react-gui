import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'

import { pendingKeyCount, serializeByKey } from '../../util/serializeByKey'

// `jestSetup.js` installs fake timers for every suite. These cases are about
// real interleaving, so they need the real clock.
beforeAll(() => {
  jest.useRealTimers()
})
afterAll(() => {
  jest.useFakeTimers()
})

/** A read-modify-write over one shared value, with an await in the middle. */
function makeStore(): {
  bump: () => Promise<void>
  value: () => number
} {
  let value = 0
  return {
    value: () => value,
    bump: async () => {
      const read = value
      await new Promise(resolve => setTimeout(resolve, 5))
      value = read + 1
    }
  }
}

describe('serializeByKey', () => {
  it('a read-modify-write loses updates without it', async () => {
    const store = makeStore()
    await Promise.all([store.bump(), store.bump(), store.bump()])
    // Each call read 0 before any of them wrote, so two increments vanished —
    // the same way two `mergeExportTxInfo` calls discarded each other's keys.
    expect(store.value()).toBe(1)
  })

  it('serializes operations sharing a key', async () => {
    const store = makeStore()
    await Promise.all([
      serializeByKey('k', store.bump),
      serializeByKey('k', store.bump),
      serializeByKey('k', store.bump)
    ])
    expect(store.value()).toBe(3)
  })

  it('does not serialize across different keys', async () => {
    const order: string[] = []
    const slow = async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 20))
      order.push('slow')
    }
    const quick = async (): Promise<void> => {
      order.push('quick')
    }
    await Promise.all([serializeByKey('a', slow), serializeByKey('b', quick)])
    expect(order).toStrictEqual(['quick', 'slow'])
  })

  it('a failure does not poison the queue behind it', async () => {
    const store = makeStore()
    const failed = serializeByKey('k', async () => {
      throw new Error('boom')
    })
    const after = serializeByKey('k', store.bump)
    await expect(failed).rejects.toThrow('boom')
    await after
    expect(store.value()).toBe(1)
  })

  it('returns the operation value and drops the key when idle', async () => {
    await expect(serializeByKey('k', async () => 42)).resolves.toBe(42)
    expect(pendingKeyCount()).toBe(0)
  })
})
