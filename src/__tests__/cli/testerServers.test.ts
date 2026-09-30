import { describe, expect, it } from '@jest/globals'

import {
  isLocalUrl,
  isTesterConfig,
  resolveServers,
  resolveTestServers,
  TESTER_SERVERS
} from '../../cli/engine/testerServers'

const LOCAL = JSON.stringify({
  loginServer: 'http://127.0.0.1:8001',
  infoServer: 'http://127.0.0.1:8008',
  syncServer: ['http://127.0.0.1:8010']
})

describe('isLocalUrl', () => {
  it('accepts loopback, private-network and mDNS hosts', () => {
    for (const url of [
      'http://127.0.0.1:8001',
      'http://localhost:8008',
      'http://[::1]:8010',
      'http://10.10.7.181:8001',
      'http://172.20.1.2',
      'http://192.168.1.5:8010',
      'http://169.254.3.4',
      'http://kefir.local:8001'
    ]) {
      expect(isLocalUrl(url)).toBe(true)
    }
  })

  it('rejects public hosts and junk', () => {
    for (const url of [
      'https://login.edge.app',
      'https://login-tester.edge.app',
      'http://8.8.8.8',
      'http://172.32.0.1',
      'http://127.0.0.1.example.com',
      'not a url'
    ]) {
      expect(isLocalUrl(url)).toBe(false)
    }
  })
})

describe('isTesterConfig', () => {
  it('accepts the tester fleet and local hosts, never production', () => {
    expect(isTesterConfig(TESTER_SERVERS)).toBe(true)
    expect(
      isTesterConfig(resolveTestServers({ EDGE_CLI_SERVERS: LOCAL }))
    ).toBe(true)
    expect(isTesterConfig({ loginServer: 'https://login.edge.app' })).toBe(
      false
    )
    expect(isTesterConfig({})).toBe(false)
  })
})

describe('resolveTestServers', () => {
  it('is the tester fleet when no override is set', () => {
    expect(resolveTestServers({})).toEqual({
      loginServer: TESTER_SERVERS.loginServer,
      infoServer: TESTER_SERVERS.infoServer,
      changeServer: TESTER_SERVERS.changeServer,
      syncServer: [...TESTER_SERVERS.syncServer]
    })
  })

  it('replaces only the roles the override names', () => {
    expect(resolveTestServers({ EDGE_CLI_SERVERS: LOCAL })).toEqual({
      loginServer: 'http://127.0.0.1:8001',
      infoServer: 'http://127.0.0.1:8008',
      changeServer: TESTER_SERVERS.changeServer,
      syncServer: ['http://127.0.0.1:8010']
    })
  })

  it('accepts a single sync server string', () => {
    expect(
      resolveTestServers({
        EDGE_CLI_SERVERS: '{"syncServer":"http://localhost:8010"}'
      }).syncServer
    ).toEqual(['http://localhost:8010'])
  })

  it('accepts local sync WebSocket servers', () => {
    expect(
      resolveTestServers({
        EDGE_CLI_SERVERS:
          '{"syncWebSocketServer":"ws://127.0.0.1:8010/api/v2/ws"}'
      })
    ).toEqual({
      ...resolveTestServers({}),
      syncWebSocketServer: ['ws://127.0.0.1:8010/api/v2/ws']
    })
    expect(
      resolveTestServers({
        EDGE_CLI_SERVERS: '{"syncWebSocketServer":["wss://localhost:8443"]}'
      }).syncWebSocketServer
    ).toEqual(['wss://localhost:8443'])
  })

  it('leaves syncWebSocketServer out unless it is named', () => {
    expect(
      resolveTestServers({ EDGE_CLI_SERVERS: LOCAL }).syncWebSocketServer
    ).toBeUndefined()
  })

  it('rejects remote or non-socket sync WebSocket servers', () => {
    expect(() =>
      resolveTestServers({
        EDGE_CLI_SERVERS: '{"syncWebSocketServer":"wss://sync-us1.edge.app"}'
      })
    ).toThrow('may only name local or private-network hosts')
    expect(() =>
      resolveTestServers({
        EDGE_CLI_SERVERS: '{"syncWebSocketServer":"http://127.0.0.1:8010"}'
      })
    ).toThrow('takes ws:// or wss:// URLs')
    expect(() =>
      resolveTestServers({ EDGE_CLI_SERVERS: '{"syncWebSocketServer":[]}' })
    ).toThrow('syncWebSocketServer must be a URL or a non-empty list')
  })

  it('rejects public hosts, unknown roles and malformed values', () => {
    expect(() =>
      resolveTestServers({
        EDGE_CLI_SERVERS: '{"loginServer":"https://login.edge.app"}'
      })
    ).toThrow('may only name local or private-network hosts')
    expect(() =>
      resolveTestServers({
        EDGE_CLI_SERVERS: '{"syncServer":["https://sync-us1.edge.app"]}'
      })
    ).toThrow('may only name local or private-network hosts')
    expect(() =>
      resolveTestServers({ EDGE_CLI_SERVERS: '{"authServer":"http://x"}' })
    ).toThrow('unknown role "authServer"')
    expect(() =>
      resolveTestServers({ EDGE_CLI_SERVERS: '{"syncServer":[]}' })
    ).toThrow('non-empty list')
    expect(() =>
      resolveTestServers({ EDGE_CLI_SERVERS: '{"loginServer":1}' })
    ).toThrow('must be a URL string')
    expect(() => resolveTestServers({ EDGE_CLI_SERVERS: '[]' })).toThrow(
      'must be a JSON object'
    )
    expect(() => resolveTestServers({ EDGE_CLI_SERVERS: '{' })).toThrow(
      'not valid JSON'
    )
  })
})

describe('resolveServers', () => {
  it('uses core defaults outside test mode', () => {
    expect(resolveServers(false, {})).toBeUndefined()
  })

  it('refuses an override without test mode', () => {
    expect(() => resolveServers(false, { EDGE_CLI_SERVERS: LOCAL })).toThrow(
      'only applies with -t'
    )
  })

  it('applies the override in test mode', () => {
    expect(resolveServers(true, { EDGE_CLI_SERVERS: LOCAL })?.loginServer).toBe(
      'http://127.0.0.1:8001'
    )
  })
})
