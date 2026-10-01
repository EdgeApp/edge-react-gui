import { describe, expect, it } from '@jest/globals'

import { mergePluginApiKeys } from '../../cli/engine/keysConfig'

describe('mergePluginApiKeys', () => {
  it('lets the preferred object win field-by-field', () => {
    expect(
      mergePluginApiKeys(
        { monero: { edgeApiKey: 'remote' } },
        { monero: { edgeApiKey: 'local', apiKey: 'keep' }, bitcoin: true }
      )
    ).toEqual({
      bitcoin: true,
      monero: { apiKey: 'keep', edgeApiKey: 'remote' }
    })
  })
})
