/**
 * End-to-end one-shot tests for the engine-based Edge CLI.
 * Always uses tester servers (-t). Never hits production.
 *
 * Usage: node -r sucrase/register scripts/testCli.ts
 */
import { execSync, spawn } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

import { solveCaptcha } from '../src/cli/client/solveCaptcha'
import { isTesterConfig } from '../src/cli/engine/testerServers'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  durationMs: number
  detail?: string
}

const results: TestResult[] = []
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-test-'))
const TEST_USER = `clieng${crypto.randomBytes(4).toString('hex')}`
const TEST_PASS = `Pass${crypto.randomBytes(4).toString('hex')}!a1`
const TEST_PIN = '1234'

function cli(
  args: string,
  timeoutMs = 120_000
): { code: number; stdout: string; stderr: string } {
  const cmd = `node -r sucrase/register src/cli/index.ts -t -d ${TMP} --no-spawn ${args}`
  try {
    const stdout = execSync(cmd, {
      cwd: process.cwd(),
      timeout: timeoutMs,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    return { code: 0, stdout, stderr: '' }
  } catch (err: unknown) {
    const error = err as { status?: number; stdout?: string; stderr?: string }
    return {
      code: error.status ?? 1,
      stdout: String(error.stdout ?? ''),
      stderr: String(error.stderr ?? '')
    }
  }
}

async function unixRequest(
  socketPath: string,
  method: string,
  urlPath: string,
  body?: unknown
): Promise<{ status: number; json: any }> {
  const payload =
    body === undefined ? undefined : Buffer.from(JSON.stringify(body))
  return await new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        path: urlPath,
        socketPath,
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
          let json: any
          try {
            json = raw === '' ? undefined : JSON.parse(raw)
          } catch {
            json = { raw }
          }
          resolve({ status: res.statusCode ?? 0, json })
        })
      }
    )
    req.on('error', reject)
    if (payload != null) req.write(payload)
    req.end()
  })
}

function record(
  name: string,
  start: number,
  ok: boolean,
  detail?: string
): void {
  results.push({
    name,
    status: ok ? 'PASS' : 'FAIL',
    durationMs: Date.now() - start,
    detail
  })
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${name}${detail != null ? ' — ' + detail : ''}`
  )
}

async function main(): Promise<void> {
  console.log(`Test directory: ${TMP}`)
  console.log(`Test user: ${TEST_USER}`)

  // Start engine with TCP for parity check
  const engine = spawn(
    process.execPath,
    [
      '-r',
      'sucrase/register',
      'src/cli/engine/index.ts',
      '-t',
      '-d',
      TMP,
      '--tcp=9008',
      '--idle-timeout=120'
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )

  let sock = ''
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('engine start timeout'))
    }, 60_000)
    engine.stderr?.on('data', (buf: Buffer) => {
      const line = buf.toString()
      process.stderr.write(line)
      const m = /Listening on unix:(.+)/.exec(line)
      if (m != null) sock = m[1].trim()
      if (line.includes('[edge-engine] Ready')) {
        clearTimeout(timer)
        resolve()
      }
    })
    engine.on('exit', code => {
      clearTimeout(timer)
      reject(new Error(`engine exited early: ${code}`))
    })
  })

  try {
    // Config asserts tester servers
    let start = Date.now()
    const config = await unixRequest(sock, 'GET', '/engine/config')
    const okConfig =
      config.status === 200 &&
      config.json.testMode === true &&
      isTesterConfig(config.json.servers)
    record(
      'config uses tester servers',
      start,
      okConfig,
      JSON.stringify(config.json.servers)
    )
    if (!okConfig) {
      throw new Error('Refusing to continue — not on tester servers')
    }

    // Status over unix and TCP must match
    start = Date.now()
    const statusUnix = await unixRequest(sock, 'GET', '/engine/status')
    const statusTcp = await new Promise<{ status: number; json: any }>(
      (resolve, reject) => {
        const req = http.request(
          {
            method: 'GET',
            host: '127.0.0.1',
            port: 9008,
            path: '/engine/status'
          },
          res => {
            const chunks: Buffer[] = []
            res.on('data', c => chunks.push(c))
            res.on('end', () => {
              resolve({
                status: res.statusCode ?? 0,
                json: JSON.parse(Buffer.concat(chunks).toString('utf8'))
              })
            })
          }
        )
        req.on('error', reject)
        req.end()
      }
    )
    record(
      'unix/tcp status parity',
      start,
      statusUnix.status === 200 &&
        statusTcp.status === 200 &&
        statusUnix.json.apiVersion === statusTcp.json.apiVersion &&
        statusUnix.json.pid === statusTcp.json.pid
    )

    // CLI engine-status
    start = Date.now()
    const st = cli('engine-status')
    record(
      'cli engine-status',
      start,
      st.code === 0 && st.stdout.includes('apiVersion')
    )

    // Challenge + account create with CAPTCHA
    start = Date.now()
    let create = await unixRequest(sock, 'POST', '/create-account', {
      username: TEST_USER,
      password: TEST_PASS,
      pin: TEST_PIN
    })
    if (
      create.status === 403 &&
      create.json?.error?.code === 'CHALLENGE_REQUIRED'
    ) {
      const { challengeId, challengeUri } = create.json.error.details
      const ok = await solveCaptcha(challengeUri)
      if (!ok) throw new Error('CAPTCHA solve failed')
      create = await unixRequest(sock, 'POST', '/create-account', {
        username: TEST_USER,
        password: TEST_PASS,
        pin: TEST_PIN,
        challengeId
      })
    }
    const sessionId = create.json?.sessionId as string | undefined
    record(
      'account create (with captcha retry)',
      start,
      create.status === 200 && typeof sessionId === 'string',
      `status=${create.status} user=${TEST_USER}`
    )

    if (sessionId == null) {
      throw new Error('No sessionId — aborting remaining tests')
    }

    // Persist session for CLI commands
    fs.writeFileSync(
      path.join(path.dirname(sock), 'session.json'),
      JSON.stringify({
        sessionId,
        username: TEST_USER,
        updatedAt: new Date().toISOString()
      })
    )

    // Password login (new session), then create a wallet immediately.
    // The engine must settle the account before returning the session so
    // this create-account → login → create-wallet path is a first-try success.
    start = Date.now()
    await unixRequest(sock, 'POST', `/account/${sessionId}/logout`)
    let login = await unixRequest(sock, 'POST', '/login-with-password', {
      username: TEST_USER,
      password: TEST_PASS
    })
    if (
      login.status === 403 &&
      login.json?.error?.code === 'CHALLENGE_REQUIRED'
    ) {
      const { challengeId, challengeUri } = login.json.error.details
      await solveCaptcha(challengeUri)
      login = await unixRequest(sock, 'POST', '/login-with-password', {
        username: TEST_USER,
        password: TEST_PASS,
        challengeId
      })
    }
    const sessionId2 = login.json?.sessionId as string | undefined
    record(
      'password login (with captcha retry)',
      start,
      login.status === 200 && typeof sessionId2 === 'string'
    )

    const sid = sessionId2 ?? sessionId
    fs.writeFileSync(
      path.join(path.dirname(sock), 'session.json'),
      JSON.stringify({
        sessionId: sid,
        username: TEST_USER,
        updatedAt: new Date().toISOString()
      })
    )

    start = Date.now()
    let wallet = await unixRequest(
      sock,
      'POST',
      `/account/${sid}/create-currency-wallet`,
      {
        walletType: 'wallet:bitcoin',
        name: 'Test BTC'
      }
    )
    // Brand-new tester accounts can miss the first createCurrencyWallet
    // (core throws "Wallet id … does not exist in this account"). Retry.
    for (let attempt = 1; attempt < 3 && wallet.status !== 200; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      wallet = await unixRequest(
        sock,
        'POST',
        `/account/${sid}/create-currency-wallet`,
        {
          walletType: 'wallet:bitcoin',
          name: 'Test BTC'
        }
      )
    }
    record(
      'wallet create',
      start,
      wallet.status === 200 &&
        (wallet.json?.walletId != null || wallet.json?.id != null),
      wallet.json?.walletId ??
        wallet.json?.id ??
        `status=${wallet.status} body=${JSON.stringify(wallet.json)}`
    )
    const walletId = (wallet.json?.walletId ?? wallet.json?.id) as string

    start = Date.now()
    const list = cli('currency-wallets --filter=all')
    record(
      'cli currency-wallets',
      start,
      list.code === 0,
      wallet.status !== 200 ? list.stdout.trim() : undefined
    )

    if (walletId != null) {
      start = Date.now()
      const info = cli(`wallet-info --wallet-id=${walletId}`)
      record('cli wallet-info', start, info.code === 0)

      start = Date.now()
      const bal = cli(`balance-map --wallet-id=${walletId}`)
      record('cli balance-map', start, bal.code === 0)

      start = Date.now()
      const addr = cli(`get-addresses --wallet-id=${walletId}`)
      record('cli get-addresses', start, addr.code === 0)
    }

    // Session touch
    start = Date.now()
    const touch = await unixRequest(sock, 'POST', `/account/${sid}/touch`)
    record('session touch', start, touch.status === 200)

    // Logout
    start = Date.now()
    const logout = await unixRequest(sock, 'POST', `/account/${sid}/logout`)
    record('logout', start, logout.status === 204 || logout.status === 200)

    // Edge login request returns lobbyId
    start = Date.now()
    const edge = await unixRequest(sock, 'POST', '/request-edge-login')
    record(
      'request-edge-login returns lobbyId',
      start,
      edge.status === 200 &&
        typeof edge.json?.lobbyId === 'string' &&
        typeof edge.json?.uri === 'string' &&
        edge.json.uri.startsWith('edge://edge/'),
      edge.json?.uri
    )
    if (edge.json?.pendingId != null) {
      await unixRequest(
        sock,
        'POST',
        `/pending-edge-login/${edge.json.pendingId}/cancel-request`
      )
    }
  } finally {
    engine.kill('SIGTERM')
    try {
      fs.rmSync(TMP, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }

  console.log('\n=== Summary ===')
  const failed = results.filter(r => r.status === 'FAIL')
  for (const r of results) {
    console.log(
      `${r.status} ${r.name} (${r.durationMs}ms)${
        r.detail != null ? ' ' + r.detail : ''
      }`
    )
  }
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length > 0) process.exit(1)
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
