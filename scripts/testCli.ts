/**
 * End-to-end one-shot tests for the engine-based Edge CLI.
 * Always uses tester servers (-t). Never hits production.
 *
 * Usage: node -r sucrase/register scripts/testCli.ts
 */
import { execSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { isTesterConfig } from '../src/cli/engine/testerServers'
import { TCP_TOKEN_HEADER } from '../src/cli/engine/transportAuth'
import { engineRequest } from './engineRequest'
import {
  createAccountWithCaptcha,
  loginWithPasswordAndCaptcha,
  readTcpToken,
  startEngine
} from './util/cliHarness'

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
  } catch (caught: unknown) {
    const error = caught as {
      status?: number
      stdout?: string
      stderr?: string
    }
    return {
      code: error.status ?? 1,
      stdout: String(error.stdout ?? ''),
      stderr: String(error.stderr ?? '')
    }
  }
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

  // With TCP, for the parity check further down.
  const { engine, socketPath: sock } = await startEngine({
    directory: TMP,
    args: ['--tcp=9008']
  })

  try {
    // Config asserts tester servers
    let start = Date.now()
    const config = await engineRequest(sock, 'GET', '/engine/config')
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
    const statusUnix = await engineRequest(sock, 'GET', '/engine/status')
    // With the bearer token from the engine's run file. The TCP guard
    // requires it on every request, so this probe — which sent no headers at
    // all — got 401 and made the parity check fail on every run: the whole
    // networked suite exited 1 for ever, and a real regression in any of the
    // twenty-odd cases after it was indistinguishable from the fixed red.
    const tcpToken = readTcpToken(9008)
    if (tcpToken == null) {
      throw new Error(
        'no TCP token in any run file for port 9008; the engine should have ' +
          'minted one when started with --tcp'
      )
    }
    // Through `engineRequest`, with a TCP target: this was a twenty-five line
    // copy of it, and the module's own docstring says it exists to have
    // ended those. It took a `socketPath` and nothing else, which is why
    // every TCP probe in the suites was written again by hand.
    const statusTcp = await engineRequest(
      { host: '127.0.0.1', port: 9008 },
      'GET',
      '/engine/status',
      undefined,
      // The probe had no deadline of its own either, so an engine that
      // accepted the connection and never answered hung the suite instead of
      // failing this check.
      { headers: { [TCP_TOKEN_HEADER]: tcpToken }, timeoutMs: 30_000 }
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
    const create = await createAccountWithCaptcha(engineRequest, sock, {
      username: TEST_USER,
      password: TEST_PASS,
      pin: TEST_PIN
    })
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
    await engineRequest(sock, 'POST', `/account/${sessionId}/logout`)
    const login = await loginWithPasswordAndCaptcha(engineRequest, sock, {
      username: TEST_USER,
      password: TEST_PASS
    })
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
    const wallet = await engineRequest(
      sock,
      'POST',
      `/account/${sid}/create-currency-wallet`,
      {
        walletType: 'wallet:bitcoin',
        name: 'Test BTC'
      }
    )
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
    record('cli currency-wallets', start, list.code === 0)

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
    const touch = await engineRequest(sock, 'POST', `/account/${sid}/touch`)
    record('session touch', start, touch.status === 200)

    // Logout
    start = Date.now()
    const logout = await engineRequest(sock, 'POST', `/account/${sid}/logout`)
    record('logout', start, logout.status === 204 || logout.status === 200)

    // Edge login request returns lobbyId
    start = Date.now()
    const edge = await engineRequest(sock, 'POST', '/request-edge-login')
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
      await engineRequest(
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

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
