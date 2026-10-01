import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import {
  parseAltchaChallenge,
  solveAltcha
} from '../../cli/client/solveCaptcha'

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
    // Both of `solveCaptcha`'s helpers resolve with a value, so each needs
    // the pair.
    const captcha = read('solveCaptcha.ts')
    expect(count(captcha, "res.on('aborted'")).toBe(
      count(captcha, "res.on('end'")
    )

    // `apiClient` has three consumers and two need it: `request` and
    // `openStream`'s 4xx branch. `openStream`'s success branch resolves on
    // `end`, which a dropped stream also reaches, so it settles either way —
    // a stream ending is the documented termination, reported as
    // `subscription.ended` with exit 7.
    const client = read('apiClient.ts')
    expect(count(client, "res.on('aborted'")).toBe(2)
  })
})
