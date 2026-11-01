import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeContext } from 'edge-core-js'
import { base64 } from 'rfc4648'

import { syncPushLoginIds } from '../../actions/NotificationActions'
import { base58 } from '../../util/encoding'
import { fetchPush } from '../../util/network'

jest.mock('../../util/network', () => ({
  fetchPush: jest.fn()
}))
jest.mock('../../util/edgeApiSigner', () => ({
  resolveApiKeyAsync: async () => 'test-api-key'
}))

const mockFetchPush = jest.mocked(fetchPush)

const KEPT_LOGIN_ID = base58.stringify(new Uint8Array([1, 2, 3]))
const FORGOTTEN_LOGIN_ID = base58.stringify(new Uint8Array([4, 5, 6]))

const makeContext = (loginIds: string[]): EdgeContext => {
  const partial: Partial<EdgeContext> = {
    clientId: 'test-client-id',
    localUsers: loginIds.map(loginId => ({
      keyLoginEnabled: true,
      lastLogin: undefined,
      loginId,
      pinLoginEnabled: true,
      recovery2Key: undefined,
      username: undefined,
      voucherId: undefined
    }))
  }
  return partial as EdgeContext
}

const getRequestBody = (): {
  apiKey: string
  deviceId: string
  deviceToken: string
  data: Record<string, unknown>
} => {
  const [, opts] = mockFetchPush.mock.calls[0]
  return JSON.parse(opts?.body as string)
}

describe('syncPushLoginIds', () => {
  beforeEach(() => {
    mockFetchPush.mockReset()
    mockFetchPush.mockImplementation(
      async () =>
        await Promise.resolve({
          text: async () =>
            JSON.stringify({
              events: [],
              ignoreMarketing: false,
              ignorePriceChanges: false,
              loginIds: []
            })
        } as unknown as Response)
    )
  })

  it('replaces the device logins with the accounts still saved', async () => {
    await syncPushLoginIds(makeContext([KEPT_LOGIN_ID]))

    expect(mockFetchPush.mock.calls[0][0]).toBe('v2/device/update/')
    const { data, deviceId } = getRequestBody()
    expect(deviceId).toBe('test-client-id')
    expect(data.loginIds).toEqual([
      base64.stringify(base58.parse(KEPT_LOGIN_ID))
    ])
    expect(data.loginIds).not.toContain(
      base64.stringify(base58.parse(FORGOTTEN_LOGIN_ID))
    )
  })

  it('clears the device logins when no accounts remain', async () => {
    await syncPushLoginIds(makeContext([]))

    expect(getRequestBody().data.loginIds).toEqual([])
  })

  it('leaves events and notification preferences alone', async () => {
    await syncPushLoginIds(makeContext([KEPT_LOGIN_ID]))

    expect(Object.keys(getRequestBody().data)).toEqual(['loginIds'])
  })
})
