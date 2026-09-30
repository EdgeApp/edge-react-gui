import { describe, expect, it } from '@jest/globals'

import {
  notificationLine,
  type RepoWatchLine,
  subscribeBatches,
  subscribedLine,
  subscribeRequest,
  type SyncRepo,
  watchRepos,
  type WatchSocket
} from '../../cli/client/watchSyncRepos'

const NOW = new Date('2026-09-30T12:00:00.000Z')

const REPOS: SyncRepo[] = [
  { repoId: 'AccountRepo', walletId: 'account' },
  { repoId: 'WalletRepo', walletId: 'wallet1=' }
]
const WALLET_IDS = new Map(REPOS.map(r => [r.repoId, r.walletId]))

describe('subscribeBatches', () => {
  it('splits at 100 repos per call', () => {
    const repos = Array.from({ length: 250 }, (_, i) => i)
    expect(subscribeBatches(repos).map(b => b.length)).toEqual([100, 100, 50])
    expect(subscribeBatches([])).toEqual([])
  })
})

describe('subscribeRequest', () => {
  it('is a JSON-RPC subscribeRepos call carrying repo IDs only', () => {
    expect(JSON.parse(subscribeRequest(3, REPOS))).toEqual({
      jsonrpc: '2.0',
      id: 3,
      method: 'subscribeRepos',
      params: [['AccountRepo'], ['WalletRepo']]
    })
  })
})

describe('subscribedLine', () => {
  it('pairs each repo with its result', () => {
    expect(subscribedLine(REPOS, [1, 2])).toEqual({
      type: 'subscribed',
      repos: [
        { repoId: 'AccountRepo', walletId: 'account', result: 1 },
        { repoId: 'WalletRepo', walletId: 'wallet1=', result: 2 }
      ]
    })
  })
})

describe('notificationLine', () => {
  it('names the wallet and checkpoint of each updated repo', () => {
    expect(
      notificationLine(
        { jsonrpc: '2.0', method: 'update', params: [['WalletRepo', '4:9']] },
        WALLET_IDS,
        NOW
      )
    ).toEqual({
      type: 'update',
      at: '2026-09-30T12:00:00.000Z',
      repos: [{ repoId: 'WalletRepo', walletId: 'wallet1=', checkpoint: '4:9' }]
    })
  })

  it('reports lost subscriptions, and repos it never subscribed', () => {
    expect(
      notificationLine(
        { method: 'subLost', params: [['AccountRepo'], ['Stranger']] },
        WALLET_IDS,
        NOW
      )
    ).toEqual({
      type: 'subLost',
      at: '2026-09-30T12:00:00.000Z',
      repos: [
        { repoId: 'AccountRepo', walletId: 'account' },
        { repoId: 'Stranger', walletId: null }
      ]
    })
  })

  it('ignores anything that is not a notification', () => {
    expect(notificationLine({ id: 1, result: [1] }, WALLET_IDS, NOW)).toBe(
      undefined
    )
    expect(notificationLine({ method: 'ping' }, WALLET_IDS, NOW)).toBe(
      undefined
    )
    expect(notificationLine('junk', WALLET_IDS, NOW)).toBe(undefined)
  })
})

/** An in-memory socket the test drives from the server's side. */
function makeFakeSocket(): { socket: WatchSocket; sent: unknown[] } {
  const sent: unknown[] = []
  const socket: WatchSocket = {
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
    send(text) {
      sent.push(JSON.parse(text))
    },
    close() {
      socket.onclose?.({ code: 1000, reason: '' })
    }
  }
  return { socket, sent }
}

function serverSays(socket: WatchSocket, message: unknown): void {
  socket.onmessage?.({ data: JSON.stringify(message) })
}

describe('watchRepos', () => {
  it('subscribes, prints results and updates, and stops on the signal', async () => {
    const { socket, sent } = makeFakeSocket()
    const lines: RepoWatchLine[] = []
    const controller = new AbortController()
    const done = watchRepos({
      url: 'ws://127.0.0.1:8010/api/v2/ws',
      repos: REPOS,
      makeSocket: () => socket,
      write: line => lines.push(line),
      signal: controller.signal,
      now: () => NOW
    })

    socket.onopen?.({})
    expect(sent).toEqual([
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'subscribeRepos',
        params: [['AccountRepo'], ['WalletRepo']]
      }
    ])
    serverSays(socket, { jsonrpc: '2.0', id: 1, result: [1, 2] })
    serverSays(socket, {
      jsonrpc: '2.0',
      method: 'update',
      params: [['WalletRepo', '5:12']]
    })
    controller.abort()

    await expect(done).resolves.toEqual({ reason: 'interrupted' })
    expect(lines).toEqual([
      subscribedLine(REPOS, [1, 2]),
      {
        type: 'update',
        at: NOW.toISOString(),
        repos: [
          { repoId: 'WalletRepo', walletId: 'wallet1=', checkpoint: '5:12' }
        ]
      }
    ])
  })

  it('reports one subscribed line across several batches', async () => {
    const { socket, sent } = makeFakeSocket()
    const repos = Array.from({ length: 150 }, (_, i) => ({
      repoId: `R${i}`,
      walletId: `w${i}`
    }))
    const lines: RepoWatchLine[] = []
    const controller = new AbortController()
    const done = watchRepos({
      url: 'ws://x',
      repos,
      makeSocket: () => socket,
      write: line => lines.push(line),
      signal: controller.signal
    })
    socket.onopen?.({})
    expect(sent).toHaveLength(2)
    // Answers may arrive out of order; results still line up by batch.
    serverSays(socket, { id: 2, result: Array(50).fill(2) })
    expect(lines).toHaveLength(0)
    serverSays(socket, { id: 1, result: Array(100).fill(1) })
    controller.abort()
    await done

    expect(lines).toHaveLength(1)
    const line = lines[0]
    if (line.type !== 'subscribed') throw new Error('expected subscribed')
    expect(line.repos[99]).toEqual({
      repoId: 'R99',
      walletId: 'w99',
      result: 1
    })
    expect(line.repos[100]).toEqual({
      repoId: 'R100',
      walletId: 'w100',
      result: 2
    })
  })

  it('ends with a closed line when the server hangs up', async () => {
    const { socket } = makeFakeSocket()
    const lines: RepoWatchLine[] = []
    const done = watchRepos({
      url: 'ws://x',
      repos: REPOS,
      makeSocket: () => socket,
      write: line => lines.push(line),
      now: () => NOW
    })
    socket.onopen?.({})
    socket.onclose?.({ code: 1012, reason: 'Service restart' })

    await expect(done).resolves.toEqual({
      reason: 'closed',
      code: 1012,
      closeReason: 'Service restart'
    })
    expect(lines).toEqual([
      {
        type: 'closed',
        at: NOW.toISOString(),
        code: 1012,
        reason: 'Service restart'
      }
    ])
  })

  it('fails when the socket never opens, or the subscribe errors', async () => {
    const a = makeFakeSocket()
    const refused = watchRepos({
      url: 'ws://nowhere',
      repos: REPOS,
      makeSocket: () => a.socket,
      write: () => {}
    })
    a.socket.onerror?.({})
    await expect(refused).rejects.toThrow('Cannot open a WebSocket')

    const b = makeFakeSocket()
    const rejected = watchRepos({
      url: 'ws://x',
      repos: REPOS,
      makeSocket: () => b.socket,
      write: () => {}
    })
    b.socket.onopen?.({})
    serverSays(b.socket, { id: 1, error: { code: -32602, message: 'bad' } })
    await expect(rejected).rejects.toThrow('subscribeRepos failed: bad')
  })
})
