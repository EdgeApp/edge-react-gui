import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeFetchFunction } from 'edge-core-js'

import { configureNetwork, fetchInfo, fetchWaterfall } from '../../util/network'

describe('fetchWaterfall', () => {
  it('refuses an empty server list instead of hanging', async () => {
    // `asyncWaterfall([])` awaits `Promise.race([])`, which never settles, so
    // an unconfigured list used to hang the caller forever.
    await expect(fetchWaterfall([], 'v1/infoRollup/edge')).rejects.toThrow(
      /No servers configured for v1\/infoRollup\/edge/
    )
  })

  it('fetches from a configured server', async () => {
    const doFetch = jest.fn(async () => ({
      ok: true
    })) as unknown as EdgeFetchFunction
    const result = await fetchWaterfall(
      ['https://info1.example'],
      'v1/thing',
      undefined,
      5000,
      doFetch
    )

    expect(result).toEqual({ ok: true })
    expect(doFetch).toHaveBeenCalledWith(
      'https://info1.example/v1/thing',
      undefined
    )
  })

  // Two servers, because that is the only shape that runs what the rewrite
  // changed. `fetchInfo`, `fetchRates`, `fetchReferral` and `fetchPush` all
  // call this with two in production; with one, `pending > 1` is false, no
  // stagger promise is pushed and the `finally` has nothing to clear — so
  // the stagger timeout, the failover and the timer cleanup were all dark.
  it('moves to the next server when the first does not answer in time', async () => {
    jest.useFakeTimers()
    try {
      let settleFirst: (() => void) | undefined
      const doFetch = jest.fn(async (uri: string) => {
        if (uri.startsWith('https://info1.example')) {
          // Hangs until the stagger timer fires and the race moves on.
          return await new Promise(resolve => {
            settleFirst = () => {
              resolve({ ok: true, from: 'first' })
            }
          })
        }
        return { ok: true, from: 'second' }
      }) as unknown as EdgeFetchFunction

      const pending = fetchWaterfall(
        ['https://info1.example', 'https://info2.example'],
        'v1/thing',
        undefined,
        5000,
        doFetch
      )
      await jest.advanceTimersByTimeAsync(5000)
      expect(await pending).toEqual({ ok: true, from: 'second' })

      settleFirst?.()
    } finally {
      jest.useRealTimers()
    }
  })

  // The leak itself, which is a *won* race rather than a lost one: with two
  // servers the first gets a stagger timer, and when it answers first the
  // race returns and `promises` is dropped — leaving that timer armed for the
  // rest of `timeoutMs`. Behind a daemon that delays an exit; in a jest
  // worker it reads as a leaked handle that hides the next real one.
  it('clears the stagger timer when the first server wins', async () => {
    jest.useFakeTimers()
    try {
      const doFetch = jest.fn(async () => ({
        ok: true
      })) as unknown as EdgeFetchFunction

      expect(
        await fetchWaterfall(
          ['https://info1.example', 'https://info2.example'],
          'v1/thing',
          undefined,
          5000,
          doFetch
        )
      ).toEqual({ ok: true })
      expect(doFetch).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      jest.useRealTimers()
    }
  })

  it('throws the last error when every server rejects', async () => {
    const doFetch = jest.fn(async (uri: string) => {
      throw new Error(`down: ${uri}`)
    }) as unknown as EdgeFetchFunction

    // `pending === 0` rethrows rather than resolving `undefined`, which a
    // caller would read as a successful empty response.
    await expect(
      fetchWaterfall(
        ['https://info1.example', 'https://info2.example'],
        'v1/thing',
        undefined,
        5000,
        doFetch
      )
    ).rejects.toThrow(/down: https:\/\/info2\.example/)
    expect(doFetch).toHaveBeenCalledTimes(2)
  })
})

describe('configureNetwork', () => {
  it('keeps the production info servers when given an empty list', async () => {
    configureNetwork({ infoServers: [] })
    const doFetch = jest.fn(async () => ({
      ok: true
    })) as unknown as EdgeFetchFunction

    await fetchInfo('v1/infoRollup/edge', undefined, 5000, doFetch)

    const [uri] = (doFetch as unknown as jest.Mock).mock.calls[0] as [string]
    expect(uri).toMatch(/^https:\/\/info[12]\.edge\.app\//)
  })
})
