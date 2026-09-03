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
  // `"error": null` is an ordinary field on a pending login, not a failure.
  const good = run.status === 0 && !/"error":\s*\{/.test(run.out)
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

/** Assert something about a response the CLI already returned. */
function check(label: string, good: boolean, detail: string): void {
  if (good) {
    passes++
    console.log(`OK   ${label}`)
  } else {
    failures++
    console.error(
      `FAIL ${label} — ${detail.replace(/\s+/g, ' ').slice(0, 200)}`
    )
  }
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
    ok('local-settings read', 'local-settings')
    ok('local-settings write', 'local-settings', '--spam-filter-on=true')
    ok('help', 'help', 'balance-map')

    // ------------------------------------------------------ credentials
    ok('check-password', 'check-password', `--password=${PASS}`)
    ok('get-pin', 'get-pin')
    ok('check-pin', 'check-pin', `--pin=${PIN}`)
    ok('change-pin', 'change-pin', '--pin=2222')
    ok('check-pin after change', 'check-pin', '--pin=2222')
    // Every login method, each exercised while its credential still exists.
    const key = ok('get-login-key for re-login', 'get-login-key')
    ok('logout before login-with-key', 'logout')
    ok(
      'login-with-key',
      'login-with-key',
      `--username-or-login-id=${USER}`,
      `--login-key=${String(key.json?.loginKey ?? '')}`
    )
    ok('logout before login-with-pin', 'logout')
    ok(
      'login-with-pin',
      'login-with-pin',
      `--username-or-login-id=${USER}`,
      '--pin=2222'
    )
    ok('delete-pin', 'delete-pin')
    ok('change-password', 'change-password', '--password=Zq7WmT4rNs2xVb9d')
    const rec = ok(
      'change-recovery',
      'change-recovery',
      '--question=First pet?',
      '--answer=rex',
      '--question=First street?',
      '--answer=oak'
    )
    ok(
      'fetch-recovery-questions',
      'fetch-recovery-questions',
      `--recovery-key=${String(rec.json?.recoveryKey ?? '')}`,
      `--username=${USER}`
    )
    ok('logout before login-with-recovery', 'logout')
    ok(
      'login-with-recovery',
      'login-with-recovery',
      `--username=${USER}`,
      `--recovery-key=${String(rec.json?.recoveryKey ?? '')}`,
      '--answer=rex',
      '--answer=oak'
    )
    ok('delete-recovery', 'delete-recovery')

    // -------------------------------------------------------------- otp
    ok('otp-key before enabling', 'otp-key')
    ok('enable-otp', 'enable-otp')
    const otpKey = ok('otp-key', 'otp-key')
    ok(
      'repair-otp',
      'repair-otp',
      `--otp-key=${String(otpKey.json?.otpKey ?? '')}`
    )
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
    // `--remove` of a token that is not enabled leaves the set as it is,
    // which exercises the read-modify-write path without needing a token.
    ok(
      'change-enabled-token-ids',
      'change-enabled-token-ids',
      w,
      '--remove=notatoken'
    )
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

    // ------------------------------------------------- local / no server
    ok('currency-configs', 'currency-configs')
    ok('admin-hash-username', 'admin-hash-username', `--username=${USER}`)
    ok('create-wallet', 'create-wallet', '--type=wallet:bitcoin')
    ok(
      'create-currency-wallets',
      'create-currency-wallets',
      '--create-wallets=[{"walletType":"wallet:bitcoin","name":"Batch"}]'
    )
    ok('split', 'split', w, '--split-wallets=[]')

    // ---------------------------------------------------- wallet sharing
    // Two accounts in one fake world: the lobby lives on the fake login
    // server, so both sides have to be talking to the same one. The CLI
    // persists a single session, so each command names the account it acts
    // as with `--session`.
    const sessionA: string = cli('account-info').json?.sessionId ?? ''
    const shareUser = `${USER}share`
    const madeB = ok(
      'create-account (share recipient)',
      'create-account',
      `--username=${shareUser}`,
      `--password=${PASS}`,
      `--pin=${PIN}`
    )
    const sessionB: string = madeB.json?.sessionId ?? ''
    const asA = `--session=${sessionA}`
    const asB = `--session=${sessionB}`

    // Flow 1: the recipient publishes a link, the sharer answers it.
    const request = ok(
      'request-wallet-share',
      asB,
      'request-wallet-share',
      '--display-name=Bob'
    )
    const requestLobby: string = request.json?.lobbyId ?? ''
    const requestShareId: string = request.json?.shareId ?? ''
    if (
      !/^https:\/\/deep\.edge\.app\/request-wallets\/[^?]+\?name=Bob$/.test(
        request.json?.uri ?? ''
      )
    ) {
      failures++
      console.error(
        `FAIL request-wallet-share uri — expected a deep.edge.app link naming Bob, got ${String(
          request.json?.uri
        )}`
      )
    } else {
      passes++
      console.log('OK   request-wallet-share uri names the asker')
    }

    ok(
      'approve-wallet-share',
      asA,
      'approve-wallet-share',
      requestLobby,
      `--wallets=[{"walletId":"${walletId}","mode":"viewOnly"}]`,
      '--display-name=Alice',
      '--counterparty-name=Bob'
    )
    let polled = ok(
      'poll-wallet-share',
      asB,
      'poll-wallet-share',
      requestShareId
    )
    for (let i = 0; i < 20 && polled.json?.state !== 'done'; i++) {
      spawnSync('sleep', ['1'])
      polled = cli(asB, 'poll-wallet-share', requestShareId)
    }
    if (polled.json?.state === 'done') {
      passes++
      console.log('OK   poll-wallet-share reached done')
    } else {
      failures++
      console.error(
        `FAIL poll-wallet-share — expected state done, got ${String(
          polled.json?.state
        )}`
      )
    }

    // The recipient learns who sent the wallets, and the wallet arrives
    // view-only with the exchange recorded against it:
    check(
      'poll-wallet-share names the sharer',
      polled.json?.counterpartyName === 'Alice',
      String(polled.json?.counterpartyName)
    )
    const sharedWallet =
      cli(asB, 'wallet-info', `--wallet-id=${walletId}`).json ?? {}
    check(
      'shared wallet is viewOnly',
      sharedWallet.viewOnly === true && sharedWallet.canSign === false,
      `viewOnly=${String(sharedWallet.viewOnly)} canSign=${String(
        sharedWallet.canSign
      )}`
    )
    const sharedFrom = sharedWallet.sharingState?.sharedFrom ?? []
    check(
      'recipient recorded who shared it',
      sharedFrom.length === 1 &&
        sharedFrom[0].name === 'Alice' &&
        sharedFrom[0].shareType === 'viewOnly' &&
        !Number.isNaN(Date.parse(String(sharedFrom[0].sharingDate))),
      JSON.stringify({ sharedFrom, sharingState: sharedWallet.sharingState })
    )
    const sharerWallet =
      cli(asA, 'wallet-info', `--wallet-id=${walletId}`).json ?? {}
    const sharedWith = sharerWallet.sharingState?.sharedWith ?? []
    check(
      'sharer recorded who received it',
      sharedWith.length === 1 &&
        sharedWith[0].name === 'Bob' &&
        sharedWith[0].shareType === 'viewOnly',
      JSON.stringify(sharedWith)
    )
    check(
      'sharer wallet is not viewOnly',
      sharerWallet.viewOnly === false && sharerWallet.canSign === true,
      JSON.stringify({
        viewOnly: sharerWallet.viewOnly,
        canSign: sharerWallet.canSign,
        id: sharerWallet.walletId,
        name: sharerWallet.name
      })
    )

    // Flow 2: the sharer publishes a link, the recipient answers it. This is
    // the two-lobby handshake, so it proves the second lobby round trips.
    const offer = ok(
      'offer-wallet-share',
      asA,
      'offer-wallet-share',
      `--wallets=[{"walletId":"${walletId}","mode":"spend"}]`,
      '--display-name=Alice'
    )
    check(
      'offer-wallet-share uri names the offerer',
      /^https:\/\/deep\.edge\.app\/share-wallets\/[^?]+\?name=Alice$/.test(
        offer.json?.uri ?? ''
      ),
      String(offer.json?.uri)
    )
    ok(
      'accept-wallet-share',
      asB,
      'accept-wallet-share',
      offer.json?.lobbyId ?? '',
      '--display-name=Bob',
      '--counterparty-name=Alice'
    )

    // The spend share upgrades the wallet the recipient held view-only:
    let upgraded = cli(asB, 'wallet-info', `--wallet-id=${walletId}`).json ?? {}
    for (let i = 0; i < 20 && upgraded.viewOnly !== false; i++) {
      spawnSync('sleep', ['1'])
      upgraded = cli(asB, 'wallet-info', `--wallet-id=${walletId}`).json ?? {}
    }
    check(
      'spend share upgrades a viewOnly wallet',
      upgraded.viewOnly === false && upgraded.canSign === true,
      `viewOnly=${String(upgraded.viewOnly)}`
    )
    check(
      'the second share earns its own audit entry',
      (upgraded.sharingState?.sharedFrom ?? []).length === 2,
      JSON.stringify(upgraded.sharingState?.sharedFrom)
    )

    // Cancelling closes a lobby that was published by mistake.
    const doomed = ok(
      'request-wallet-share (to cancel)',
      asB,
      'request-wallet-share'
    )
    check(
      'a nameless request publishes a bare link',
      /^https:\/\/deep\.edge\.app\/request-wallets\/[^?]+$/.test(
        doomed.json?.uri ?? ''
      ),
      String(doomed.json?.uri)
    )
    ok(
      'cancel-wallet-share',
      asB,
      'cancel-wallet-share',
      doomed.json?.shareId ?? ''
    )

    // Creating the recipient persisted its session. Everything after this
    // acts on the sharer's wallet, so put that session back.
    ok(
      'login-with-password (back as the sharer)',
      'login-with-password',
      `--username=${USER}`,
      '--password=Zq7WmT4rNs2xVb9d'
    )
    ok('resync-blockchain', 'resync-blockchain', w)
    // No transaction exists to annotate, and saying so proves the path runs.
    refuses(
      'save-tx-metadata for an unknown txid',
      'missing tx',
      'save-tx-metadata',
      w,
      '--txid=deadbeef',
      '--token-id=null',
      '--metadata={"name":"x"}'
    )
    refuses(
      'save-tx-action for an unknown txid',
      'missing tx',
      'save-tx-action',
      w,
      '--txid=deadbeef',
      '--token-id=null',
      '--saved-action={"actionType":"swap"}'
    )

    // ------------------------------------------------------ login server
    ok('fetch-login-messages', 'fetch-login-messages')
    notInFakeWorld('fetch-challenge', 'Unknown API endpoint', 'fetch-challenge')
    ok(
      'change-username',
      'change-username',
      `--username=${USER}b`,
      '--password=Zq7WmT4rNs2xVb9d'
    )
    // 2FA was disabled above, so refusing is the correct answer.
    refuses('cancel-otp-reset with 2FA off', 'not enabled', 'cancel-otp-reset')

    // ------------------------------------------------- object handles
    const pending = ok('request-edge-login', 'request-edge-login', '--no-wait')
    const pendingId: string = pending.json?.pendingId ?? ''
    const lobbyId: string = pending.json?.lobbyId ?? ''
    ok('poll-edge-login', 'poll-edge-login', pendingId)
    ok('object-get', 'object-get', pendingId)
    ok('fetch-lobby', 'fetch-lobby', lobbyId)
    ok('approve-login-request', 'approve-login-request', lobbyId)
    ok('cancel-request', 'cancel-request', pendingId)

    // ------------------------------------------------------------ admin
    const lobby = ok('admin-make-lobby', 'admin-make-lobby')
    const handle: string = lobby.json?.objectId ?? ''
    ok(
      'admin-fetch-lobby-request',
      'admin-fetch-lobby-request',
      lobby.json?.lobbyId ?? ''
    )
    ok('admin-lobby-handle-delete', 'admin-lobby-handle-delete', handle)

    // ------------------------------------------------- refusals that prove
    // the path runs even though the fake world cannot fund a wallet
    ok(
      'get-max-spendable',
      'get-max-spendable',
      w,
      '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7'
    )
    refuses(
      'sign-tx with an unknown handle',
      'OBJECT_NOT_FOUND',
      'sign-tx',
      'tx_nosuchhandle'
    )
    refuses(
      'broadcast-tx with an unknown handle',
      'OBJECT_NOT_FOUND',
      'broadcast-tx',
      'tx_nosuchhandle'
    )
    refuses(
      'save-tx with an unknown handle',
      'OBJECT_NOT_FOUND',
      'save-tx',
      'tx_nosuchhandle'
    )
    refuses(
      'object-delete with an unknown handle',
      'OBJECT_NOT_FOUND',
      'object-delete',
      'tx_nosuchhandle'
    )
    refuses(
      'swap-quote-get with an unknown handle',
      'OBJECT_NOT_FOUND',
      'swap-quote-get',
      'swap_nosuchhandle'
    )

    // --------------------------------------------------- signing / admin
    const addr = ok(
      'get-addresses for signing',
      'get-addresses',
      w,
      '--token-id=null'
    )
    const publicAddress: string = addr.json?.addresses?.[0]?.publicAddress ?? ''
    ok(
      'sign-bytes',
      'sign-bytes',
      w,
      '--bytes=aGVsbG8=',
      `--other-params={"publicAddress":"${publicAddress}"}`
    )
    ok(
      'admin-auth-request',
      'admin-auth-request',
      '--method=POST',
      '--path=/v2/messages',
      '--body={"loginIds":[]}'
    )

    // These need state the fake world cannot produce, so the refusal is what
    // proves the route runs at all.
    // Core accepts any voucher id without complaint, so success here is the
    // engine reporting core faithfully, not the voucher having existed.
    ok('approve-voucher', 'approve-voucher', '--voucher-id=nosuchvoucher')
    ok('reject-voucher', 'reject-voucher', '--voucher-id=nosuchvoucher')
    refuses(
      'request-otp-reset with a bad token',
      'error',
      'request-otp-reset',
      `--username=${USER}b`,
      '--otp-reset-token=nosuchtoken'
    )
    refuses(
      'admin-repo-get with a bad key',
      'error',
      'admin-repo-get',
      '--sync-key=11111111111111111111',
      '--data-key=11111111111111111111',
      '--path=x'
    )
    refuses(
      'admin-repo-list with a bad key',
      'error',
      'admin-repo-list',
      '--sync-key=11111111111111111111',
      '--data-key=11111111111111111111'
    )
    refuses(
      'admin-repo-set with a bad key',
      'error',
      'admin-repo-set',
      '--sync-key=11111111111111111111',
      '--data-key=11111111111111111111',
      '--path=x',
      '--text=y'
    )
    refuses(
      'admin-repo-delete with a bad key',
      'error',
      'admin-repo-delete',
      '--sync-key=11111111111111111111',
      '--data-key=11111111111111111111',
      '--path=x'
    )
    refuses(
      'admin-sync-repo with a bad key',
      'error',
      'admin-sync-repo',
      '--sync-key=11111111111111111111'
    )
    refuses(
      'admin-send-lobby-reply to an unknown lobby',
      'error',
      'admin-send-lobby-reply',
      '--lobby-id=nosuchlobby',
      '--reply={}'
    )
    refuses(
      'spend on an empty wallet',
      'error',
      'spend',
      w,
      '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7',
      '--native-amount=100000'
    )
    refuses(
      'spend-max on an empty wallet',
      'error',
      'spend-max',
      w,
      '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7'
    )
    refuses(
      'sweep-private-keys with no funds',
      'error',
      'sweep-private-keys',
      w,
      '--spend-info={"tokenId":null,"privateKeys":["x"]}'
    )
    refuses(
      'accelerate an unknown transaction',
      'error',
      'accelerate',
      w,
      '--object-id=tx_nosuchhandle'
    )

    // Rates, swap quotes and payment requests reach third-party APIs over the
    // real internet, which the fake world does not intercept. They belong to
    // `npm run test:cli:network`, not to a hook that must work offline.
    refuses(
      'approve-swap-quote with an unknown handle',
      'OBJECT_NOT_FOUND',
      'approve-swap-quote',
      'swap_nosuchhandle'
    )
    refuses(
      'close-swap-quote with an unknown handle',
      'OBJECT_NOT_FOUND',
      'close-swap-quote',
      'swap_nosuchhandle'
    )

    // ------------------------------------------------------------- login
    ok('logout', 'logout')
    ok(
      'login-with-password',
      'login-with-password',
      `--username=${USER}b`,
      '--password=Zq7WmT4rNs2xVb9d'
    )
    ok('username-available', 'username-available', `--username=${USER}nobody`)
    // Core refuses while the account is open, which is the interesting half
    // of the contract; forgetting it for real would end the session the rest
    // of this suite still needs.
    refuses(
      'forget-account while logged in',
      'Cannot remove logged-in user',
      'forget-account',
      `--root-login-id=${USER}b`
    )

    // Last, because it leaves the account with no password to log in with.
    ok('delete-password', 'delete-password')

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
