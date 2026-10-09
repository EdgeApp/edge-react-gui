import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type { EdgeFetchFunction } from 'edge-core-js'

import {
  configureInfoServer,
  configureNetwork,
  fetchInfo,
  fetchPublicRollup,
  fetchWaterfall,
  infoServerData
} from '../../util/network'

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

/**
 * The info-server rework, which no test could reach.
 *
 * `configureInfoServer`'s parameter capture, `fetchPublicRollup`'s
 * "configureInfoServer has not run yet" guard and its error arm were
 * uncovered by the whole suite, and the CLI harnesses cannot reach them:
 * only `src/app.ts` and `src/util/keysStore.ts` call these, and the engine
 * signs its own rollup through `fetchPluginKeys`. The contract they carry is
 * `keysStore`'s cold-start fallback — when the signed fetch does not fill
 * `infoServerData.rollup`, this call is what fills it, and a call that
 * silently does nothing leaves every plugin with no `appKeys`.
 */
describe('fetchPublicRollup', () => {
  const warnings: string[] = []
  const realWarn = console.warn

  beforeEach(() => {
    warnings.length = 0
    console.warn = (...args: unknown[]) => {
      warnings.push(args.map(String).join(' '))
    }
    configureNetwork({ infoServers: ['https://info.example'] })
  })

  afterEach(() => {
    console.warn = realWarn
  })

  // The smallest shape `asInfoRollup` accepts, derived from the cleaner.
  const rollup = {
    appIdInfo: {},
    apyValues: { policies: {} },
    blockBook: {},
    networkFees: {}
  }

  it('does nothing but warn before configureInfoServer has run', async () => {
    // The state `keysStore`'s cold-start fallback can arrive in. Without a
    // report this returned having done nothing at all, and the plugins'
    // missing `appKeys` was the only symptom.
    let asked = 0
    const doFetch: any = async () => {
      ++asked
      return {
        ok: true,
        status: 200,
        json: async () => rollup,
        text: async () => ''
      }
    }
    // No `configureInfoServer` call in this case.
    await fetchPublicRollup(doFetch)
    expect(asked).toBe(0)
    expect(warnings.join('\n')).toContain('configureInfoServer has not run')
  })

  it('fills the rollup from the device fields it captured', async () => {
    const paths: string[] = []
    let rolled = 0
    configureInfoServer({
      osType: 'ios',
      osVersion: '18.1',
      appVersion: '4.52.0',
      appId: 'edge',
      onRollup: async () => {
        ++rolled
      }
    })
    const doFetch: any = async (uri: string) => {
      paths.push(uri)
      return {
        ok: true,
        status: 200,
        json: async () => rollup,
        text: async () => ''
      }
    }
    await fetchPublicRollup(doFetch)

    expect(paths).toHaveLength(1)
    expect(paths[0]).toContain('v1/infoRollup/edge')
    expect(paths[0]).toContain('os=ios')
    expect(paths[0]).toContain('osVersion=18.1')
    expect(paths[0]).toContain('appVersion=4.52.0')
    expect(infoServerData.rollup).not.toBeNull()
    // `onRollup` is the version check, and it runs only on success.
    expect(rolled).toBe(1)
    expect(warnings).toStrictEqual([])
  })

  it('reports the status and the body for a refusal', async () => {
    configureInfoServer({
      osType: 'android',
      osVersion: '15',
      appVersion: '4.52.0',
      appId: 'edge'
    })
    const doFetch: any = async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
      text: async () => 'info server unavailable'
    })
    await fetchPublicRollup(doFetch)
    const text = warnings.join('\n')
    expect(text).toContain('503')
    expect(text).toContain('info server unavailable')
  })

  it('reports the error itself when nothing could be reached', async () => {
    // With the error, which is the whole point of that arm: "failed to
    // reach the info server" for what may be a cleaner rejection from
    // `asInfoRollup`, or "No servers configured", was the one line an
    // investigator got.
    configureInfoServer({
      osType: 'ios',
      osVersion: '18.1',
      appVersion: '4.52.0',
      appId: 'edge'
    })
    const doFetch: any = async () => {
      throw new Error('getaddrinfo ENOTFOUND info.example')
    }
    await fetchPublicRollup(doFetch)
    const text = warnings.join('\n')
    expect(text).toContain('Failed to reach the info server')
    expect(text).toContain('ENOTFOUND')
  })

  it('reports a rollup the cleaner rejects, rather than storing it', async () => {
    configureInfoServer({
      osType: 'ios',
      osVersion: '18.1',
      appVersion: '4.52.0',
      appId: 'edge'
    })
    let rolled = 0
    configureInfoServer({
      osType: 'ios',
      osVersion: '18.1',
      appVersion: '4.52.0',
      appId: 'edge',
      onRollup: async () => {
        ++rolled
      }
    })
    const doFetch: any = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ...rollup, appIdInfo: 'not an object' }),
      text: async () => ''
    })
    await fetchPublicRollup(doFetch)
    expect(warnings.join('\n')).toContain('Failed to reach the info server')
    // And the version check did not run on a rollup that was never stored.
    expect(rolled).toBe(0)
  })
})
