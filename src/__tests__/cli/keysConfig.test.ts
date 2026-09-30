import { afterEach, describe, expect, it } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import { join } from 'path'

import {
  keysFileOverride,
  keysSearchPaths,
  loadKeys,
  mergePluginApiKeys
} from '../../cli/engine/keysConfig'

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

describe('EDGE_CLI_KEYS_FILE', () => {
  const saved = process.env.EDGE_CLI_KEYS_FILE
  afterEach(() => {
    if (saved == null) delete process.env.EDGE_CLI_KEYS_FILE
    else process.env.EDGE_CLI_KEYS_FILE = saved
  })

  it('is searched first and supplies the API key pair', () => {
    const dir = fs.mkdtempSync(join(os.tmpdir(), 'edge-cli-keys-'))
    const path = join(dir, 'keys.json')
    fs.writeFileSync(
      path,
      JSON.stringify({ edgeApiKey: 'localKey', edgeApiSecret: '00ff' })
    )
    process.env.EDGE_CLI_KEYS_FILE = path
    expect(keysFileOverride()).toBe(path)
    expect(keysSearchPaths()[0]).toBe(path)
    const keys = loadKeys()
    expect(keys.edgeApiKey).toBe('localKey')
    expect(keys.edgeApiSecret).toBe('00ff')
  })

  it('throws when the named file is missing', () => {
    process.env.EDGE_CLI_KEYS_FILE = join(os.tmpdir(), 'no-such-edge-keys.json')
    expect(() => loadKeys()).toThrow('EDGE_CLI_KEYS_FILE does not exist')
  })

  it('is absent by default', () => {
    delete process.env.EDGE_CLI_KEYS_FILE
    expect(keysFileOverride()).toBeUndefined()
  })
})
