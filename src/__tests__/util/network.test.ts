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
  coinrankListData,
  configureInfoServer,
  configureNetwork,
  fetchInfo,
  fetchPublicRollup,
  fetchWaterfall,
  infoServerData,
  initInfoServer,
  refreshCoinrankList,
  refreshPublicRollup,
  stopInfoServerPoll
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

  it('survives a server that rejects with something that is not an object', async () => {
    // The index used to be written onto the rejected value, which only
    // works when it is an object: a string rejection made that assignment
    // throw a `TypeError` under strict mode — so `promises.splice(undefined,
    // 1)` removed the wrong entry, the `pop()` after it removed a second,
    // and on the last server the error rethrown was the `TypeError` rather
    // than the real failure. Behind the daemon's rates and `infoRollup`
    // paths that costs a still-pending server its turn.
    let asked = 0
    const doFetch = jest.fn(async (uri: string) => {
      // A bare string, which is the shape this case is about.
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      if (++asked === 1) throw 'first server said no'
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
        text: async () => ''
      }
    }) as unknown as EdgeFetchFunction

    // The second server still gets its turn, and answers.
    const response = await fetchWaterfall(
      ['https://info1.example', 'https://info2.example'],
      'v1/thing',
      undefined,
      5000,
      doFetch
    )
    expect(response.status).toBe(200)
    expect(asked).toBe(2)
  })

  it('rethrows the server’s own error, not its bookkeeping', async () => {
    const doFetch = jest.fn(async () => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'every server said no'
    }) as unknown as EdgeFetchFunction
    await expect(
      fetchWaterfall(
        ['https://info1.example'],
        'v1/thing',
        undefined,
        5000,
        doFetch
      )
    ).rejects.toBe('every server said no')
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
    // Said as what it is: the server answered, and its answer could not be
    // read. "Failed to reach the info server" was wrong for this case.
    expect(warnings.join('\n')).toContain('Could not read the info rollup')
    expect(warnings.join('\n')).not.toContain('Failed to reach')
    // And the version check did not run on a rollup that was never stored.
    expect(rolled).toBe(0)
  })

  it('reports a failing onRollup as that, not as an unreachable server', async () => {
    // `src/app.ts` passes `runOnce('checkAppVersion', checkAppVersion)`, so
    // a version-check failure was reported as an unreachable server although
    // the rollup had been stored two lines earlier.
    configureInfoServer({
      osType: 'ios',
      osVersion: '18.1',
      appVersion: '4.52.0',
      appId: 'edge',
      onRollup: async () => {
        throw new Error('version check failed')
      }
    })
    const doFetch: any = async () => ({
      ok: true,
      status: 200,
      json: async () => rollup,
      text: async () => ''
    })
    await fetchPublicRollup(doFetch)
    const text = warnings.join('\n')
    expect(text).toContain('onRollup failed')
    expect(text).toContain('version check failed')
    expect(text).not.toContain('Failed to reach')
    expect(infoServerData.rollup).toBeDefined()
  })
})

/**
 * One in-flight request per resource, for the arm that fires on every
 * connectivity transition.
 *
 * `makePeriodicTask` ended the overlap on the info-server *poll* and left it
 * intact on the NetInfo reconnect arm, which writes the same module state
 * (`infoServerData.rollup` / `rollupRaw`, `coinrankListData.coins`) with
 * nothing serialising it. `fetchPublicRollup` has no ceiling of its own —
 * `fetchWaterfall`'s `timeoutMs` is `asyncWaterfall`'s per-server stagger,
 * armed only when more than one server is pending — so against an info
 * server that accepts the connection and stalls, a lift, a train or a
 * tethered laptop accumulated one pending request per transition for the
 * life of the app, and whichever answered last decided the rollup.
 * `infoServerPollStarted` does not cover it: that latch only stops a second
 * poll being installed.
 */
describe('refreshPublicRollup', () => {
  const realFetch = globalThis.fetch
  const realWarn = console.warn

  beforeEach(() => {
    console.warn = () => {}
    configureNetwork({ infoServers: ['https://info.example'] })
    configureInfoServer({
      appId: undefined,
      appName: 'edge',
      appVersion: '1.0.0',
      brand: 'edge',
      deviceDescription: 'test',
      osType: 'ios',
      osVersion: '17',
      currencyCode: 'USD'
    } as any)
    stopInfoServerPoll()
  })

  afterEach(() => {
    globalThis.fetch = realFetch
    console.warn = realWarn
    stopInfoServerPoll()
  })

  const rollupBody = {
    appIdInfo: {},
    apyValues: { policies: {} },
    blockBook: {},
    networkFees: {}
  }

  it('joins a request already in flight instead of starting another', async () => {
    let asked = 0
    let release: (() => void) | undefined
    const held = new Promise<void>(resolve => {
      release = resolve
    })
    globalThis.fetch = (async () => {
      ++asked
      await held
      return {
        ok: true,
        status: 200,
        json: async () => rollupBody,
        text: async () => ''
      }
    }) as any

    // Five connectivity transitions in a row, which is what a flapping link
    // produces.
    const all = Promise.all([
      refreshPublicRollup(),
      refreshPublicRollup(),
      refreshPublicRollup(),
      refreshPublicRollup(),
      refreshPublicRollup()
    ])
    expect(asked).toBe(1)
    release?.()
    await all
    expect(asked).toBe(1)
  })

  it('starts a fresh request once the last one has settled', async () => {
    let asked = 0
    globalThis.fetch = (async () => {
      ++asked
      return {
        ok: true,
        status: 200,
        json: async () => rollupBody,
        text: async () => ''
      }
    }) as any

    await refreshPublicRollup()
    await refreshPublicRollup()
    // A join, not a cache: the caller wanted fresh data and the slot is
    // released when the request settles.
    expect(asked).toBe(2)
  })

  it('releases the slot when the request fails', async () => {
    let asked = 0
    globalThis.fetch = (async () => {
      ++asked
      throw new Error('no route to host')
    }) as any

    // `fetchPublicRollup` reports rather than rejecting, so these resolve.
    await refreshPublicRollup()
    await refreshPublicRollup()
    expect(asked).toBeGreaterThanOrEqual(2)
  })
})

describe('refreshCoinrankList', () => {
  const realFetch = globalThis.fetch

  beforeEach(() => {
    configureNetwork({ infoServers: ['https://info.example'] })
  })

  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it('joins a request already in flight', async () => {
    let asked = 0
    let release: (() => void) | undefined
    const held = new Promise<void>(resolve => {
      release = resolve
    })
    globalThis.fetch = (async () => {
      ++asked
      await held
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { bitcoin: '1' } }),
        text: async () => ''
      }
    }) as any

    const all = Promise.all([
      refreshCoinrankList(),
      refreshCoinrankList(),
      refreshCoinrankList()
    ])
    expect(asked).toBe(1)
    release?.()
    await all
    expect(asked).toBe(1)
    expect(coinrankListData.coins.bitcoin).toBe('1')
  })
})

/**
 * `initInfoServer`'s three decisions, none of which a test reached.
 *
 * Every case above drives `fetchPublicRollup` directly, so the launch-fetch
 * gate, the claim taken before the first await, and the poll this round
 * moved onto `makePeriodicTask` were all unasserted — and that last one is
 * the overlap fix itself.
 */
describe('initInfoServer', () => {
  const realFetch = globalThis.fetch
  const realWarn = console.warn
  const params = {
    osType: 'ios',
    osVersion: '17',
    appVersion: '1.0.0',
    appId: 'edge'
  }
  let asked = 0

  beforeEach(() => {
    jest.useFakeTimers()
    console.warn = () => {}
    configureNetwork({ infoServers: ['https://info.example'] })
    stopInfoServerPoll()
    infoServerData.rollup = undefined
    infoServerData.rollupRaw = undefined
    asked = 0
    globalThis.fetch = (async () => {
      ++asked
      return {
        ok: true,
        status: 200,
        json: async () => ({
          appIdInfo: {},
          apyValues: { policies: {} },
          blockBook: {},
          networkFees: {}
        }),
        text: async () => ''
      }
    }) as any
  })

  afterEach(() => {
    stopInfoServerPoll()
    globalThis.fetch = realFetch
    console.warn = realWarn
    jest.useRealTimers()
  })

  it('fetches the unsigned rollup at launch', async () => {
    await initInfoServer(params)
    expect(asked).toBe(1)
    expect(infoServerData.rollup).toBeDefined()
  })

  it('skips the launch fetch when the signed path will fill the rollup', async () => {
    // A parallel unsigned fetch beside the signed one is a second request
    // for the same data; the signed response fills the rollup and the
    // appKeys.
    await initInfoServer({ ...params, skipUnsignedLaunchFetch: true })
    expect(asked).toBe(0)
  })

  it('installs one poll for two racing launches', async () => {
    // The claim is taken before the first await. Two NetInfo transitions
    // racing through the launch fetch would otherwise each install a poll,
    // and against a stalled info server the two would overlap for the life
    // of the app.
    await Promise.all([initInfoServer(params), initInfoServer(params)])
    const afterLaunch = asked
    await jest.advanceTimersByTimeAsync(5 * 60 * 1000 + 100)
    // One poll tick, not two.
    expect(asked - afterLaunch).toBe(1)
  })

  it('does not fire the poll immediately after the launch fetch', async () => {
    // `start({ wait: true })`: the launch fetch has just run, so starting in
    // the running state would fire a second one at once.
    await initInfoServer(params)
    await jest.advanceTimersByTimeAsync(1000)
    expect(asked).toBe(1)
  })

  it('stops the poll and releases the claim', async () => {
    await initInfoServer(params)
    stopInfoServerPoll()
    await jest.advanceTimersByTimeAsync(10 * 60 * 1000)
    expect(asked).toBe(1)

    // Released: a later launch takes the launch arm again, rather than the
    // reconnect arm a stale claim would send it down.
    infoServerData.rollup = undefined
    await initInfoServer(params)
    expect(asked).toBe(2)
  })
})
