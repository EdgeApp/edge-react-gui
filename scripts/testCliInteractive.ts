/**
 * Interactive CLI E2E test.
 *
 * Spawns `yarn cli -t` in interactive REPL mode, feeds every command
 * through stdin, captures the full session transcript, and writes it
 * to a log file for audit.
 *
 * Usage:  node -r sucrase/register scripts/testCliInteractive.ts
 *
 * The transcript is written to /tmp/edge-cli-interactive-<runId>.log
 */

import { type ChildProcess, spawn } from 'child_process'
import crypto from 'crypto'
import type {
  EdgeContext,
  EdgeCorePlugins,
  EdgeCorePluginsInit
} from 'edge-core-js'
import fs from 'fs'
import https from 'https'

// ---------------------------------------------------------------------------
// HTTP helpers  (same as testCli.ts)
// ---------------------------------------------------------------------------

async function httpsGet(
  url: string
): Promise<{ status: number; data: string }> {
  return await new Promise((resolve, reject) => {
    https
      .get(url, res => {
        let data = ''
        res.on('data', (chunk: string) => (data += chunk))
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, data })
        })
      })
      .on('error', reject)
  })
}

async function httpsPost(
  url: string,
  body: object
): Promise<{ status: number; data: string }> {
  const u = new URL(url)
  return await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port !== '' ? Number(u.port) : 443,
        path: u.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      res => {
        let data = ''
        res.on('data', (chunk: string) => (data += chunk))
        res.on('end', () => {
          resolve({ status: res.statusCode ?? 0, data })
        })
      }
    )
    req.on('error', reject)
    req.write(JSON.stringify(body))
    req.end()
  })
}

// ---------------------------------------------------------------------------
// CAPTCHA solver
// ---------------------------------------------------------------------------

async function solveCaptcha(challengeUri: string): Promise<boolean> {
  const page = (await httpsGet(challengeUri)).data
  const match = /challenge:\s*(\{[^}]+\})/.exec(page)
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
      return resp.status === 200
    }
  }
  return false
}

async function getChallenge(context: EdgeContext): Promise<string> {
  const { challengeId, challengeUri } = await context.fetchChallenge()
  if (challengeUri != null) {
    const ok = await solveCaptcha(challengeUri)
    if (!ok) throw new Error('Failed to solve CAPTCHA')
  }
  return challengeId
}

// ---------------------------------------------------------------------------
// Interactive REPL driver
// ---------------------------------------------------------------------------

interface ReplSession {
  proc: ChildProcess
  transcript: string
  logPath: string
}

/**
 * Wait for the `> ` prompt (or end of output settling) and return
 * everything received since the last send.
 */
async function waitForPrompt(
  repl: ReplSession,
  timeoutMs = 60_000
): Promise<string> {
  return await new Promise((resolve, reject) => {
    let buffer = ''
    const timer = setTimeout(() => {
      cleanup()
      resolve(buffer) // Return what we have even on timeout
    }, timeoutMs)

    function onData(chunk: Buffer): void {
      const text = chunk.toString()
      buffer += text
      // The REPL prints `> ` when ready for the next command
      if (buffer.includes('> ') && buffer.endsWith('> ')) {
        cleanup()
        resolve(buffer)
      }
    }

    function onError(err: Error): void {
      cleanup()
      reject(err)
    }

    function onClose(): void {
      cleanup()
      resolve(buffer)
    }

    function cleanup(): void {
      clearTimeout(timer)
      repl.proc.stdout?.removeListener('data', onData)
      repl.proc.stderr?.removeListener('data', onData)
      repl.proc.removeListener('error', onError)
      repl.proc.removeListener('close', onClose)
    }

    repl.proc.stdout?.on('data', onData)
    repl.proc.stderr?.on('data', onData)
    repl.proc.on('error', onError)
    repl.proc.on('close', onClose)
  })
}

/**
 * Send a command to the REPL and wait for the response.
 */
async function send(
  repl: ReplSession,
  command: string,
  timeoutMs = 60_000
): Promise<string> {
  const label = `> ${command}`
  repl.transcript += `${label}\n`
  fs.appendFileSync(repl.logPath, `${label}\n`)

  repl.proc.stdin?.write(command + '\n')
  const response = await waitForPrompt(repl, timeoutMs)

  // Strip the echoed command and trailing prompt from the response
  const cleaned = response
    .replace(new RegExp(`^.*?${escapeRegex(command)}\\n?`), '')
    .replace(/> $/, '')
    .trim()

  if (cleaned.length > 0) {
    repl.transcript += cleaned + '\n\n'
    fs.appendFileSync(repl.logPath, cleaned + '\n\n')
  } else {
    repl.transcript += '(no output)\n\n'
    fs.appendFileSync(repl.logPath, '(no output)\n\n')
  }

  return cleaned
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const edgeCore = require('edge-core-js') as {
    addEdgeCorePlugins: (plugins: EdgeCorePlugins) => void
    lockEdgeCorePlugins: () => void
    makeEdgeContext: (opts: Record<string, unknown>) => Promise<EdgeContext>
  }
  const currencyPlugins = (
    require('edge-currency-plugins') as { default: EdgeCorePlugins }
  ).default
  const accountbasedPlugins = (
    require('edge-currency-accountbased') as { default: EdgeCorePlugins }
  ).default
  const keys = require('../keys.json') as {
    edgeApiKey: string
    edgeApiSecret?: string
  }

  edgeCore.addEdgeCorePlugins(currencyPlugins)
  edgeCore.addEdgeCorePlugins(accountbasedPlugins)
  edgeCore.lockEdgeCorePlugins()

  const setupPlugins: EdgeCorePluginsInit = { bitcoin: true }
  for (const id of Object.keys(currencyPlugins)) {
    if (!(id in setupPlugins)) setupPlugins[id] = false
  }
  for (const id of Object.keys(accountbasedPlugins)) {
    setupPlugins[id] = false
  }

  const RUN_ID = crypto.randomBytes(4).toString('hex')
  const TEST_USER = `clitest_${RUN_ID}`
  const TEST_PASS = `Pass!${RUN_ID}1234`
  const TEST_PIN = '1928'
  const LOG_PATH = `/tmp/edge-cli-interactive-${RUN_ID}.log`

  console.log('Edge CLI Interactive E2E Test')
  console.log(`Run ID:    ${RUN_ID}`)
  console.log(`Test user: ${TEST_USER}`)
  console.log(`Log file:  ${LOG_PATH}`)
  console.log('')

  // ── Create test account programmatically ─────────────────────────
  console.log('Setting up test account on tester servers...')
  const context: EdgeContext = await edgeCore.makeEdgeContext({
    apiKey: keys.edgeApiKey,
    apiSecret:
      keys.edgeApiSecret != null
        ? Buffer.from(keys.edgeApiSecret, 'hex')
        : undefined,
    appId: '',
    loginServer: 'https://login-tester.edge.app',
    infoServer: 'https://info-tester.edge.app',
    syncServer: 'https://sync-tester-us1.edge.app',
    path: `/tmp/edge-cli-interactive-${RUN_ID}`,
    plugins: setupPlugins
  })

  const challengeId = await getChallenge(context)
  const account = await context.createAccount({
    username: TEST_USER,
    password: TEST_PASS,
    pin: TEST_PIN,
    challengeId
  })
  const accountKey: string = await account.getLoginKey()
  await account.logout()
  console.log('Account created successfully.\n')

  // ── Start the interactive REPL ───────────────────────────────────
  fs.writeFileSync(
    LOG_PATH,
    `Edge CLI Interactive Test — ${new Date().toISOString()}\n`
  )
  fs.appendFileSync(LOG_PATH, `Run ID: ${RUN_ID}\n`)
  fs.appendFileSync(LOG_PATH, `Test user: ${TEST_USER}\n`)
  fs.appendFileSync(LOG_PATH, `${'═'.repeat(70)}\n\n`)

  const proc = spawn(
    'node',
    ['-r', 'sucrase/register', 'src/cli/index.ts', '-t'],
    {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    }
  )

  const repl: ReplSession = {
    proc,
    transcript: '',
    logPath: LOG_PATH
  }

  // Wait for initial startup (keys loaded + first prompt)
  const startup = await waitForPrompt(repl, 30_000)
  fs.appendFileSync(LOG_PATH, startup + '\n\n')

  console.log('REPL started. Running commands...\n')

  // ── Helper ───────────────────────────────────────────────────────
  async function run(
    cmd: string,
    label?: string,
    timeout?: number
  ): Promise<string> {
    const tag = label ?? cmd
    process.stdout.write(`  ${tag} ... `)
    const result = await send(repl, cmd, timeout)
    const firstLine = result.split('\n')[0].slice(0, 80)
    console.log(firstLine.length > 0 ? firstLine : '(ok)')
    return result
  }

  // ── Commands ─────────────────────────────────────────────────────

  // Help
  await run('help')
  await run('help balance')

  // Login
  await run(`password-login ${TEST_USER} ${TEST_PASS}`)

  // Username / context commands
  await run('username-list')
  await run('messages-fetch')

  // Account info
  await run('account-key')
  await run('key-list')

  // Wallet creation
  await run(
    'wallet-create wallet:bitcointestnet4 "Interactive Test BTC"',
    'wallet-create (btc)',
    60_000
  )

  // Capture the wallet ID from the transcript
  const walletIdMatch = /"walletId":\s*"([^"]+)"/.exec(repl.transcript)
  const btcWalletId = walletIdMatch != null ? walletIdMatch[1] : ''

  if (btcWalletId !== '') {
    // Wallet commands
    await run('wallet-list', undefined, 120_000)
    await run(`wallet-info ${btcWalletId}`)
    await run(`wallet-rename ${btcWalletId} "Renamed Interactive"`)
    await run(`balance ${btcWalletId}`)
    await run(`address ${btcWalletId}`)
    await run(`tx-list ${btcWalletId}`)
    await run(`export-public ${btcWalletId}`)
    await run(`export-private ${btcWalletId}`)
    await run(`key-get ${btcWalletId}`)
    await run(`token-list ${btcWalletId}`)
    await run(`token-detected ${btcWalletId}`)

    // Spend (will fail with InsufficientFundsError — expected)
    await run(
      `max-spendable ${btcWalletId} tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx`
    )
    await run(
      `spend ${btcWalletId} tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx 0.0001 dry-run`,
      'spend dry-run'
    )
    await run(
      `spend-max ${btcWalletId} tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx dry-run`,
      'spend-max dry-run'
    )

    // Archive / unarchive / undelete
    await run(`wallet-archive ${btcWalletId}`)
    await run(`wallet-unarchive ${btcWalletId}`)
    await run(`wallet-undelete ${btcWalletId}`)
  } else {
    fs.appendFileSync(
      LOG_PATH,
      '!! SKIPPED wallet commands — no walletId captured\n\n'
    )
    console.log('  !! Skipped wallet commands — no walletId')
  }

  // Solana wallet for token commands (EVM wallets fail due to upstream
  // edge-currency-accountbased bug — missing ABI JSON file)
  await run(
    'wallet-create wallet:solana "Interactive Test SOL"',
    'wallet-create (sol)',
    120_000
  )

  // Capture the SOL wallet ID (last walletId in transcript)
  const solMatches = repl.transcript.matchAll(/"walletId":\s*"([^"]+)"/g)
  let solWalletId = ''
  for (const m of solMatches) {
    solWalletId = m[1]
  }

  if (solWalletId !== '' && solWalletId !== btcWalletId) {
    await run(`token-list ${solWalletId}`, 'token-list (sol)', 60_000)

    // USDC on Solana
    const usdcTokenId = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    await run(
      `token-enable ${solWalletId} ${usdcTokenId}`,
      'token-enable (USDC)',
      60_000
    )
    await run(
      `token-disable ${solWalletId} ${usdcTokenId}`,
      'token-disable (USDC)',
      60_000
    )
    await run(`token-detected ${solWalletId}`, 'token-detected (sol)', 60_000)
  } else {
    fs.appendFileSync(
      LOG_PATH,
      '!! SKIPPED token commands — no SOL walletId captured\n\n'
    )
    console.log('  !! Skipped token commands — no SOL walletId')
  }

  // Data store CRUD
  await run('data-store-set cli-test item1 "hello world"')
  await run('data-store-list')
  await run('data-store-list cli-test')
  await run('data-store-get cli-test item1')
  await run('data-store-delete cli-test item1')
  await run('data-store-delete cli-test')

  // OTP round-trip
  await run('otp-status')
  await run('otp-enable')
  await run('otp-status', 'otp-status (after enable)')
  await run('otp-disable')
  await run('otp-status', 'otp-status (after disable)')

  // PIN round-trip (setup, logout, login with PIN, then delete)
  await run('pin-setup 5566')
  await run('logout')
  await run(`pin-login ${TEST_USER} 5566`)
  await run('pin-delete')

  // Password change round-trip
  const newPass = `NewPass!${RUN_ID}9876`
  await run(`password-setup ${newPass}`)
  await run('logout')
  await run(
    `password-login ${TEST_USER} ${newPass}`,
    'password-login (new pass)'
  )
  await run(`password-setup ${TEST_PASS}`, 'password-setup (revert)')

  // Recovery round-trip
  await run(
    'recovery2-setup "What is your pet?" "Fluffy" "Favorite color?" "Blue"'
  )

  // Key login (logout first, then re-login with key)
  await run('logout')
  await run(`key-login ${TEST_USER} ${accountKey}`)

  // Lobby (limited — fetch with bogus ID)
  await run('admin-lobby-fetch 000000000000', 'admin-lobby-fetch (invalid)')

  // Admin / utility commands
  await run('admin-filename-hash dGVzdA== hello')
  await run('admin-username-hash test_nonexistent_user')

  // Final logout
  await run('logout')

  // Exit the REPL
  proc.stdin?.write('exit\n')
  await new Promise<void>(resolve => {
    proc.on('close', () => {
      resolve()
    })
    setTimeout(resolve, 5000)
  })

  // ── Summary ──────────────────────────────────────────────────────
  const summary = `
${'═'.repeat(70)}
INTERACTIVE TEST COMPLETE
Run ID:    ${RUN_ID}
Test user: ${TEST_USER}
Log file:  ${LOG_PATH}
${'═'.repeat(70)}
`
  fs.appendFileSync(LOG_PATH, summary)
  console.log(summary)
  console.log(`Full transcript: ${LOG_PATH}`)

  process.exit(0)
}

main().catch((error: unknown) => {
  console.error('Test runner error:', error)
  process.exit(2)
})
