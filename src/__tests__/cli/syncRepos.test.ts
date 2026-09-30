import { describe, expect, it } from '@jest/globals'

import {
  readSyncWebSocketView,
  repoIdFromKeys,
  syncKeyToRepoId,
  syncWebSocketUrls,
  toSyncWebSocketUrl
} from '../../cli/engine/syncRepos'

// Bytes 0x00..0x13, hashed independently of this code:
// base58(sha256(sha256(bytes))).
const SYNC_KEY = Uint8Array.from({ length: 20 }, (_, i) => i)
const SYNC_KEY_BASE64 = 'AAECAwQFBgcICQoLDA0ODxAREhM='
const REPO_ID = 'FqYZN8AcGHoZnBFCW3cUdEmL7ugezGPkEL3DzrzrBscF'

describe('syncKeyToRepoId', () => {
  it('is base58 of the double SHA-256 of the sync key', () => {
    expect(syncKeyToRepoId(SYNC_KEY)).toBe(REPO_ID)
  })
})

describe('repoIdFromKeys', () => {
  it('reads the base64 syncKey out of raw wallet keys', () => {
    expect(
      repoIdFromKeys({
        syncKey: SYNC_KEY_BASE64,
        dataKey: 'x',
        format: 'bip84'
      })
    ).toBe(REPO_ID)
  })

  it('is null for keys with no storage repo', () => {
    expect(repoIdFromKeys({ ethereumKey: 'abc' })).toBeNull()
    expect(repoIdFromKeys({ syncKey: '' })).toBeNull()
    expect(repoIdFromKeys(undefined)).toBeNull()
  })
})

describe('toSyncWebSocketUrl', () => {
  it('swaps the scheme and adds the socket path to a bare host', () => {
    expect(toSyncWebSocketUrl('http://127.0.0.1:8010')).toBe(
      'ws://127.0.0.1:8010/api/v2/ws'
    )
    expect(toSyncWebSocketUrl('https://sync-us1.edge.app/')).toBe(
      'wss://sync-us1.edge.app/api/v2/ws'
    )
  })

  it('leaves a URL with a path as written', () => {
    expect(toSyncWebSocketUrl('ws://127.0.0.1:8010/custom')).toBe(
      'ws://127.0.0.1:8010/custom'
    )
  })
})

describe('syncWebSocketUrls', () => {
  it('derives the sockets from the sync servers, leaving out sync-eu', () => {
    expect(
      syncWebSocketUrls({
        syncServer: ['https://sync-us1.edge.app', 'https://sync-eu.edge.app']
      })
    ).toEqual(['wss://sync-us1.edge.app/api/v2/ws'])
  })

  it('prefers the syncWebSocketServer role', () => {
    expect(
      syncWebSocketUrls({
        syncServer: ['http://127.0.0.1:8010'],
        syncWebSocketServer: ['ws://127.0.0.1:9010']
      })
    ).toEqual(['ws://127.0.0.1:9010/api/v2/ws'])
  })

  it('is empty with no socket-capable server', () => {
    expect(syncWebSocketUrls({})).toEqual([])
    expect(syncWebSocketUrls({ syncServer: 'fake://sync' })).toEqual([])
  })
})

describe('readSyncWebSocketView', () => {
  const configured = { syncServer: ['http://127.0.0.1:8010'] }

  it("reports core's followed hosts and open sockets", async () => {
    const view = await readSyncWebSocketView(
      {
        syncWebSocketServers: ['ws://10.0.0.5:8010/api/v2/ws'],
        getSyncWebSocketStatus: async () => ({
          servers: ['ws://10.0.0.5:8010/api/v2/ws', 'ws://10.0.0.6:8010'],
          sockets: [
            {
              url: 'ws://10.0.0.5:8010/api/v2/ws',
              connected: true,
              connecting: false,
              repoCount: 4
            }
          ]
        })
      },
      configured
    )
    expect(view).toEqual({
      servers: ['ws://10.0.0.5:8010/api/v2/ws', 'ws://10.0.0.6:8010/api/v2/ws'],
      sockets: [
        {
          url: 'ws://10.0.0.5:8010/api/v2/ws',
          connected: true,
          connecting: false,
          repoCount: 4
        }
      ],
      source: 'core'
    })
  })

  it('uses the followed-host getter alone when that is all core has', async () => {
    expect(
      await readSyncWebSocketView(
        { syncWebSocketServers: ['ws://10.0.0.5:8010'] },
        configured
      )
    ).toEqual({
      servers: ['ws://10.0.0.5:8010/api/v2/ws'],
      sockets: [],
      source: 'core'
    })
  })

  it('derives the hosts from the configuration on an older core', async () => {
    expect(await readSyncWebSocketView({}, configured)).toEqual({
      servers: ['ws://127.0.0.1:8010/api/v2/ws'],
      sockets: [],
      source: 'derived'
    })
    expect(await readSyncWebSocketView(undefined, {})).toEqual({
      servers: [],
      sockets: [],
      source: 'derived'
    })
  })
})
