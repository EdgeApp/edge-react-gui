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
