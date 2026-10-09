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

  it('names the connection when the engine dies before answering', async () => {
    // The commonest way an engine dies — `SIGKILL`, the OOM killer, a
    // container stop — reaches the *request* as a bare `ECONNRESET`, before
    // any headers exist for `res.on('aborted')` to fire on. Unclassified it
    // fell through `printError`'s generic arm as
    // `{"code":"INTERNAL_ERROR","status":500}` and exit 1, telling the
    // caller the engine answered 500 when it had answered nothing, and
    // under a code the catalogue declares `origin: 'engine'`.
    const socketPath = tempSocket()
    await rawServer(socketPath, socket => {
      // Gone before any headers exist. Node reports this to the request as
      // `EPIPE` when it dies during the write and `ECONNRESET` when it dies
      // after it; both are the same event to a caller.
      socket.destroy()
    })

    const client = new ApiClient({ socketPath, timeoutMs: 5000 })
    const error = await client.get('/engine/status').then(
      () => undefined,
      (error: unknown) => error as { code?: string; message?: string }
    )
    expect(error?.code).toBe('CONNECTION_CLOSED')
    expect(error?.message).toMatch(/closed the connection before answering/)
    expect(error?.message).toMatch(/may or may not have taken effect/)
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

/**
 * The locale warning runs once, after the first *request* — and not after a
 * stream.
 *
 * `openStream` resolves when the stream ends, and the ordinary reason it ends
 * is that the engine went away: `engine-stop`, or the idle shutdown. Running
 * the hook there sent `/engine/status` at a socket with nothing listening,
 * and the client's own `onConnectFail` then spawned a replacement daemon
 * purely to read a locale back. The warning is also useless to `subscribe`,
 * which could only hear it after its stream was over.
 */
describe('ApiClient first-response hook', () => {
  /** One SSE frame, then the engine ends the stream. */
  async function eventServer(socketPath: string): Promise<void> {
    await rawServer(socketPath, socket => {
      socket.write(
        'HTTP/1.1 200 OK\r\nContent-Type: text/event-stream\r\n\r\n' +
          'event: engine.ready\ndata: {}\n\n'
      )
      socket.end()
    })
  }

  it('does not run after a stream ends', async () => {
    const socketPath = tempSocket()
    await eventServer(socketPath)
    let hooks = 0
    const client = new ApiClient({
      socketPath,
      timeoutMs: 5000,
      onFirstResponse: async () => {
        hooks += 1
      }
    })

    const seen: string[] = []
    await client.stream('/engine/events', type => {
      seen.push(type)
    })
    expect(seen).toStrictEqual(['engine.ready'])
    expect(hooks).toBe(0)
  })

  it('still runs after an ordinary request', async () => {
    const socketPath = tempSocket()
    const server = http.createServer((req, res) => {
      accepted.push(req.socket)
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true }))
    })
    servers.push(server)
    await new Promise<void>(resolve => server.listen(socketPath, resolve))

    let hooks = 0
    const client = new ApiClient({
      socketPath,
      timeoutMs: 5000,
      onFirstResponse: async () => {
        hooks += 1
      }
    })
    await client.get('/engine/status')
    await client.get('/engine/status')
    // Once, however many requests follow it.
    expect(hooks).toBe(1)
  })
})

/**
 * The 503 arm, which no suite reached.
 *
 * `shutdown()` sets `shuttingDown` as its second statement and keeps the
 * socket bound through the drain, the logouts and `context.close()`, so for
 * that whole window the engine answers `503 ENGINE_SHUTTING_DOWN`. The
 * client has to wait it out rather than spawn a replacement that cannot
 * claim the profile — and has to stop waiting the moment the socket goes or
 * a new engine answers. The offline suites drive the cold-start arm on every
 * invocation and never this one, because nothing there races a stop against
 * a command.
 */
describe('ApiClient against an engine that is shutting down', () => {
  const shuttingDown = JSON.stringify({
    error: {
      code: 'ENGINE_SHUTTING_DOWN',
      message: 'The engine is shutting down',
      status: 503
    }
  })

  it('waits for the socket, then spawns once', async () => {
    const socketPath = tempSocket()
    let answers = 0
    const server = http.createServer((req, res) => {
      accepted.push(req.socket)
      res.setHeader('Content-Type', 'application/json')
      // One 503, then the engine is "gone" as far as this client is
      // concerned: a fresh one answering on the same socket.
      if (answers++ === 0) {
        res.statusCode = 503
        res.end(shuttingDown)
        return
      }
      res.end(JSON.stringify({ ok: true }))
    })
    servers.push(server)
    await new Promise<void>(resolve => server.listen(socketPath, resolve))

    let spawns = 0
    const client = new ApiClient({
      socketPath,
      timeoutMs: 5000,
      onConnectFail: async () => {
        spawns += 1
      }
    })
    const started = Date.now()
    expect(await client.get('/engine/status')).toStrictEqual({ ok: true })
    // Inside a second: the plain answer is the loop's exit. Without it the
    // client polled the whole `SHUTDOWN_WAIT_MS` — 150 s, about 1,500
    // requests — against an engine that was ready immediately.
    expect(Date.now() - started).toBeLessThan(5000)
    expect(spawns).toBe(1)
  })

  it('takes the socket going away as the end of the wait', async () => {
    const socketPath = tempSocket()
    const server = http.createServer((req, res) => {
      accepted.push(req.socket)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 503
      res.end(shuttingDown)
      // The engine finishes its teardown: it stops listening, drops the
      // connection and unlinks the socket, which is the ENOENT exit the
      // wait is really looking for.
      setTimeout(() => {
        req.socket.destroy()
        server.close()
        fs.rmSync(socketPath, { force: true })
      }, 10)
    })
    servers.push(server)
    await new Promise<void>(resolve => server.listen(socketPath, resolve))

    let spawns = 0
    const client = new ApiClient({
      socketPath,
      timeoutMs: 5000,
      onConnectFail: async () => {
        spawns += 1
      }
    })
    const started = Date.now()
    // The spawn is a no-op here, so the retry finds nothing listening.
    await expect(client.get('/engine/status')).rejects.toThrow()
    expect(Date.now() - started).toBeLessThan(5000)
    expect(spawns).toBe(1)
  })

  it('reports a wedged engine rather than spawning a doomed replacement', async () => {
    const socketPath = tempSocket()
    // 503 for ever: the drain never finishes. `SHUTDOWN_WAIT_MS`'s own
    // docblock says the client "reports what it finds instead of spawning a
    // replacement that could not claim the profile" — and `withEngine`
    // ignored the wait's outcome, so it spawned exactly that: `claimRunFile`
    // fails `wx` against the live run file, the user is told to run the
    // `engine-stop` they just ran, and the child truncates the live
    // engine's `engine-startup.log`.
    const server = http.createServer((req, res) => {
      accepted.push(req.socket)
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 503
      res.end(shuttingDown)
    })
    servers.push(server)
    await new Promise<void>(resolve => server.listen(socketPath, resolve))

    let spawns = 0
    const client = new ApiClient({
      socketPath,
      timeoutMs: 5000,
      shutdownWaitMs: 500,
      onConnectFail: async () => {
        spawns += 1
      }
    })
    await expect(client.get('/engine/status')).rejects.toThrow(
      /still shutting down/
    )
    expect(spawns).toBe(0)
  })
})
