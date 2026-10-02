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

import { CLI, runRoot } from './util/cliHarness'

const DIR = path.join(os.tmpdir(), `edge-cli-fake-${process.pid}`)
const BASE = ['--fake', `--directory=${DIR}`]

const USER = `faker${process.pid}`
const PASS = 'y768Mv4PLFupQjMu'
const PIN = '1111'

let failures = 0
/** The engine's own run directory, so the leak check cannot drift. */
let runProfileDir: string | null = null
let passes = 0

interface Run {
  status: number
  out: string
  json: any
}

/**
 * The first JSON object in a stream, ignoring anything after it.
 *
 * Brace-counted rather than regexed, because the envelope is pretty-printed
 * and its `details` nest.
 */
function parseLeadingJson(text: string | undefined): any {
  if (text == null) return undefined
  const start = text.indexOf('{')
  if (!text.includes('{')) return undefined
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1))
        } catch {
          return undefined
        }
      }
    }
  }
  return undefined
}

function cli(...args: string[]): Run {
  const result = spawnSync('node', [...CLI, ...BASE, ...args], {
    encoding: 'utf8',
    env: { ...process.env, EDGE_CLI_CHECK_RESPONSES: 'strict' }
  })
  const out = (result.stdout ?? '') + (result.stderr ?? '')
  // Both streams, and the leading object when a stream carries more than
  // JSON: a result is printed to stdout and an error envelope to stderr, and
  // a client-side usage failure prints the envelope *followed by* a usage
  // line. Parsing only `stdout` whole left `run.json` undefined for every
  // failure — exactly when a check wants to read `error.code`.
  let json: any
  for (const text of [result.stdout, result.stderr]) {
    json = parseLeadingJson(text)
    if (json !== undefined) break
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

/**
 * Run a command that is expected to fail, and say why that is correct.
 *
 * The code is compared against the envelope's own `error.code`, not matched
 * as a substring of stdout+stderr: a substring match passed whenever the
 * code appeared anywhere, including inside a *message*, and eleven cases
 * asserted the literal `'error'`, which every envelope contains — so they
 * pinned "the command failed" and nothing else, and a regression from
 * `INSUFFICIENT_FUNDS`/422 to `INTERNAL_ERROR`/500 kept the suite green.
 */
function refuses(label: string, code: string, ...args: string[]): void {
  refusesInner(label, code, undefined, args)
}

/**
 * As `refuses`, for a failure whose code is `INTERNAL_ERROR`.
 *
 * Those are plain `Error`s from core or a plugin that `mapCoreError` has no
 * arm for, so the code alone pins nothing: the message is the only thing
 * saying *which* failure this is. Asserting both keeps the case honest
 * without pretending the engine answers something it does not.
 */
function refusesInternal(
  label: string,
  message: string,
  ...args: string[]
): void {
  refusesInner(label, 'INTERNAL_ERROR', message, args)
}

function refusesInner(
  label: string,
  code: string,
  message: string | undefined,
  args: string[]
): void {
  if (code === 'error' || code === '') {
    failures++
    console.error(
      `FAIL ${label} — "${code}" is not an error code; name the real one`
    )
    return
  }
  const run = cli(...args)
  const actual = run.json?.error?.code
  const actualMessage = String(run.json?.error?.message ?? '')
  const messageOk = message == null || actualMessage.includes(message)
  if (run.status !== 0 && actual === code && messageOk) {
    passes++
    console.log(
      `OK   ${label} (refused with ${code}${
        message == null ? '' : `: ${message}`
      })`
    )
  } else {
    failures++
    console.error(
      `FAIL ${label} — expected ${code}${
        message == null ? '' : ` / ${message}`
      }, got ${String(actual)} / ${run.out.replace(/\s+/g, ' ').slice(0, 140)}`
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

/**
 * The interactive prompt, driven over stdin.
 *
 * Its own directory, so the shared engine and `session.json` above are not
 * disturbed. The prompt used to be handed a *spread copy* of the client
 * context while `setSessionId` assigned to the original, so a login inside
 * the prompt never took effect: the next account command answered "Please
 * log in first" on an account that was logged in, and after a dead session
 * the copy kept the stale id and repeated a 401 for the life of the prompt.
 * `docs/EDGE_CLI.md` promises "the engine, session and flags are the same as
 * one-shot mode".
 */
function checkPromptSession(): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-prompt-'))
  const user = `prompt${process.pid}`
  const script = [
    `create-account --username=${user} --password=${PASS} --pin=${PIN}`,
    'account-info',
    'logout',
    'engine-stop',
    ''
  ].join('\n')
  const run = spawnSync('node', [...CLI, '--fake', `--directory=${dir}`], {
    encoding: 'utf8',
    input: script
  })
  const out = (run.stdout ?? '') + (run.stderr ?? '')
  // `account-info` needs a session, so it is the assertion: it only answers
  // when the login the prompt just performed reached the context the prompt
  // itself reads.
  const loggedIn = /"loggedIn":\s*true/.test(out)
  const refused = out.includes('Please log in first')
  if (loggedIn && !refused) {
    passes++
    console.log('OK   a login inside the prompt is visible to the next command')
  } else {
    failures++
    console.error(
      `FAIL a login inside the prompt is visible to the next command — ${out
        .replace(/\s+/g, ' ')
        .slice(0, 200)}`
    )
  }
  // The prompt's own `engine-stop` is answered before the engine finishes
  // tearing down, so wait for its run directory to go rather than leaving one
  // behind on every run — which is the pile `sweepStaleProfiles` exists to
  // stop accumulating.
  const root = runRoot()
  const before = new Set(readDirSafe(root))
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    const mine = readDirSafe(root).filter(name => !before.has(name))
    if (mine.length === 0) break
    spawnSync('sleep', ['0.1'])
  }
  fs.rmSync(dir, { recursive: true, force: true })
}

/** Directory entries, or none when the directory is not there. */
function readDirSafe(dir: string): string[] {
  try {
    return fs.readdirSync(dir)
  } catch {
    return []
  }
}

function main(): void {
  fs.mkdirSync(DIR, { recursive: true })
  try {
    const status = ok('engine-status', 'engine-status')
    // Taken from the engine rather than recomputed, so the leak check below
    // cannot drift from however the client resolves appId and login server.
    const socketMatch = /"socketPath":\s*"([^"]+)"/.exec(status.out)
    if (socketMatch != null) runProfileDir = path.dirname(socketMatch[1])
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
    // Two more published codes nothing produced. They cost nothing offline.
    refuses(
      'forget-account for an unknown local user',
      'USER_NOT_FOUND',
      'forget-account',
      '--root-login-id=nosuchuser'
    )
    refuses(
      'cancel-request for an unknown pending login',
      'PENDING_LOGIN_NOT_FOUND',
      'cancel-request',
      'pending_nosuchhandle'
    )
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
    // A number in a JSON body arrives as the flag's raw text, so this used
    // to be `BAD_REQUEST: Expected a number, got "604800" at .timeout` and
    // the flag the help advertises could never be used.
    ok('enable-otp with a timeout', 'enable-otp', '--timeout=604800')
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
    // The fake sync server accepts hash-suffixed wallet-repo routes as of
    // core 2.49.0, so a wallet sync completes with no network.
    ok('wallet-sync', 'wallet-sync', w)
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

    // A key that is a member of `Object.prototype` is caller input like any
    // other. `wallets['__proto__']` is truthy and
    // `allTokens['__proto__'] == null` is false, so every guard that exists
    // to answer 404 was skipped and the `TypeError` that followed surfaced
    // as 500 with no field name.
    refuses(
      'a prototype key as a walletId',
      'WALLET_NOT_FOUND',
      'get-transactions',
      '--wallet-id=__proto__'
    )
    refuses(
      'a prototype key as a tokenId',
      'TOKEN_NOT_FOUND',
      'get-transactions',
      w,
      '--token-id=__proto__'
    )
    refuses(
      'constructor as a walletId',
      'WALLET_NOT_FOUND',
      'get-transactions',
      '--wallet-id=constructor'
    )
    // `limit` and `offset` index an array, so a negative one returned a
    // silently wrong page beside an unchanged `total`.
    refuses(
      'a negative limit',
      'BAD_REQUEST',
      'get-transactions',
      w,
      '--limit=-1'
    )
    refuses(
      'a negative offset',
      'BAD_REQUEST',
      'get-transactions',
      w,
      '--offset=-1'
    )

    // The export mode had no coverage at all: not the format-list parse, not
    // the `bitwaveAccountId` guards, and not the branch that *writes* the
    // wallet's synced `exportTxInfo.json`.
    const exportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-export-'))
    ok(
      'get-transactions --export-format=csv',
      'get-transactions',
      w,
      '--export-format=csv',
      `--out=${path.join(exportDir, 'tx.csv')}`
    )
    ok(
      'get-transactions with two export formats',
      'get-transactions',
      w,
      '--export-format=csv,qbo',
      `--out=${path.join(exportDir, 'tx')}`
    )
    refuses(
      'an unknown export format',
      'USAGE',
      'get-transactions',
      w,
      '--export-format=notaformat'
    )
    refuses(
      'bitwave with no account id',
      'MISSING_BITWAVE_ACCOUNT_ID',
      'get-transactions',
      w,
      '--export-format=bitwave',
      `--out=${path.join(exportDir, 'tx.csv')}`
    )
    refuses(
      'a bitwave account id without the bitwave format',
      'USAGE',
      'get-transactions',
      w,
      '--export-format=csv',
      '--bitwave-account=acct',
      `--out=${path.join(exportDir, 'tx.csv')}`
    )
    ok(
      'bitwave with an account id, saving the preference',
      'get-transactions',
      w,
      '--export-format=bitwave',
      '--bitwave-account=acct',
      '--save-export-prefs',
      `--out=${path.join(exportDir, 'bw.csv')}`
    )
    // The saved id is what the next call falls back to, which is the whole
    // point of writing it.
    ok(
      'bitwave reuses the saved account id',
      'get-transactions',
      w,
      '--export-format=bitwave',
      `--out=${path.join(exportDir, 'bw2.csv')}`
    )
    // `--save-export-prefs` used to be honoured only inside the bitwave
    // branches, so this combination answered `ok` and wrote nothing. The
    // write now runs for every format. The bitwave call after it checks that
    // the saved id survived a write that did not mention one — it has no
    // `--bitwave-account` of its own, so it can only succeed from the
    // record. `mergeExportTxInfo` is what preserves it, by reading each
    // field as `patch.x ?? prev?.x`.
    ok(
      'csv and qbo preferences are saved',
      'get-transactions',
      w,
      '--export-format=csv,qbo',
      '--save-export-prefs',
      `--out=${path.join(exportDir, 'prefs')}`
    )
    ok(
      'saving csv preferences keeps the bitwave account id',
      'get-transactions',
      w,
      '--export-format=bitwave',
      `--out=${path.join(exportDir, 'bw3.csv')}`
    )
    fs.rmSync(exportDir, { recursive: true, force: true })
    // A tokenId is free-form caller input over REST, where in the GUI it
    // always came from a real token. Unvalidated, each of these destructured
    // an absent token inside core and answered 500 INTERNAL_ERROR with no
    // field name, outside every error list the routes declare.
    refuses(
      'get-transactions with an unknown tokenId',
      'TOKEN_NOT_FOUND',
      'get-transactions',
      w,
      '--token-id=notatoken'
    )
    refuses(
      'get-num-transactions with an unknown tokenId',
      'TOKEN_NOT_FOUND',
      'get-num-transactions',
      w,
      '--token-id=notatoken'
    )
    refuses(
      'get-addresses with an unknown tokenId',
      'TOKEN_NOT_FOUND',
      'get-addresses',
      w,
      '--token-id=notatoken'
    )
    refuses(
      'get-max-spendable with an unknown tokenId',
      'TOKEN_NOT_FOUND',
      'get-max-spendable',
      w,
      '--token-id=notatoken',
      '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7'
    )
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

    // A caller-supplied `spendInfo` is free-form input over REST, and core
    // silently drops a target with no `publicAddress` — so before this was
    // checked, the first of these signed and broadcast a *one-output*
    // transaction and answered 200. All three must be refused before the
    // wallet's balance is ever consulted, which is why an empty wallet
    // answering BAD_REQUEST rather than INSUFFICIENT_FUNDS is the assertion.
    refuses(
      'make-spend with a target missing publicAddress',
      'BAD_REQUEST',
      'make-spend',
      w,
      '--spend-info={"tokenId":null,"spendTargets":[{"publicAddress":"bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7","nativeAmount":"1"},{"nativeAmount":"2"}]}'
    )
    refuses(
      'make-spend with a misspelled publicAddress field',
      'BAD_REQUEST',
      'make-spend',
      w,
      '--spend-info={"tokenId":null,"spendTargets":[{"publicAdress":"bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7","nativeAmount":"1"}]}'
    )
    // Declared `asString`, these reached biggystring, which throws a plain
    // `Error` that `toErrorBody` has no arm for — so a mistyped amount
    // answered 500 on routes declaring 400. A fractional one was worse: the
    // UTXO plugin sums fees with biggystring but builds the output with
    // `parseInt`, so "1.5" funded the fee math at 1.5 and paid out 1.
    for (const [label, amount] of [
      ['non-numeric', 'abc'],
      ['fractional', '1.5'],
      ['negative', '-1000']
    ]) {
      refuses(
        `make-spend with a ${label} native amount`,
        'BAD_REQUEST',
        'make-spend',
        w,
        '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7',
        `--native-amount=${amount}`
      )
    }
    refuses(
      'get-transactions with a non-numeric spam threshold',
      'BAD_REQUEST',
      'get-transactions',
      w,
      '--spam-threshold=abc'
    )
    refuses(
      'encode-uri with a fractional native amount',
      'BAD_REQUEST',
      'encode-uri',
      w,
      '--public-address=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7',
      '--native-amount=0.5'
    )

    refuses(
      'spend with a target missing nativeAmount',
      'BAD_REQUEST',
      'spend',
      w,
      '--spend-info={"tokenId":null,"spendTargets":[{"publicAddress":"bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7"}]}'
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
    ok('resync-blockchain', 'resync-blockchain', w)
    // No transaction exists to annotate, and saying so proves the path runs.
    refusesInternal(
      'save-tx-metadata for an unknown txid',
      'missing tx',
      'save-tx-metadata',
      w,
      '--txid=deadbeef',
      '--token-id=null',
      '--metadata={"name":"x"}'
    )
    refusesInternal(
      'save-tx-action for an unknown txid',
      'missing tx',
      'save-tx-action',
      w,
      '--txid=deadbeef',
      '--token-id=null',
      // A complete `EdgeTxActionSwap`. `{"actionType":"swap"}` alone used to
      // reach core, because the field was declared `asCoreValue` and cast;
      // it is now refused for the missing `swapInfo` before it can be
      // written into the synced transaction file.
      `--saved-action=${JSON.stringify({
        actionType: 'swap',
        swapInfo: {
          pluginId: 'fakeswap',
          displayName: 'Fake Swap',
          supportEmail: 'support@example.com'
        },
        fromAsset: { pluginId: 'bitcoin', tokenId: null },
        toAsset: { pluginId: 'bitcoin', tokenId: null },
        payoutAddress: 'bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7',
        payoutWalletId: w
      })}`
    )
    refuses(
      'save-tx-action with an incomplete savedAction',
      'BAD_REQUEST',
      'save-tx-action',
      w,
      '--txid=deadbeef',
      '--saved-action={"actionType":"swap"}'
    )
    // `actionType` is dispatched through a plain object literal, so these two
    // names resolved `Object.prototype.toString` and `Object` rather than
    // missing: the "unknown actionType" guard was skipped and a string, or
    // the unvalidated body, was returned as an `EdgeTxAction`.
    for (const actionType of ['toString', 'constructor']) {
      refuses(
        `save-tx-action with actionType "${actionType}"`,
        'BAD_REQUEST',
        'save-tx-action',
        w,
        '--txid=deadbeef',
        `--saved-action={"actionType":"${actionType}"}`
      )
    }
    refuses(
      'save-tx-metadata with a non-object metadata',
      'BAD_REQUEST',
      'save-tx-metadata',
      w,
      '--txid=deadbeef',
      '--metadata=[]'
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
    refusesInternal(
      'cancel-otp-reset with 2FA off',
      'not enabled',
      'cancel-otp-reset'
    )

    // ------------------------------------------------- object handles
    const pending = ok('request-edge-login', 'request-edge-login', '--no-wait')
    const pendingId: string = pending.json?.pendingId ?? ''
    const lobbyId: string = pending.json?.lobbyId ?? ''
    ok('poll-edge-login', 'poll-edge-login', pendingId)
    // A pending edge login belongs to no session — there is no session until
    // the login completes — so it is reachable through the un-scoped
    // `poll-edge-login` and `cancel-request` above and below, and *not*
    // through the account-scoped object routes. Skipping the ownership
    // comparison for an owner-less handle let any logged-in session read
    // another's pending login out of `object-get` and cancel it through
    // `object-delete`.
    refuses(
      'object-get on a handle that belongs to no session',
      'OBJECT_SESSION_MISMATCH',
      'object-get',
      pendingId
    )
    ok('fetch-lobby', 'fetch-lobby', lobbyId)
    ok('approve-login-request', 'approve-login-request', lobbyId)
    ok('cancel-request', 'cancel-request', pendingId)

    // ------------------------------------------------------------ admin
    // Seconds, converted to the milliseconds core takes, with a floor: zero
    // polled Edge's production login server as fast as it would answer.
    ok(
      'admin-make-lobby with a period',
      'admin-make-lobby',
      '--period-seconds=30'
    )
    refuses(
      'admin-make-lobby with a zero period',
      'BAD_REQUEST',
      'admin-make-lobby',
      '--period-seconds=0'
    )
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
      'PASSWORD_ERROR',
      'request-otp-reset',
      `--username=${USER}b`,
      '--otp-reset-token=nosuchtoken'
    )
    refuses(
      'admin-repo-get with a bad key',
      'INTERNAL_ERROR',
      'admin-repo-get',
      '11111111111111111111',
      '--data-key=11111111111111111111',
      '--path=x'
    )
    // Succeeds with an empty listing: a repo nobody has written to is not
    // an error to list. The check used to pass a `--sync-key` flag that does
    // not exist, so it never reached the route at all — and `refuses(...,
    // 'error')` accepted the resulting usage envelope.
    ok(
      'admin-repo-list on an unwritten repo is empty',
      'admin-repo-list',
      '11111111111111111111',
      '--data-key=11111111111111111111'
    )
    refuses(
      'admin-repo-set with a bad key',
      'INTERNAL_ERROR',
      'admin-repo-set',
      '11111111111111111111',
      '--data-key=11111111111111111111',
      '--path=x',
      '--text=y'
    )
    // Also succeeds: deleting a path that is not there is a no-op, which is
    // what disklet's `delete` does. Same wrong-flag history as the listing
    // above.
    ok(
      'admin-repo-delete of an absent path is a no-op',
      'admin-repo-delete',
      '11111111111111111111',
      '--data-key=11111111111111111111',
      '--path=x'
    )
    refuses(
      'admin-sync-repo with a bad key',
      'INTERNAL_ERROR',
      'admin-sync-repo',
      '11111111111111111111'
    )
    refuses(
      'admin-send-lobby-reply to an unknown lobby',
      'INTERNAL_ERROR',
      'admin-send-lobby-reply',
      'nosuchlobby',
      '--lobby-request={}'
    )
    refuses(
      'spend with save but no broadcast',
      'BAD_REQUEST',
      'spend',
      w,
      '--to=bc1qnotarealaddressatall',
      '--native-amount=1000',
      '--broadcast=false',
      '--save=true'
    )
    refuses(
      'spend on an empty wallet',
      'INSUFFICIENT_FUNDS',
      'spend',
      w,
      '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7',
      '--native-amount=100000'
    )
    refuses(
      'spend-max on an empty wallet',
      'INSUFFICIENT_FUNDS',
      'spend-max',
      w,
      '--to=bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7'
    )
    refuses(
      'sweep-private-keys with no funds',
      'INTERNAL_ERROR',
      'sweep-private-keys',
      w,
      '--spend-info={"tokenId":null,"privateKeys":["x"]}'
    )
    refuses(
      'accelerate an unknown transaction',
      'OBJECT_NOT_FOUND',
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
    refusesInternal(
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
    // A clean stop must leave nothing behind in `~/.edge-cli/run`. Every run
    // of this suite uses a fresh data directory and therefore a fresh profile
    // hash, so a leak here is permanent — and each leaked directory may
    // still hold a `session.json`, which is a bearer token.
    if (runProfileDir != null) {
      // `engine-stop` answers *before* the teardown finishes — it has to, or
      // the caller would wait out the drain — so the directory goes away a
      // moment later. Poll rather than assert immediately, or this check
      // fails on whichever run the shutdown happens to be slowest.
      const deadline = Date.now() + 10_000
      while (fs.existsSync(runProfileDir) && Date.now() < deadline) {
        spawnSync('sleep', ['0.1'])
      }
      if (!fs.existsSync(runProfileDir)) {
        passes++
        console.log('OK   engine-stop leaves no profile directory behind')
      } else {
        failures++
        console.error(
          `FAIL engine-stop leaves no profile directory behind — ${runProfileDir} still holds ${fs
            .readdirSync(runProfileDir)
            .join(', ')}`
        )
      }
    }
    fs.rmSync(DIR, { recursive: true, force: true })
  }

  checkPromptSession()

  console.log(`\ntestCliFake: ${passes} passed, ${failures} failed`)
  if (failures > 0) process.exit(1)
}

main()
