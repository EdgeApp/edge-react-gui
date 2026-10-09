import { afterEach, describe, expect, it, jest } from '@jest/globals'
import fs from 'fs'
import http from 'http'
import type { AddressInfo } from 'net'
import path from 'path'

import {
  httpsRequest,
  parseAltchaChallenge,
  solveAltcha
} from '../../cli/client/solveCaptcha'

// Real timers: these cases drive a real socket, and the 30s request
// timeout is a real one. `jestSetup` fakes timers globally.
jest.useRealTimers()

/** A page shaped like login-tester's, carrying `challenge`. */
function page(challenge: string): string {
  return `<html><script>var opts = { challenge: ${challenge}, other: 1 }</script></html>`
}

describe('parseAltchaChallenge', () => {
  it('reads the challenge out of the page', () => {
    const ch = parseAltchaChallenge(
      page('{"challenge":"deadbeef","maxnumber":100,"salt":"abc"}')
    )
    expect(ch).toStrictEqual({
      challenge: 'deadbeef',
      maxnumber: 100,
      salt: 'abc'
    })
  })

  it('says so when the markup has moved', () => {
    expect(() =>
      parseAltchaChallenge('<html>no challenge here</html>')
    ).toThrow(/Could not find challenge/)
  })

  it('names the shape rather than throwing a SyntaxError', () => {
    // With `JSON.parse` outside the cleaner this threw a bare SyntaxError,
    // past the guard and the message written for exactly this case.
    expect(() => parseAltchaChallenge(page('{challenge: deadbeef}'))).toThrow(
      /not in the expected shape/
    )
  })

  it('refuses a challenge missing a field', () => {
    expect(() =>
      parseAltchaChallenge(page('{"challenge":"deadbeef","salt":"abc"}'))
    ).toThrow(/not in the expected shape/)
  })

  it('refuses a maxnumber above the cap', () => {
    // `maxnumber` bounds a synchronous hash loop, so an unbounded value
    // blocks the process with no timeout — the two HTTPS calls are the only
    // thing `REQUEST_TIMEOUT_MS` covers.
    expect(() =>
      parseAltchaChallenge(
        page('{"challenge":"x","maxnumber":999999999,"salt":"abc"}')
      )
    ).toThrow(/above the 10000000 limit/)
  })
})

describe('solveAltcha', () => {
  it('finds the number whose hash matches', async () => {
    // sha256('abc7'), computed in advance.
    const challenge =
      '53dd02b72c4e7463b448e5374abedc168dcd200ad7e1221fe92d440c545859c6'
    expect(await solveAltcha({ challenge, maxnumber: 100, salt: 'abc' })).toBe(
      7
    )
  })

  it('returns null when no number in range matches', async () => {
    expect(
      await solveAltcha({ challenge: 'nope', maxnumber: 50, salt: 'abc' })
    ).toBeNull()
  })

  it('stops at maxnumber rather than searching past it', async () => {
    // The answer is 7, which is outside this range.
    const challenge =
      '53dd02b72c4e7463b448e5374abedc168dcd200ad7e1221fe92d440c545859c6'
    expect(
      await solveAltcha({ challenge, maxnumber: 5, salt: 'abc' })
    ).toBeNull()
  })
})

/**
 * A structural guard, because this bug arrived twice.
 *
 * `apiClient.request` was fixed in iteration 2 and the same gap was left in
 * `solveCaptcha`'s two helpers and in `openStream`'s 4xx branch: once headers
 * have arrived Node routes a socket close to the *response* and clears the
 * request timer, so a request/response pair with no `error` and `aborted`
 * handler never settles and the command hangs for ever. These are not
 * exported, and testing them for real would need a TLS server, so the
 * invariant is checked at the source: every response consumer handles
 * `error`, and every one that resolves with a value also handles `aborted`.
 */
describe('https response handlers', () => {
  const read = (name: string): string =>
    fs.readFileSync(
      path.join(__dirname, '..', '..', 'cli', 'client', name),
      'utf8'
    )
  const count = (text: string, needle: string): number =>
    text.split(needle).length - 1

  it('handles error on every response it consumes', () => {
    for (const name of ['solveCaptcha.ts', 'apiClient.ts']) {
      const text = read(name)
      expect(count(text, "res.on('error'")).toBe(count(text, "res.on('end'"))
    }
  })

  it('handles aborted on every request/response pair', () => {
    // One rule for both files and every consumer: a response that is
    // destroyed mid-answer does emit `'error'` after `'aborted'`, so the
    // promise settles either way — but with the bare word `aborted` instead
    // of a message naming the call. `openStream`'s success branch was the
    // exception, for the case `subscribe` meets most: an engine killed, a
    // container stopped, a laptop slept.
    for (const name of ['solveCaptcha.ts', 'apiClient.ts']) {
      const text = read(name)
      expect(count(text, "res.on('aborted'")).toBe(count(text, "res.on('end'"))
    }
  })
})

/**
 * The two response handlers, run rather than grepped.
 *
 * The case above counts occurrences of `res.on('error'`, `res.on('aborted'`
 * and `res.on('end'` in two files' source, and says in its own comment that
 * testing them for real would need a TLS server. The sibling this code is
 * modelled on is tested for real — `apiClient.test.ts` runs a server and
 * asserts "rejects when the engine dies mid-response" — and the same branch
 * injects `doFetch` into `fetchWaterfall` and `cleanMultiFetch` for exactly
 * this reason. `httpsRequest` now takes a request function, so a plain HTTP
 * server is enough and the string counts become a backstop rather than the
 * only check.
 */
describe('httpsRequest against a server that misbehaves', () => {
  const servers: http.Server[] = []

  afterEach(async () => {
    for (const server of servers.splice(0)) {
      await new Promise<void>(resolve =>
        server.close(() => {
          resolve()
        })
      )
    }
  })

  /** A plain HTTP server, and a `request` that reaches it. */
  async function serve(
    onRequest: (req: http.IncomingMessage, res: http.ServerResponse) => void
  ): Promise<{ url: string; request: any }> {
    const server = http.createServer(onRequest)
    servers.push(server)
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address() as AddressInfo
    return {
      url: `https://127.0.0.1:${address.port}/challenge`,
      // The same signature `https.request` has, pointed at plain HTTP.
      request: (options: any, callback: any) =>
        http.request({ ...options, protocol: 'http:' }, callback)
    }
  }

  it('answers the status and the body for an ordinary reply', async () => {
    const { url, request } = await serve((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"ok":true}')
    })
    const answer = await httpsRequest('GET', url, undefined, request)
    expect(answer.status).toBe(200)
    expect(answer.data).toBe('{"ok":true}')
  })

  it('sends the body and the headers a POST needs', async () => {
    let seen: { method?: string; type?: string; body?: string } = {}
    const { url, request } = await serve((req, res) => {
      const chunks: Buffer[] = []
      req.on('data', (c: Buffer) => chunks.push(c))
      req.on('end', () => {
        seen = {
          method: req.method,
          type: req.headers['content-type'],
          body: Buffer.concat(chunks).toString('utf8')
        }
        res.writeHead(200)
        res.end('done')
      })
    })
    await httpsRequest('POST', url, { answer: 42 }, request)
    expect(seen.method).toBe('POST')
    expect(seen.type).toBe('application/json')
    expect(seen.body).toBe('{"answer":42}')
  })

  it('names the server when the connection drops mid-body', async () => {
    // The hang this pair of handlers exists for: once headers have arrived
    // Node routes a socket close to the *response*, not the request, and
    // clears the request timer — so without them `--solve-captcha` waited
    // for ever with no output and no recovery but Ctrl-C.
    const { url, request } = await serve((_req, res) => {
      res.writeHead(200, { 'Content-Length': '120' })
      res.write('{"challenge":"abc"')
      setTimeout(() => res.socket?.destroy(), 20)
    })
    await expect(httpsRequest('GET', url, undefined, request)).rejects.toThrow(
      /CAPTCHA server closed the connection: GET/
    )
  })

  it('gives up rather than waiting for a server that says nothing', async () => {
    // `req.setTimeout` does cover this half — before any headers exist —
    // and nothing asserted it either. A short deadline rather than the
    // real 30 seconds, which is the other reason the deadline is a
    // parameter: the whole suite is not going to wait half a minute.
    const { url, request } = await serve(() => {})
    await expect(
      httpsRequest('GET', url, undefined, request, 120)
    ).rejects.toThrow(/timed out after 120ms/)
  })
})
