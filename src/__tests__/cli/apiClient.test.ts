import { afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals'
import fs from 'fs'
import http from 'http'
import net from 'net'
import os from 'os'
import path from 'path'

import { ApiClient } from '../../cli/client/apiClient'

// Real timers: these drive a real socket.
beforeAll(() => {
  jest.useRealTimers()
})

const servers: Array<net.Server | http.Server> = []
const sockets: string[] = []
/**
 * Every connection these servers accepted.
 *
 * `close()` stops a server listening but does nothing about a connection it
 * has already accepted, and one case below deliberately accepts and then says
 * nothing — so the listener stayed open, jest reported two `PIPEWRAP` handles
 * and force-exited a worker, and a live socket in a shared worker is how an
 * unrelated suite starts failing intermittently.
 */
const accepted: net.Socket[] = []

afterEach(async () => {
  for (const socket of accepted.splice(0)) socket.destroy()
  // Awaited: `close` is asynchronous, so returning before its callback left
  // the handle open for whatever ran next.
  await Promise.all(
    servers.splice(0).map(async server => {
      await new Promise<void>(resolve => {
        server.close(() => {
          resolve()
        })
      })
    })
  )
  for (const socketPath of sockets.splice(0)) {
    // The whole `mkdtemp` directory, not just the socket file inside it:
    // unlinking one file left the directory behind, and 132 of them had
    // accumulated in $TMPDIR on this machine.
    fs.rmSync(path.dirname(socketPath), { recursive: true, force: true })
  }
})

/** A unix socket path this test owns. */
function tempSocket(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-api-'))
  const socketPath = path.join(dir, 'engine.sock')
  sockets.push(socketPath)
  return socketPath
}

/** Listen on `socketPath` and hand each connection to `onConnection`. */
async function rawServer(
  socketPath: string,
  onConnection: (socket: net.Socket) => void
): Promise<void> {
  const server = net.createServer(socket => {
    accepted.push(socket)
    onConnection(socket)
  })
  servers.push(server)
  await new Promise<void>(resolve => server.listen(socketPath, resolve))
}

describe('ApiClient.sendRequest', () => {
  it('rejects when the engine dies mid-response', async () => {
    const socketPath = tempSocket()
    // Headers, then a truncated body, then the connection drops. Node routes
    // this to the *response*, not the request, so without `res.on('error')`
    // and `res.on('aborted')` the promise never settled: the CLI printed
    // nothing and exited 0, and `edge-cli spend … && echo sent` printed
    // `sent`.
    await rawServer(socketPath, socket => {
      socket.write(
        'HTTP/1.1 200 OK\r\n' +
          'Content-Type: application/json\r\n' +
          'Content-Length: 120\r\n' +
          '\r\n' +
          '{"apiVersion":"1.0.0","pid":1234,'
      )
      setTimeout(() => socket.destroy(), 20)
    })

    const client = new ApiClient({ socketPath, timeoutMs: 5000 })
    await expect(client.get('/engine/status')).rejects.toThrow(
      /closed the connection while answering/
    )
  })

  it('rejects, rather than hanging, when the response ends with no body', async () => {
    const socketPath = tempSocket()
    await rawServer(socketPath, socket => {
      socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
      socket.end()
    })
    const client = new ApiClient({ socketPath, timeoutMs: 5000 })
    await expect(client.get('/engine/status')).rejects.toThrow(/HTTP 500/)
  })

  it('reports the route and the deadline when a request times out', async () => {
    const socketPath = tempSocket()
    // Accept and say nothing at all.
    await rawServer(socketPath, () => {})
    const client = new ApiClient({ socketPath, timeoutMs: 150 })
    await expect(client.get('/engine/status')).rejects.toThrow(
      /timed out after 0\.15s: GET \/engine\/status/
    )
  })

  it('cleans the error envelope rather than casting it', async () => {
    const socketPath = tempSocket()
    const server = http.createServer((req, res) => {
      accepted.push(req.socket)
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'No wallet matches that id',
            status: 404
          }
        })
      )
    })
    servers.push(server)
    await new Promise<void>(resolve => server.listen(socketPath, resolve))

    const client = new ApiClient({ socketPath, timeoutMs: 5000 })
    await expect(client.get('/engine/status')).rejects.toMatchObject({
      code: 'WALLET_NOT_FOUND',
      status: 404
    })
  })
})
