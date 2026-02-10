/**
 * End-to-end test script for the Edge CLI.
 *
 * Exercises every CLI command using the Edge tester servers so that no
 * production accounts are created and no real funds are moved.
 *
 * The script automatically solves the server's Altcha proof-of-work
 * CAPTCHA so account creation and login work without human interaction.
 *
 * Usage:  node -r sucrase/register scripts/testCli.ts
 */

import { execSync } from 'child_process'
import crypto from 'crypto'
import type {
  EdgeContext,
  EdgeCorePlugins,
  EdgeCorePluginsInit
} from 'edge-core-js'
import https from 'https'

// ---------------------------------------------------------------------------
// HTTP helpers
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
// CAPTCHA solver  (Altcha proof-of-work)
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

/**
 * Fetch a challenge from the context, solve the CAPTCHA, and return
 * the challengeId to use for account creation / login.
 */
async function getChallenge(context: EdgeContext): Promise<string> {
  const { challengeId, challengeUri } = await context.fetchChallenge()
  if (challengeUri != null) {
    const ok = await solveCaptcha(challengeUri)
    if (!ok) throw new Error('Failed to solve CAPTCHA')
  }
  return challengeId
}

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

interface TestResult {
  command: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  durationMs: number
  output: string
  error?: string
}

const results: TestResult[] = []
const CMD_TIMEOUT = 120_000

function cli(
  args: string,
  timeoutMs = CMD_TIMEOUT
): { code: number; stdout: string; stderr: string } {
  const cmd = `node -r sucrase/register src/cli/index.ts ${args}`
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

function test(
  name: string,
  args: string,
  opts: {
    expectFail?: boolean
    skip?: boolean
    skipReason?: string
    timeoutMs?: number
    validate?: (out: string) => void
  } = {}
): TestResult {
  if (opts.skip === true) {
    const result: TestResult = {
      command: name,
      status: 'SKIP',
      durationMs: 0,
      output: opts.skipReason ?? 'Skipped'
    }
    results.push(result)
    console.log(`  ○ SKIP  ${name} — ${result.output}`)
    return result
  }

  const t0 = Date.now()
  const { code, stdout, stderr } = cli(args, opts.timeoutMs)
  const durationMs = Date.now() - t0
  const fullOutput = stdout + stderr

  let status: 'PASS' | 'FAIL' = 'PASS'
  let errorMsg: string | undefined

  if (opts.expectFail === true) {
    if (code === 0) {
      status = 'FAIL'
      errorMsg = 'Expected non-zero exit but got 0'
    }
  } else if (code !== 0) {
    status = 'FAIL'
    // Filter out the node-getopt deprecation warning noise
    const cleaned = stderr
      .split('\n')
      .filter(l => !l.includes('DEP0128') && !l.includes('trace-deprecation'))
      .join('\n')
      .trim()
    errorMsg = cleaned.length > 0 ? cleaned.slice(0, 400) : 'Non-zero exit'
  }

  if (status === 'PASS' && opts.validate != null) {
    try {
      opts.validate(fullOutput)
    } catch (e: unknown) {
      status = 'FAIL'
      errorMsg = e instanceof Error ? e.message : String(e)
    }
  }

  const result: TestResult = {
    command: name,
    status,
    durationMs,
    output: fullOutput.slice(0, 1500),
    error: errorMsg
  }
  results.push(result)

  const icon = status === 'PASS' ? '✓' : '✗'
  const dur = `${(durationMs / 1000).toFixed(1)}s`
  console.log(`  ${icon} ${status}  ${name}  (${dur})`)
  if (errorMsg != null) console.log(`         → ${errorMsg.split('\n')[0]}`)
  return result
}

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Dynamic requires needed because these modules register global
  // side-effects (addEdgeCorePlugins) before makeEdgeContext is called.

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

  // Register all plugins (must happen before makeEdgeContext)
  edgeCore.addEdgeCorePlugins(currencyPlugins)
  edgeCore.addEdgeCorePlugins(accountbasedPlugins)
  edgeCore.lockEdgeCorePlugins()

  // Minimal plugin set for the programmatic setup context (fast)
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
  const BASE = `-t`
  const AUTH = `${BASE} -u ${TEST_USER} -p ${TEST_PASS}`

  console.log('Edge CLI End-to-End Tests')
  console.log(`Run ID: ${RUN_ID}`)
  console.log(`Test user: ${TEST_USER}`)
  console.log('')

  // ── Phase 0: Programmatic account setup ──────────────────────────
  console.log('═══ Phase 0: Setting up test account (programmatic) ═══')
  const t0 = Date.now()

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
    path: `/tmp/edge-cli-e2e-${RUN_ID}`,
    plugins: setupPlugins
  })

  // Solve CAPTCHA and create account
  const challengeId = await getChallenge(context)
  const account = await context.createAccount({
    username: TEST_USER,
    password: TEST_PASS,
    pin: TEST_PIN,
    challengeId
  })
  console.log(`  Account created in ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  // Get an account key for key-login test
  const accountKey: string = await account.getLoginKey()
  console.log(`  Account key obtained`)
  await account.logout()

  // Close the programmatic context — CLI creates its own
  // (context.close is not always available, just let it GC)

  // ── Phase 1: Context-only commands (no login) ────────────────────
  console.log('\n═══ Context-only commands (no login) ═══')

  test('help', `${BASE} help`, {
    validate: out => {
      assert(out.includes('Available commands'), 'Missing command list')
    }
  })

  test('help <command>', `${BASE} help balance`, {
    validate: out => {
      assert(out.includes('balance'), 'Missing balance help')
    }
  })

  // account-available needs its own CAPTCHA — solve one for it
  // We can't pass challengeId to the CLI currently, so test without login context
  // These will FAIL due to CAPTCHA — document that
  test('account-available', `${BASE} account-available ${TEST_USER}_nope`, {
    expectFail: true // ChallengeError expected — CLI has no CAPTCHA support yet
  })

  test('username-list', `${BASE} username-list`, {
    validate: out => {
      assert(out.includes('['), 'Should return an array')
    }
  })

  test('messages-fetch', `${BASE} messages-fetch`, {
    validate: out => {
      assert(out.includes('['), 'Should return messages array')
    }
  })

  test('filename-hash', `${BASE} filename-hash dGVzdA== hello`, {
    validate: out => {
      assert(out.length > 0, 'Should return a hash')
    }
  })

  test(
    'admin-auth-fetch GET /v2/messages',
    `${BASE} admin-auth-fetch /v2/messages`,
    {
      // This may fail if the endpoint doesn't exist or needs auth
    }
  )

  test('admin-username-hash', `${BASE} admin-username-hash ${TEST_USER}`, {
    validate: out => {
      assert(out.includes('base64'), 'Missing hash output')
    }
  })

  // ── Phase 2: Login / authentication ──────────────────────────────
  console.log('\n═══ Login / authentication ═══')

  test('password-login', `${AUTH} password-login ${TEST_USER} ${TEST_PASS}`, {
    timeoutMs: 60_000
  })

  test('account-key', `${AUTH} account-key`, {
    timeoutMs: 60_000,
    validate: out => {
      assert(out.trim().length > 10, 'Missing account key')
    }
  })

  test('key-login', `${BASE} key-login ${TEST_USER} ${accountKey}`, {
    timeoutMs: 60_000
  })

  // ── Phase 3: Keys & wallet creation ──────────────────────────────
  console.log('\n═══ Keys & wallets ═══')

  test('key-list', `${AUTH} key-list`, {
    timeoutMs: 60_000,
    validate: out => {
      assert(out.includes('['), 'Should return array')
    }
  })

  let btcWalletId = ''
  const createResult = test(
    'wallet-create (bitcointestnet4)',
    `${AUTH} wallet-create wallet:bitcointestnet4 "CLI Test BTC"`,
    {
      timeoutMs: 120_000,
      validate: out => {
        assert(out.includes('walletId'), 'Missing walletId')
      }
    }
  )
  if (createResult.status === 'PASS') {
    const m = /"walletId":\s*"([^"]+)"/.exec(createResult.output)
    if (m != null) btcWalletId = m[1]
  }

  test('wallet-list', `${AUTH} wallet-list`, {
    timeoutMs: 120_000,
    validate: out => {
      assert(
        out.includes('id') || out.includes('wallet-create'),
        'Should list wallets'
      )
    }
  })

  const hasWallet = btcWalletId !== ''
  const walletSkip = {
    skip: true,
    skipReason: 'No wallet ID from wallet-create'
  } as const

  test(
    'wallet-info',
    hasWallet ? `${AUTH} wallet-info ${btcWalletId}` : '',
    hasWallet ? { timeoutMs: 60_000 } : walletSkip
  )

  test(
    'wallet-rename',
    hasWallet
      ? `${AUTH} wallet-rename ${btcWalletId} "Renamed CLI Wallet"`
      : '',
    hasWallet ? { timeoutMs: 60_000 } : walletSkip
  )

  test(
    'balance',
    hasWallet ? `${AUTH} balance ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(out.includes('nativeBalance'), 'Should show balance')
          }
        }
      : walletSkip
  )

  test(
    'address',
    hasWallet ? `${AUTH} address ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(
              out.includes('walletId') ||
                out.includes('Address') ||
                out.includes('address'),
              'Should show address'
            )
          }
        }
      : walletSkip
  )

  test(
    'tx-list',
    hasWallet ? `${AUTH} tx-list ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(
              out.includes('transactions') || out.includes('No transactions'),
              'Should show tx info'
            )
          }
        }
      : walletSkip
  )

  test(
    'export-public',
    hasWallet ? `${AUTH} export-public ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(out.includes('publicKey'), 'Should show public key')
          }
        }
      : walletSkip
  )

  test(
    'export-private',
    hasWallet ? `${AUTH} export-private ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(out.includes('privateKey'), 'Should show private key')
          }
        }
      : walletSkip
  )

  test(
    'key-get',
    hasWallet ? `${AUTH} key-get ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(out.length > 10, 'Should return key data')
          }
        }
      : walletSkip
  )

  test(
    'token-list (BTC)',
    hasWallet ? `${AUTH} token-list ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(
              out.includes('tokens') || out.includes('No tokens'),
              'Should list tokens'
            )
          }
        }
      : walletSkip
  )

  test(
    'token-detected (BTC)',
    hasWallet ? `${AUTH} token-detected ${btcWalletId}` : '',
    hasWallet ? { timeoutMs: 60_000 } : walletSkip
  )

  test(
    'wallet-archive',
    hasWallet ? `${AUTH} wallet-archive ${btcWalletId}` : '',
    hasWallet
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(out.includes('archived'), 'Should confirm archive')
          }
        }
      : walletSkip
  )

  test(
    'wallet-unarchive',
    hasWallet ? `${AUTH} wallet-unarchive ${btcWalletId}` : '',
    hasWallet ? { timeoutMs: 60_000 } : walletSkip
  )

  test(
    'wallet-undelete',
    hasWallet ? `${AUTH} wallet-undelete ${btcWalletId}` : '',
    hasWallet ? { timeoutMs: 60_000 } : walletSkip
  )

  // ── Phase 4: Token commands (Ethereum wallet) ────────────────────
  console.log('\n═══ Token commands (Ethereum) ═══')

  let ethWalletId = ''
  const ethResult = test(
    'wallet-create (ethereum)',
    `${AUTH} wallet-create wallet:ethereum "ETH Test"`,
    {
      timeoutMs: 120_000,
      validate: out => {
        assert(out.includes('walletId'), 'Missing walletId')
      }
    }
  )
  if (ethResult.status === 'PASS') {
    const m = /"walletId":\s*"([^"]+)"/.exec(ethResult.output)
    if (m != null) ethWalletId = m[1]
  }

  const hasEth = ethWalletId !== ''
  const ethSkip = { skip: true, skipReason: 'No ETH wallet' } as const

  test(
    'token-list (ETH)',
    hasEth ? `${AUTH} token-list ${ethWalletId}` : '',
    hasEth
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(
              out.includes('totalTokens') || out.includes('tokens'),
              'Should list tokens'
            )
          }
        }
      : ethSkip
  )

  // USDC contract address on mainnet (lowercase)
  test(
    'token-enable (USDC)',
    hasEth
      ? `${AUTH} token-enable ${ethWalletId} a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
      : '',
    hasEth ? { timeoutMs: 60_000 } : ethSkip
  )

  test(
    'token-disable (USDC)',
    hasEth
      ? `${AUTH} token-disable ${ethWalletId} a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
      : '',
    hasEth ? { timeoutMs: 60_000 } : ethSkip
  )

  test(
    'token-detected (ETH)',
    hasEth ? `${AUTH} token-detected ${ethWalletId}` : '',
    hasEth ? { timeoutMs: 60_000 } : ethSkip
  )

  // ── Phase 5: Data store ──────────────────────────────────────────
  console.log('\n═══ Data store ═══')

  test(
    'data-store-set',
    `${AUTH} data-store-set cli-test item1 "hello world"`,
    { timeoutMs: 60_000 }
  )
  test('data-store-list (stores)', `${AUTH} data-store-list`, {
    timeoutMs: 60_000,
    validate: out => {
      assert(
        out.includes('cli-test') || out.includes('['),
        'Should list stores'
      )
    }
  })
  test('data-store-list (items)', `${AUTH} data-store-list cli-test`, {
    timeoutMs: 60_000,
    validate: out => {
      assert(out.includes('item1') || out.includes('['), 'Should list items')
    }
  })
  test('data-store-get', `${AUTH} data-store-get cli-test item1`, {
    timeoutMs: 60_000,
    validate: out => {
      assert(out.includes('hello world'), 'Should return stored value')
    }
  })
  test('data-store-delete (item)', `${AUTH} data-store-delete cli-test item1`, {
    timeoutMs: 60_000
  })
  test('data-store-delete (store)', `${AUTH} data-store-delete cli-test`, {
    timeoutMs: 60_000
  })

  // ── Phase 6: OTP ─────────────────────────────────────────────────
  console.log('\n═══ OTP ═══')

  test('otp-status', `${AUTH} otp-status`, {
    timeoutMs: 60_000,
    validate: out => {
      assert(
        out.includes('OTP enabled') || out.includes('OTP disabled'),
        'Should show OTP status'
      )
    }
  })
  test('otp-enable', `${AUTH} otp-enable`, { timeoutMs: 60_000 })
  test('otp-status (after enable)', `${AUTH} otp-status`, {
    timeoutMs: 60_000,
    validate: out => {
      assert(out.includes('OTP enabled'), 'OTP should be enabled')
    }
  })
  test('otp-disable', `${AUTH} otp-disable`, { timeoutMs: 60_000 })

  // ── Phase 7: PIN ─────────────────────────────────────────────────
  console.log('\n═══ PIN ═══')
  test('pin-setup', `${AUTH} pin-setup 5566`, { timeoutMs: 60_000 })
  test('pin-delete', `${AUTH} pin-delete`, { timeoutMs: 60_000 })

  // ── Phase 8: Password ────────────────────────────────────────────
  console.log('\n═══ Password ═══')
  const newPass = `NewPass!${RUN_ID}9876`
  test('password-setup', `${AUTH} password-setup ${newPass}`, {
    timeoutMs: 60_000
  })
  test(
    'password-login (new pass)',
    `${BASE} -u ${TEST_USER} -p ${newPass} password-login ${TEST_USER} ${newPass}`,
    { timeoutMs: 60_000 }
  )
  test(
    'password-setup (revert)',
    `${BASE} -u ${TEST_USER} -p ${newPass} password-setup ${TEST_PASS}`,
    { timeoutMs: 60_000 }
  )

  // ── Phase 9: Recovery ────────────────────────────────────────────
  console.log('\n═══ Recovery ═══')
  let recoveryKey = ''
  const recResult = test(
    'recovery2-setup',
    `${AUTH} recovery2-setup "What is your pet?" "Fluffy" "Favorite color?" "Blue"`,
    {
      timeoutMs: 60_000,
      validate: out => {
        assert(out.includes('Recovery key'), 'Should return recovery key')
      }
    }
  )
  if (recResult.status === 'PASS') {
    const m = /Recovery key:\s*(\S+)/.exec(recResult.output)
    if (m != null) recoveryKey = m[1]
  }
  const hasRecovery = recoveryKey !== ''
  const recSkip = { skip: true, skipReason: 'No recovery key' } as const

  test(
    'recovery2-questions',
    hasRecovery
      ? `${BASE} recovery2-questions ${recoveryKey} ${TEST_USER}`
      : '',
    hasRecovery
      ? {
          timeoutMs: 60_000,
          validate: out => {
            assert(
              out.includes('pet') || out.includes('color'),
              'Should show questions'
            )
          }
        }
      : recSkip
  )
  test(
    'recovery2-login',
    hasRecovery
      ? `${BASE} recovery2-login ${recoveryKey} ${TEST_USER} Fluffy Blue`
      : '',
    hasRecovery ? { timeoutMs: 60_000 } : recSkip
  )

  // ── Phase 10: Lobby ──────────────────────────────────────────────
  console.log('\n═══ Lobby (limited) ═══')
  test(
    'admin-lobby-fetch (invalid)',
    `${BASE} admin-lobby-fetch 000000000000`,
    {
      expectFail: true
    }
  )
  test('edge-login', '', {
    skip: true,
    skipReason: 'Requires QR scan from phone'
  })
  test('lobby-create', '', {
    skip: true,
    skipReason: 'Blocks waiting for reply'
  })
  test('admin-lobby-reply', '', {
    skip: true,
    skipReason: 'Needs active lobby'
  })
  test('lobby-login-fetch', '', {
    skip: true,
    skipReason: 'Needs active lobby'
  })
  test('lobby-login-approve', '', {
    skip: true,
    skipReason: 'Needs active lobby'
  })

  // ── Phase 11: Repo ───────────────────────────────────────────────
  console.log('\n═══ Repo ═══')
  test(
    'admin-repo-sync (invalid key)',
    `${BASE} admin-repo-sync ${'00'.repeat(32)}`,
    {
      expectFail: true
    }
  )

  // ── Phase 12: Spend (dry-run only) ───────────────────────────────
  console.log('\n═══ Spend --dry-run ═══')
  if (hasWallet) {
    test(
      'spend --dry-run (InsufficientFundsError)',
      `${AUTH} spend ${btcWalletId} tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx 0.0001 dry-run`,
      {
        timeoutMs: 120_000,
        expectFail: true // No funds — InsufficientFundsError is expected
      }
    )
    test(
      'spend-max --dry-run (zero balance)',
      `${AUTH} spend-max ${btcWalletId} tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx dry-run`,
      {
        timeoutMs: 120_000
      }
    )
    test(
      'max-spendable',
      `${AUTH} max-spendable ${btcWalletId} tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx`,
      {
        timeoutMs: 120_000,
        validate: out => {
          assert(
            out.includes('maxNativeAmount') || out.includes('0'),
            'Should show max spendable'
          )
        }
      }
    )
  } else {
    test('spend --dry-run', '', { skip: true, skipReason: 'No wallet ID' })
    test('spend-max --dry-run', '', { skip: true, skipReason: 'No wallet ID' })
    test('max-spendable', '', { skip: true, skipReason: 'No wallet ID' })
  }
  test('spend (real)', '', {
    skip: true,
    skipReason: 'Skipped: would send real money'
  })
  test('spend-max (real)', '', {
    skip: true,
    skipReason: 'Skipped: would send real money'
  })

  // ── Phase 13: Usage / error handling ─────────────────────────────
  console.log('\n═══ Usage / error handling ═══')
  test('no-such-command', `${BASE} this-command-does-not-exist`, {
    expectFail: true
  })
  test('wallet-create (missing args)', `${AUTH} wallet-create`, {
    expectFail: true
  })
  test('balance (missing args)', `${AUTH} balance`, { expectFail: true })
  test('spend (missing args)', `${AUTH} spend`, { expectFail: true })

  // ── Phase 14: Logout & cleanup ───────────────────────────────────
  console.log('\n═══ Logout & cleanup ═══')
  test('logout', `${AUTH} logout`, { timeoutMs: 60_000 })
  test('username-delete', `${BASE} username-delete ${TEST_USER}`, {
    timeoutMs: 60_000
  })

  // ── Report ───────────────────────────────────────────────────────
  const pass = results.filter(r => r.status === 'PASS')
  const fail = results.filter(r => r.status === 'FAIL')
  const skip = results.filter(r => r.status === 'SKIP')

  console.log('\n')
  console.log(
    '╔══════════════════════════════════════════════════════════════════╗'
  )
  console.log(
    '║                      CLI E2E TEST REPORT                        ║'
  )
  console.log(
    '╠══════════════════════════════════════════════════════════════════╣'
  )
  console.log(
    `║  Total: ${String(results.length).padEnd(4)} │  Pass: ${String(
      pass.length
    ).padEnd(4)} │  Fail: ${String(fail.length).padEnd(4)} │  Skip: ${String(
      skip.length
    ).padEnd(4)}  ║`
  )
  console.log(
    '╠══════════════════════════════════════════════════════════════════╣'
  )

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✓' : r.status === 'FAIL' ? '✗' : '○'
    const dur = r.durationMs > 0 ? `${(r.durationMs / 1000).toFixed(1)}s` : '-'
    const line = `${icon} ${r.status.padEnd(5)} ${r.command.padEnd(
      42
    )} ${dur.padStart(6)}`
    console.log(`║ ${line.padEnd(64)} ║`)
    if (r.error != null) {
      const errLine = `       ${r.error.split('\n')[0].slice(0, 56)}`
      console.log(`║ ${errLine.padEnd(64)} ║`)
    }
  }

  console.log(
    '╚══════════════════════════════════════════════════════════════════╝'
  )

  if (fail.length > 0) {
    console.log('\n── FAILED COMMANDS ──')
    for (const r of fail) {
      console.log(`\n  ${r.command}`)
      console.log(`    Error: ${r.error}`)
    }
  }

  console.log(`\nTest account: ${TEST_USER} (tester servers)`)
  console.log(`Run ID: ${RUN_ID}`)

  process.exit(fail.length > 0 ? 1 : 0)
}

main().catch((error: unknown) => {
  console.error('Test runner error:', error)
  process.exit(2)
})
