import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeFetchFunction } from 'edge-core-js'

import { signHmacAuthorization } from '../../util/hmacAuth'
import { fetchRemoteKeys } from '../../util/keysServer'

const apiKey = 'test-api-key'
const secret = new Uint8Array(
  Buffer.from('0123456789abcdef0123456789abcdef', 'hex')
)

const makeOkResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

describe('fetchRemoteKeys', () => {
  it('requests v1/getKeys with a URL-encoded appId', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ keys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'co.edgesecure.app',
      infoFetch
    })

    expect(infoFetch).toHaveBeenCalled()
    const url = String(infoFetch.mock.calls[0][0])
    const parsed = new URL(url)
    expect(parsed.pathname).toBe('/v1/getKeys')
    expect(parsed.searchParams.get('appId')).toBe('co.edgesecure.app')
    // Path segment before the query must match what fetchInfo concatenates.
    expect(url).toContain('/v1/getKeys?appId=co.edgesecure.app')
  })

  it('URL-encodes special characters in appId', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ keys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'app id/with?weird=chars',
      infoFetch
    })

    const url = String(infoFetch.mock.calls[0][0])
    expect(url).toContain(
      `/v1/getKeys?appId=${encodeURIComponent('app id/with?weird=chars')}`
    )
  })

  it('signs Authorization with a leading slash on the path', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ keys: {} })
    )
    const appId = 'edge'

    await fetchRemoteKeys({ apiKey, secret, appId, infoFetch })

    const opts = infoFetch.mock.calls[0][1] as RequestInit
    const headers = opts.headers as Record<string, string>
    const timestamp = headers['X-Timestamp']
    const signPath = `/v1/getKeys?appId=${encodeURIComponent(appId)}`
    expect(headers.Authorization).toBe(
      signHmacAuthorization('GET', signPath, '', timestamp, apiKey, secret)
    )
  })

  it('omits x-attestation-token when the token is missing or empty', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ keys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch
    })
    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch,
      attestationToken: ''
    })

    for (const call of infoFetch.mock.calls) {
      const headers = (call[1] as RequestInit).headers as Record<string, string>
      expect(headers['x-attestation-token']).toBeUndefined()
    }
  })

  it('includes x-attestation-token when the token is non-empty', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ keys: {} })
    )

    await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch,
      attestationToken: 'attested-token'
    })

    const headers = (infoFetch.mock.calls[0][1] as RequestInit)
      .headers as Record<string, string>
    expect(headers['x-attestation-token']).toBe('attested-token')
  })

  it('passes through keys and assuranceLevel', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({
        keys: { AZTECO_API_KEY: 'k' },
        assuranceLevel: 'hardware'
      })
    )

    const result = await fetchRemoteKeys({
      apiKey,
      secret,
      appId: 'edge',
      infoFetch
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
      fetchRemoteKeys({ apiKey, secret, appId: 'edge', infoFetch })
    ).rejects.toThrow('fetchRemoteKeys 503: unavailable')
  })

  it('rejects a malformed body where keys is a string', async () => {
    const infoFetch = jest.fn<EdgeFetchFunction>(async () =>
      makeOkResponse({ keys: 'not-an-object' })
    )

    await expect(
      fetchRemoteKeys({ apiKey, secret, appId: 'edge', infoFetch })
    ).rejects.toThrow('not an object')
  })
})
