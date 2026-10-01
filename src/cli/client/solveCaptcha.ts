/**
 * Headless ALTCHA proof-of-work CAPTCHA solver for login-tester.
 */
import { asJSON, asMaybe, asNumber, asObject, asString } from 'cleaners'
import crypto from 'crypto'
import https from 'https'

const REQUEST_TIMEOUT_MS = 30_000

/**
 * The altcha challenge embedded in the CAPTCHA page.
 *
 * `maxnumber` bounds a synchronous hash loop, so it is both cleaned and
 * capped: an unbounded value blocks the process with no timeout — the two
 * HTTPS calls are the only thing `REQUEST_TIMEOUT_MS` covers.
 */
export type AltchaChallenge = ReturnType<typeof asAltchaChallenge>

const asAltchaChallenge = asJSON(
  asObject({
    challenge: asString,
    maxnumber: asNumber,
    salt: asString
  })
)

/** 10 million sha256 hashes is already several seconds of work. */
const MAX_CHALLENGE_NUMBER = 10_000_000

async function httpsGet(
  url: string
): Promise<{ status: number; data: string }> {
  return await new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer | string) => {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
      })
      res.on('end', () => {
        resolve({
          status: res.statusCode ?? 0,
          data: Buffer.concat(chunks).toString('utf8')
        })
      })
      // Once headers have arrived Node routes a socket close to the
      // *response*, not the request, and clears the request timer — so
      // without these two a connection dropped mid-body never settled and
      // `--solve-captcha` hung for ever with no output and no recovery but
      // Ctrl-C. `req.setTimeout` below cannot cover it. Same gap and same
      // fix as `apiClient`'s.
      res.on('error', reject)
      res.on('aborted', () => {
        reject(
          new Error(`The CAPTCHA server closed the connection: GET ${url}`)
        )
      })
    })
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(
        new Error(`CAPTCHA GET timed out after ${REQUEST_TIMEOUT_MS}ms`)
      )
    })
    req.on('error', reject)
  })
}

async function httpsPost(
  url: string,
  body: object
): Promise<{ status: number; data: string }> {
  const u = new URL(url)
  const payload = Buffer.from(JSON.stringify(body), 'utf8')
  return await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port !== '' ? Number(u.port) : 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        }
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer | string) => {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
        })
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 0,
            data: Buffer.concat(chunks).toString('utf8')
          })
        })
        // As in `httpsGet` above, and for the same reason.
        res.on('error', reject)
        res.on('aborted', () => {
          reject(
            new Error(`The CAPTCHA server closed the connection: POST ${url}`)
          )
        })
      }
    )
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(
        new Error(`CAPTCHA POST timed out after ${REQUEST_TIMEOUT_MS}ms`)
      )
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

/**
 * The ALTCHA challenge embedded in a page, validated and bounded.
 *
 * Split out from `solveCaptcha` so it can be tested: everything interesting
 * about it is pure given the page text — the scrape, the clean, and the cap
 * on a synchronous hash loop — while the function around it is two HTTPS
 * calls. `--solve-captcha` is the flag unattended runs depend on, and the
 * only exercise it had was a live request to login-tester.
 */
export function parseAltchaChallenge(pageText: string): AltchaChallenge {
  const match = /challenge:\s*(\{[^}]+\})/.exec(pageText)
  if (match == null) throw new Error('Could not find challenge in page')

  // Cleaned, not cast, and one cleaner owns both the parse and the shape:
  // every field here comes from a page the CLI did not write, and
  // `maxnumber` is the bound of a synchronous hash loop. With `JSON.parse`
  // outside the cleaner, a capture that is not valid JSON — an unquoted key,
  // a truncated blob — threw a bare `SyntaxError` straight out of here, past
  // the `asMaybe` guard and the message just below that was written for
  // exactly that case.
  const ch = asMaybe(asAltchaChallenge)(match[1])
  if (ch == null) {
    throw new Error('Challenge in page is not in the expected shape')
  }
  if (ch.maxnumber > MAX_CHALLENGE_NUMBER) {
    throw new Error(
      `Challenge asks for up to ${ch.maxnumber} hashes, above the ${MAX_CHALLENGE_NUMBER} limit`
    )
  }
  return ch
}

/**
 * The number whose hash matches the challenge, or null if there is none.
 *
 * Pure, and therefore testable with a salt and number chosen in advance.
 */
export async function solveAltcha(ch: AltchaChallenge): Promise<number | null> {
  for (let i = 0; i <= ch.maxnumber; i++) {
    // Yield periodically. The loop is synchronous, so without this a large
    // `maxnumber` blocks the process with no output and no way to interrupt
    // it: SIGINT is never delivered because control never returns to the
    // event loop.
    if (i % 5000 === 0 && i > 0) await yieldToEventLoop()
    const hash = crypto
      .createHash('sha256')
      .update(ch.salt + String(i))
      .digest('hex')
    if (hash === ch.challenge) return i
  }
  return null
}

export async function solveCaptcha(challengeUri: string): Promise<boolean> {
  const page = await httpsGet(challengeUri)
  if (page.status < 200 || page.status >= 300) {
    throw new Error(`CAPTCHA challenge GET failed with status ${page.status}`)
  }
  const solution = await solveAltcha(parseAltchaChallenge(page.data))
  if (solution == null) return false
  const resp = await httpsPost(challengeUri, { solution, trail: [] })
  return resp.status >= 200 && resp.status < 300
}

async function yieldToEventLoop(): Promise<void> {
  await new Promise<void>(resolve => setImmediate(resolve))
}

/**
 * Given challengeId + challengeUri from a CHALLENGE_REQUIRED error,
 * solve the CAPTCHA and return the challengeId for retry.
 */
export async function solveChallenge(details: {
  challengeId: string
  challengeUri?: string
}): Promise<string> {
  if (details.challengeUri != null) {
    const ok = await solveCaptcha(details.challengeUri)
    if (!ok) throw new Error('Failed to solve CAPTCHA')
  }
  return details.challengeId
}
