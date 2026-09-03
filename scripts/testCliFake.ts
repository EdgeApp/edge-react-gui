/**
 * Exercise the CLI against the in-process fake world.
 *
 * `makeFakeEdgeWorld` emulates the login, info and sync servers and cuts the
 * currency plugins off from the network, so every account-shaped command runs
 * with no server, no API key and no internet. That is what lets these run in a
 * pre-commit hook, where `testCli.ts` and friends cannot: they need
 * login-tester.
 *
 * Responses are checked against each route's `returns` cleaner in strict mode,
 * so a shape that drifts from the reference fails here.
 *
 *   node -r sucrase/register scripts/testCliFake.ts
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = path.join(os.tmpdir(), `edge-cli-fake-${process.pid}`)
const CLI = ['-r', 'sucrase/register', 'src/cli/index.ts']
const BASE = ['--fake', `--directory=${DIR}`]

const USER = `faker${process.pid}`
const PASS = 'y768Mv4PLFupQjMu'
const PIN = '1111'

let failures = 0
let passes = 0

interface Run {
  status: number
  out: string
  json: any
}

function cli(...args: string[]): Run {
  const result = spawnSync('node', [...CLI, ...BASE, ...args], {
    encoding: 'utf8',
    env: { ...process.env, EDGE_CLI_CHECK_RESPONSES: 'strict' }
  })
  const out = (result.stdout ?? '') + (result.stderr ?? '')
  let json: any
  try {
    json = JSON.parse(result.stdout ?? '')
  } catch {
    json = undefined
  }
  return { status: result.status ?? -1, out, json }
}

/** Run a command and require it to succeed. */
function ok(label: string, ...args: string[]): Run {
  const run = cli(...args)
  const good = run.status === 0 && !run.out.includes('"error"')
  if (good) {
    passes++
    console.log(`OK   ${label}`)
  } else {
    failures++
    console.error(
      `FAIL ${label} — ${run.out.replace(/\s+/g, ' ').slice(0, 160)}`
    )
  }
  return run
}

/** Run a command that is expected to fail, and say why that is correct. */
function refuses(label: string, code: string, ...args: string[]): void {
  const run = cli(...args)
  if (run.status !== 0 && run.out.includes(code)) {
    passes++
    console.log(`OK   ${label} (refused with ${code})`)
  } else {
    failures++
    console.error(
      `FAIL ${label} — expected ${code}, got ${run.out
        .replace(/\s+/g, ' ')
        .slice(0, 140)}`
    )
  }
}

/**
 * A command the fake world cannot serve.
 *
 * Asserted rather than skipped, so that if `makeFakeEdgeWorld` ever grows the
 * missing piece this fails and the check gets promoted to a real one.
 */
function notInFakeWorld(
  label: string,
  marker: string,
  ...args: string[]
): void {
  const run = cli(...args)
  if (run.status !== 0 && run.out.includes(marker)) {
    passes++
    console.log(`OK   ${label} (fake world cannot serve it yet)`)
  } else {
    failures++
    console.error(
      `FAIL ${label} — expected the fake world to reject with "${marker}"; ` +
        `promote this to a real check. Got: ${run.out
          .replace(/\s+/g, ' ')
          .slice(0, 140)}`
    )
  }
}

function main(): void {
  fs.mkdirSync(DIR, { recursive: true })
  try {
    ok('engine-status', 'engine-status')
    ok('engine-config', 'engine-config')
    ok('engine-sessions', 'engine-sessions')
    ok('check-password-rules', 'check-password-rules', `--password=${PASS}`)
    ok('fix-username', 'fix-username', '--username=Mixed Case')

    // ---------------------------------------------------------- account
    ok(
      'create-account',
      'create-account',
      `--username=${USER}`,
      `--password=${PASS}`,
      `--pin=${PIN}`
    )
    ok('account-info', 'account-info')
    ok('local-users', 'local-users')
    ok('get-login-key', 'get-login-key')
    ok('touch', 'touch')
    ok('sync', 'sync')
    ok('wait-for-all-wallets', 'wait-for-all-wallets')
    ok('pending-vouchers', 'pending-vouchers')

    // ------------------------------------------------------ credentials
    ok('check-password', 'check-password', `--password=${PASS}`)
    ok('get-pin', 'get-pin')
    ok('check-pin', 'check-pin', `--pin=${PIN}`)
    ok('change-pin', 'change-pin', '--pin=2222')
    ok('check-pin after change', 'check-pin', '--pin=2222')
    ok('delete-pin', 'delete-pin')
    ok('change-password', 'change-password', '--password=Zq7WmT4rNs2xVb9d')
    ok(
      'change-recovery',
      'change-recovery',
      '--question=First pet?',
      '--answer=rex',
      '--question=First street?',
      '--answer=oak'
    )
    ok('delete-recovery', 'delete-recovery')

    // -------------------------------------------------------------- otp
    ok('otp-key', 'otp-key')
    ok('enable-otp', 'enable-otp')
    ok('disable-otp', 'disable-otp')

    // -------------------------------------------------------- data store
    ok('set-item', 'set-item', '--store-id=probe', '--item-id=a', '--value=1')
    ok('list-store-ids', 'list-store-ids')
    ok('list-item-ids', 'list-item-ids', '--store-id=probe')
    ok('get-item', 'get-item', '--store-id=probe', '--item-id=a')
    ok('delete-item', 'delete-item', '--store-id=probe', '--item-id=a')
    ok('delete-store', 'delete-store', '--store-id=probe')

    // ----------------------------------------------------------- wallets
    const made = ok(
      'create-currency-wallet',
      'create-currency-wallet',
      '--wallet-type=wallet:bitcoin',
      '--name=Fake BTC'
    )
    const walletId: string = made.json?.walletId ?? ''
    const w = `--wallet-id=${walletId}`

    ok('currency-wallets', 'currency-wallets')
    ok('wallet-info', 'wallet-info', w)
    ok('all-keys', 'all-keys')
    ok('get-wallet-info', 'get-wallet-info', `--id=${walletId}`)
    ok('get-raw-public-key', 'get-raw-public-key', w)
    ok('get-raw-private-key', 'get-raw-private-key', w)
    ok('get-display-public-key', 'get-display-public-key', w)
    ok('get-display-private-key', 'get-display-private-key', w)
    ok('list-splittable-wallet-types', 'list-splittable-wallet-types', w)
    ok('rename-wallet', 'rename-wallet', w, '--name=Renamed')
    ok(
      'set-fiat-currency-code',
      'set-fiat-currency-code',
      w,
      '--fiat-currency-code=iso:EUR'
    )
    ok('change-paused on', 'change-paused', w, '--paused=true')
    ok('change-paused off', 'change-paused', w, '--paused=false')
    ok('change-wallet-states', 'change-wallet-states', w, '--archived=true')
    ok(
      'change-wallet-states off',
      'change-wallet-states',
      w,
      '--archived=false'
    )
    // The fake world emulates the sync server for account repos, but a wallet
    // repo still resolves to a real sync-fakeN.edge.app hostname.
    notInFakeWorld('wallet-sync', 'sync-fake', 'wallet-sync', w)
    ok('dump-data', 'dump-data', w)
    ok('balance-map', 'balance-map', w)
    ok('get-addresses', 'get-addresses', w)
    ok('wallet-tokens', 'wallet-tokens', w)
    ok('get-num-transactions', 'get-num-transactions', w)
    ok('get-transactions', 'get-transactions', w)
    ok(
      'encode-uri',
      'encode-uri',
      w,
      '--public-address=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7'
    )
    ok(
      'parse-uri',
      'parse-uri',
      w,
      '--uri=bitcoin:bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7?amount=0.001'
    )

    // An empty wallet cannot fund a spend, and saying so is the correct
    // answer — it proves the spend path runs, not just that it errors.
    refuses(
      'make-spend on an empty wallet',
      'INSUFFICIENT_FUNDS',
      'make-spend',
      w,
      '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7',
      '--native-amount=100000'
    )

    // ------------------------------------------------------------- login
    ok('logout', 'logout')
    ok(
      'login-with-password',
      'login-with-password',
      `--username=${USER}`,
      '--password=Zq7WmT4rNs2xVb9d'
    )
    ok('username-available', 'username-available', `--username=${USER}nobody`)

    // ---------------------------------------------------------- teardown
    // The fake login server implements no /api/v2/login/delete.
    notInFakeWorld(
      'delete-remote-account',
      'Unknown API endpoint',
      'delete-remote-account',
      '--yes'
    )
    ok('engine-stop', 'engine-stop')
  } finally {
    cli('engine-stop')
    fs.rmSync(DIR, { recursive: true, force: true })
  }

  console.log(`\ntestCliFake: ${passes} passed, ${failures} failed`)
  if (failures > 0) process.exit(1)
}

main()
