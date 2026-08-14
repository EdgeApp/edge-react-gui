import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeFetchFunction } from 'edge-core-js'

import { signHmacAuthorization } from '../../util/hmacAuth'
import { fetchRemoteKeys } from '../../util/keysServer'

const apiKey = 'test-api-key'
const secret = new Uint8Array(
  Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
)

const query = {
  os: 'ios',
  osVersion: '18.0.0',
  appVersion: '4.51.0'
}

const rollupPath = (appId: string): string =>
  `/v1/infoRollup/${encodeURIComponent(appId)}?os=${query.os}&osVersion=${
    query.osVersion
  }&appVersion=${query.appVersion}`

const makeOkResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

describe('fetchRemoteKeys', () => {
  it('requests v1/infoRollup with a URL-encoded appId', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ appKeys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'co.edgesecure.app',
      infoFetch,
      ...query
    })

    expect(infoFetch).toHaveBeenCalled()
    const url = String(infoFetch.mock.calls[0][0])
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/v1/infoRollup/co.edgesecure.app')
    expect(parsed.searchParams.get('os')).toBe('ios')
    expect(url).toContain(rollupPath('co.edgesecure.app').slice(1))
  })

  it('URL-encodes special characters in appId', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ appKeys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'app id/with?weird=chars',
      infoFetch,
      ...query
    })

    const url = String(infoFetch.mock.calls[0][0])
    expect(url).toContain(
      `/v1/infoRollup/${encodeURIComponent('app id/with?weird=chars')}?`
    )
  })

  it('signs Authorization with a leading slash on the path', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ appKeys: {} })
    )
    const appId = 'edge'

    await fetchRemoteKeys({ apiKey, secret, appId, infoFetch, ...query })

    const opts = infoFetch.mock.calls[0][1] as RequestInit
    const headers = opts.headers as Record<string, string>
    const timestamp = headers['X-Timestamp']
    const signPath = rollupPath(appId)
    expect(headers.Authorization).toBe(
      signHmacAuthorization('GET', signPath, '', timestamp, apiKey, secret)
    )
  })

  it('omits x-attestation-token when the token is missing or empty', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ appKeys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch,
      ...query
    })
    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch,
      attestationToken: '',
      ...query
    })

    for (const call of infoFetch.mock.calls) {
      const headers = (call[1] as RequestInit).headers as Record<string, string>
      expect(headers['x-attestation-token']).toBeUndefined()
    }
  })

  it('includes x-attestation-token when the token is non-empty', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ appKeys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch,
      attestationToken: 'attested-token',
      ...query
    })

    const headers = (infoFetch.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>
    expect(headers['x-attestation-token']).toBe('attested-token')
  })

  it('passes through appKeys and assuranceLevel', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({
        appKeys: { AZTECO_API_KEY: 'k' },
        assuranceLevel: 'hardware'
      })
    )

    const result = await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch,
      ...query
    })

    expect(result.keys).toEqual({ AZTECO_API_KEY: 'k' })
    expect(result.assuranceLevel).toBe('hardware')
  })

  it('throws with the status on a non-OK response', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(
      async () =>
        ({
          ok: false,
          status: 503,
          json: async () => ({}),
          text: async () => 'unavailable'
        } as unknown as Response)
    )

    await expect(
      fetchRemoteKeys({ apiKey, secret, appId: 'edge', infoFetch, ...query })
    ).rejects.toThrow('fetchRemoteKeys 503: unavailable')
  })

  it('rejects a malformed body where appKeys is a string', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ appKeys: 'not-an-object' })
    )

    await expect(
      fetchRemoteKeys({ apiKey, secret, appId: 'edge', infoFetch, ...query })
    ).rejects.toThrow('not an object')
  })
})
