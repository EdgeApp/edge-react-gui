/**
 * Focused CAPTCHA + account create + password login test against login-tester.
 *
 * Usage: node -r sucrase/register scripts/testCliCaptcha.ts
 */
import { spawn } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

import { solveCaptcha } from '../src/cli/client/solveCaptcha'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-captcha-'))
const USER = `captcha${crypto.randomBytes(4).toString('hex')}`
const PASS = `Pass${crypto.randomBytes(4).toString('hex')}!b2`
const PIN = '4321'

async function req(
  sock: string,
  method: string,
  urlPath: string,
  body?: unknown
): Promise<{ status: number; json: any }> {
  const payload =
    body === undefined ? undefined : Buffer.from(JSON.stringify(body))
  return await new Promise((resolve, reject) => {
    const r = http.request(
      {
        method,
        path: urlPath,
        socketPath: sock,
        headers: {
          Accept: 'application/json',
          ...(payload != null
            ? {
                'Content-Type': 'application/json',
                'Content-Length': String(payload.length)
              }
            : {})
        }
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          resolve({
            status: res.statusCode ?? 0,
            json: raw === '' ? undefined : JSON.parse(raw)
          })
        })
      }
    )
    r.on('error', reject)
    if (payload != null) r.write(payload)
    r.end()
  })
}

async function main(): Promise<void> {
  console.log(`user=${USER} dir=${TMP}`)
  const engine = spawn(
    process.execPath,
    [
      '-r',
      'sucrase/register',
      'src/cli/engine/index.ts',
      '-t',
      '-d',
      TMP,
      '--idle-timeout=120'
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  let sock = ''
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error('timeout'))
    }, 60_000)
    engine.stderr?.on('data', (b: Buffer) => {
      const line = b.toString()
      process.stderr.write(line)
      const m = /Listening on unix:(.+)/.exec(line)
      if (m != null) sock = m[1].trim()
      if (line.includes('Ready')) {
        clearTimeout(t)
        resolve()
      }
    })
  })

  try {
    // Create — expect challenge or success
    let create = await req(sock, 'POST', '/v1/login/create', {
      username: USER,
      password: PASS,
      pin: PIN
    })
    console.log(
      'create initial status',
      create.status,
      create.json?.error?.code
    )
    if (create.json?.error?.code === 'CHALLENGE_REQUIRED') {
      const { challengeId, challengeUri } = create.json.error.details
      console.log('challengeUri', challengeUri)
      const ok = await solveCaptcha(challengeUri)
      console.log('solveCaptcha', ok)
      if (!ok) throw new Error('CAPTCHA failed')
      create = await req(sock, 'POST', '/v1/login/create', {
        username: USER,
        password: PASS,
        pin: PIN,
        challengeId
      })
    }
    if (create.status !== 200) {
      throw new Error(`create failed: ${JSON.stringify(create.json)}`)
    }
    console.log('CREATED session', create.json.sessionId)

    // Logout
    await req(sock, 'DELETE', `/v1/accounts/${create.json.sessionId}`)

    // Login again with captcha path
    let login = await req(sock, 'POST', '/v1/login/password', {
      username: USER,
      password: PASS
    })
    console.log('login initial status', login.status, login.json?.error?.code)
    if (login.json?.error?.code === 'CHALLENGE_REQUIRED') {
      const { challengeId, challengeUri } = login.json.error.details
      await solveCaptcha(challengeUri)
      login = await req(sock, 'POST', '/v1/login/password', {
        username: USER,
        password: PASS,
        challengeId
      })
    }
    if (login.status !== 200) {
      throw new Error(`login failed: ${JSON.stringify(login.json)}`)
    }
    console.log('LOGGED IN session', login.json.sessionId)

    // Cleanup remote account
    await req(sock, 'DELETE', `/v1/accounts/${login.json.sessionId}/remote`)
    console.log('PASS captcha account create + login')
  } finally {
    engine.kill('SIGTERM')
    fs.rmSync(TMP, { recursive: true, force: true })
  }
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
