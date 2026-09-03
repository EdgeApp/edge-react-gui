/**
 * Headless ALTCHA proof-of-work CAPTCHA solver for login-tester.
 */
import crypto from 'crypto'
import https from 'https'

const REQUEST_TIMEOUT_MS = 30_000

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

export async function solveCaptcha(challengeUri: string): Promise<boolean> {
  const page = await httpsGet(challengeUri)
  if (page.status < 200 || page.status >= 300) {
    throw new Error(`CAPTCHA challenge GET failed with status ${page.status}`)
  }
  const match = /challenge:\s*(\{[^}]+\})/.exec(page.data)
  if (match == null) throw new Error('Could not find challenge in page')

  const ch = JSON.parse(match[1]) as {
    algorithm: string
    challenge: string
    maxnumber: number
    salt: string
  }

  for (let i = 0; i <= ch.maxnumber; i++) {
    const hash = crypto
      .createHash('sha256')
      .update(ch.salt + String(i))
      .digest('hex')
    if (hash === ch.challenge) {
      const resp = await httpsPost(challengeUri, { solution: i, trail: [] })
      return resp.status >= 200 && resp.status < 300
    }
  }
  return false
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
