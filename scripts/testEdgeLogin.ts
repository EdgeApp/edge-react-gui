/**
 * Edge-login E2E against login-tester without the GUI:
 * 1. Create+login an approving account
 * 2. Request request-edge-login (returns lobbyId + uri)
 * 3. Approve the lobby from the logged-in account
 * 4. Poll until the pending login completes with a session
 *
 * Also prints the lobby URI for optional Maestro approval on a
 * tester-configured Edge build.
 *
 * Usage: node -r sucrase/register scripts/testEdgeLogin.ts
 */
import { spawn } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

import { solveCaptcha } from '../src/cli/client/solveCaptcha'

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-edgelogin-'))
const USER = `edgelogin${crypto.randomBytes(3).toString('hex')}`
const PASS = `Pass${crypto.randomBytes(4).toString('hex')}!e1`
const PIN = '2468'

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

async function createWithCaptcha(sock: string): Promise<string> {
  let create = await req(sock, 'POST', '/create-account', {
    username: USER,
    password: PASS,
    pin: PIN
  })
  if (create.json?.error?.code === 'CHALLENGE_REQUIRED') {
    const { challengeId, challengeUri } = create.json.error.details
    const ok = await solveCaptcha(challengeUri)
    if (!ok) throw new Error('CAPTCHA failed')
    create = await req(sock, 'POST', '/create-account', {
      username: USER,
      password: PASS,
      pin: PIN,
      challengeId
    })
  }
  if (create.status !== 200) {
    throw new Error(`create failed: ${JSON.stringify(create.json)}`)
  }
  return create.json.sessionId as string
}

async function main(): Promise<void> {
  console.log(`Approver user=${USER} dir=${TMP}`)
  const engine = spawn(
    process.execPath,
    [
      '-r',
      'sucrase/register',
      'src/cli/engine/index.ts',
      '-t',
      '-d',
      TMP,
      '--idle-timeout=180'
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  let sock = ''
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error('engine timeout'))
    }, 60_000)
    engine.stderr?.on('data', (b: Buffer) => {
      const line = b.toString()
      process.stderr.write(line)
      const m = /unix:(.+)/.exec(line)
      if (m != null) sock = m[1].trim()
      if (line.includes('Ready')) {
        clearTimeout(t)
        resolve()
      }
    })
  })

  try {
    const approverSession = await createWithCaptcha(sock)
    console.log('approver session', approverSession)

    const pending = await req(sock, 'POST', '/request-edge-login')
    if (pending.status !== 200) {
      throw new Error(`edge login failed: ${JSON.stringify(pending.json)}`)
    }
    const { pendingId, lobbyId, uri } = pending.json
    console.log(JSON.stringify({ pendingId, lobbyId, uri }, null, 2))
    console.log(
      'Maestro tip: paste this URI into Scan QR → Enter on a tester-server Edge build:'
    )
    console.log(`  LOBBY_URI=${uri}`)
    console.log(
      `  maestro-runner --platform ios -e LOBBY_URI=${uri} test ~/.edge-cli/maestro/C999006-edge-login-approve.yaml`
    )

    // Approve via REST (same tester login server)
    const fetched = await req(
      sock,
      'GET',
      `/accounts/${approverSession}/lobbies/${lobbyId}`
    )
    console.log('lobby fetch', fetched.status, JSON.stringify(fetched.json))
    const approved = await req(
      sock,
      'POST',
      `/accounts/${approverSession}/lobbies/${lobbyId}/approve`
    )
    console.log('lobby approve', approved.status, JSON.stringify(approved.json))

    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      const st = await req(sock, 'GET', `/request-edge-login/${pendingId}`)
      console.log('poll', st.json?.state)
      if (st.json?.state === 'done' && st.json?.session != null) {
        console.log('PASS request-edge-login', st.json.session.sessionId)
        // Cleanup
        await req(
          sock,
          'POST',
          `/accounts/${approverSession}/delete-remote-account`
        )
        return
      }
      if (st.json?.state === 'error' || st.json?.state === 'closed') {
        throw new Error(`edge login ended: ${JSON.stringify(st.json)}`)
      }
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    throw new Error('Timed out waiting for request-edge-login approval')
  } finally {
    engine.kill('SIGTERM')
    fs.rmSync(TMP, { recursive: true, force: true })
  }
}

main().catch((e: unknown) => {
  console.error(e)
  process.exit(1)
})
