import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals'
import http from 'http'
import type { AddressInfo } from 'net'

import { abortingFetch } from '../../util/network'

/**
 * The rates body read has to be bounded, not merely waited on.
 *
 * `withDeadline` around the await settles the *caller*; it cannot cancel the
 * request. Under Node a response resolves as soon as the headers arrive, so
 * a server that answers 200 and then stalls mid-body leaves the socket and
 * the body stream open behind a caller that has already given up — until
 * undici's 300-second `bodyTimeout`, on a daemon that may be started with
 * `--idle-timeout=0`. The CLI meets this on every `get-transactions` that
 * prices a date, through `fillTxsFiat` and `resolveListSpamThreshold`,
 * neither of which supplies a `doFetch`.
 */
describe('abortingFetch', () => {
  let server: http.Server
  let url = ''

  beforeAll(async () => {
    // Real timers: the abort is a real `setTimeout` against a real socket.
    jest.useRealTimers()
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      // Headers and a first chunk, then nothing, ever.
      res.write('{"data":')
    })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    url = `http://127.0.0.1:${port}/`
  })

  afterAll(async () => {
    await new Promise<void>(resolve => {
      server.closeAllConnections()
      server.close(() => {
        resolve()
      })
    })
  })

  it('aborts a body that never arrives', async () => {
    const started = Date.now()
    const response = await abortingFetch(300)(url)
    // The headers are through, which is exactly the trap.
    expect(response.status).toBe(200)
    await expect(response.text()).rejects.toThrow()
    expect(Date.now() - started).toBeLessThan(5000)
  })

  it('leaves a response that completes alone', async () => {
    const quick = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end('{"ok":true}')
    })
    await new Promise<void>(resolve => quick.listen(0, '127.0.0.1', resolve))
    const { port } = quick.address() as AddressInfo
    try {
      const response = await abortingFetch(5000)(`http://127.0.0.1:${port}/`)
      expect(await response.text()).toBe('{"ok":true}')
    } finally {
      await new Promise<void>(resolve => {
        quick.close(() => {
          resolve()
        })
      })
    }
  })
})
