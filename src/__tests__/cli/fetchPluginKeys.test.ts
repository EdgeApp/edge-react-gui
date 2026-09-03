import { describe, expect, it } from '@jest/globals'

import { fetchPluginKeys, getKeysAppId } from '../../cli/engine/fetchPluginKeys'

describe('getKeysAppId', () => {
  it('uses edge when the CLI appId is empty, matching the GUI infoRollup slug', () => {
    expect(getKeysAppId('')).toBe('edge')
  })

  it('keeps an explicit CLI appId', () => {
    expect(getKeysAppId('co.edgesecure.app')).toBe('co.edgesecure.app')
  })
})

describe('fetchPluginKeys', () => {
  it('throws when neither a native signer nor apiKey/apiSecret is provided', async () => {
    await expect(
      fetchPluginKeys({ appId: '', testMode: true })
    ).rejects.toThrow('No HMAC credentials available for infoRollup appKeys')
  })
})
