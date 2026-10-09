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

import { CLI, parseLeadingJson, runRoot } from './util/cliHarness'

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
 * Assert something the harness worked out for itself.
 *
 * `ok` and `refuses` both run a command and judge its output. Some checks
 * are about what a command *left behind* — a file on disk, its first line —
 * and those need an assertion of their own rather than another invocation.
 */
function check(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    passes++
    console.log(`OK   ${label}`)
  } else {
    failures++
    console.error(`FAIL ${label}${detail !== '' ? ` — ${detail}` : ''}`)
  }
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
 * A double-quoted value holding a backslash survives the prompt.
 *
 * `splitPromptLine` applied backslash escaping to *every* following
 * character inside double quotes, where a shell escapes only `"` and `\`.
 * So `create-account --password="a\b"` created the account with `ab` at the
 * prompt and with `a\b` in one-shot mode, reported success either way, and
 * the user could not log in again — the exact failure the `$` case above
 * was written for, one escape rule over. One-shot mode is the oracle,
 * because a prompt that mangles the value mangles it the same way going in
 * and coming out.
 */
function checkPromptBackslash(
  dir: string,
  user: string,
  password: string
): void {
  const script = [
    `create-account --username=${user} --password="${password}" --pin=${PIN}`,
    'logout',
    ''
  ].join('\n')
  spawnSync('node', [...CLI, '--fake', `--directory=${dir}`], {
    encoding: 'utf8',
    input: script
  })
  const oneShot = spawnSync(
    'node',
    [
      ...CLI,
      '--fake',
      `--directory=${dir}`,
      'login-with-password',
      `--username=${user}`,
      `--password=${password}`
    ],
    { encoding: 'utf8' }
  )
  const out = (oneShot.stdout ?? '') + (oneShot.stderr ?? '')
  check(
    'the prompt passes a double-quoted backslash through unchanged',
    (oneShot.status ?? -1) === 0 && out.includes('"sessionId"'),
    `exit=${String(oneShot.status)} ${out.replace(/\s+/g, ' ').slice(0, 200)}`
  )
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

  // A `$` in the password, unquoted, because that is what a user types and
  // what one-shot mode receives verbatim. The prompt used to tokenize with a
  // shell parser, so `p$55w0rd` expanded against an empty environment: the
  // account was created with `p`, `create-account` reported success, and the
  // login below — with the password the script actually asked for — failed
  // for ever. The `logout` then `login-with-password` round trip is the
  // assertion, since `create-account` alone cannot tell the two apart.
  const dollarPass = 'p$55w0rdZq7'
  // And a double-quoted value holding a backslash, which the prompt used to
  // delete: `--notes="a\\b"` became `ab` here and stayed `a\\b` in one-shot
  // mode. Checked the same way, with one-shot as the oracle.
  const backslashUser = `slash${process.pid}`
  const backslashPass = 'a\\b7Zq9kk'
  const script = [
    `create-account --username=${user} --password=${dollarPass} --pin=${PIN}`,
    'account-info',
    'logout',
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
  }
  // The login has to come from *outside* the prompt, because a prompt that
  // mangles the password mangles it identically on the way in and on the way
  // out — a round trip inside the prompt agrees with itself and proves
  // nothing. One-shot mode takes the value verbatim from `process.argv`, so
  // it is the oracle: if these two disagree about what the password is, the
  // prompt rewrote it.
  const oneShot = spawnSync(
    'node',
    [
      ...CLI,
      '--fake',
      `--directory=${dir}`,
      'login-with-password',
      `--username=${user}`,
      `--password=${dollarPass}`
    ],
    { encoding: 'utf8' }
  )
  checkPromptBackslash(dir, backslashUser, backslashPass)
  const oneShotOut = (oneShot.stdout ?? '') + (oneShot.stderr ?? '')
  check(
    'the prompt passes a password containing $ through unchanged',
    (oneShot.status ?? -1) === 0 && oneShotOut.includes('"sessionId"'),
    `exit=${String(oneShot.status)} ${oneShotOut
      .replace(/\s+/g, ' ')
      .slice(0, 200)}`
  )
  // The prompt's own profile directory, taken from the engine rather than
  // recomputed — the same trick `main()` uses, so this cannot drift from
  // however the client resolves appId, test mode and login server. Waiting
  // on a *set difference* over `runRoot()` was waiting on a machine-global
  // directory: another checkout's suite, a second worktree or an engine
  // respawning mid-run turned this gate red with "still present: <someone
  // else's profile>", and because `testCliFake` is the first half of
  // `test:cli:offline` that also stopped `testCliSubscribe` from running at
  // all.
  const promptStatus = spawnSync(
    'node',
    [...CLI, '--fake', `--directory=${dir}`, 'engine-status'],
    { encoding: 'utf8' }
  )
  const promptSocket = /"socketPath":\s*"([^"]+)"/.exec(
    promptStatus.stdout ?? ''
  )
  check(
    'the prompt engine reports the run directory this suite then waits on',
    promptSocket != null,
    `engine-status did not name a socket: ${(promptStatus.stdout ?? '')
      .replace(/\s+/g, ' ')
      .slice(0, 200)}`
  )
  const profileDir =
    promptSocket == null
      ? path.join(runRoot(), 'no-such-profile')
      : path.dirname(promptSocket[1])
  spawnSync('node', [...CLI, '--fake', `--directory=${dir}`, 'engine-stop'], {
    encoding: 'utf8'
  })
  if (loggedIn && !refused) {
    // Reported above.
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
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    if (!fs.existsSync(profileDir)) break
    spawnSync('sleep', ['0.1'])
  }
  // Asserted rather than hoped for: the whole point of the wait is that the
  // prompt's engine leaves nothing behind, and a silent timeout left the
  // leak in place and the suite green.
  check(
    'the prompt engine leaves no run directory behind',
    !fs.existsSync(profileDir),
    `still present: ${path.basename(profileDir)}`
  )
  fs.rmSync(dir, { recursive: true, force: true })
}

/**
 * `-u` chooses the account, in the prompt as in one-shot mode, and a name
 * in another case is the same account.
 *
 * The prompt never read `-u`, so `echo account-info | edge-cli -u alice -p …`
 * answered for whoever `session.json` held. And the name was compared raw
 * against the one core had lowercased, so `-u ALICE` logged in again on
 * every command and left the previous login running in the engine.
 */
function checkNamedSession(): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-named-'))
  const run = (args: string[], input?: string): string => {
    const result = spawnSync(
      'node',
      [...CLI, '--fake', `--directory=${dir}`, ...args],
      { encoding: 'utf8', input }
    )
    return (result.stdout ?? '') + (result.stderr ?? '')
  }
  // A bare array, which `parseLeadingJson` (objects only) does not read.
  const sessions = (): number | undefined => {
    const result = spawnSync(
      'node',
      [...CLI, '--fake', `--directory=${dir}`, 'engine-sessions'],
      { encoding: 'utf8' }
    )
    try {
      const listing: unknown = JSON.parse(result.stdout ?? '')
      return Array.isArray(listing) ? listing.length : undefined
    } catch {
      return undefined
    }
  }
  const alice = `alice${process.pid}`
  const bob = `bob${process.pid}`
  try {
    run([
      'create-account',
      `--username=${alice}`,
      `--password=${PASS}`,
      `--pin=${PIN}`
    ])
    // `session.json` now holds bob's session.
    run([
      'create-account',
      `--username=${bob}`,
      `--password=${PASS}`,
      `--pin=${PIN}`
    ])

    const before = sessions()
    const piped = run(['-u', alice, '-p', PASS], 'account-info\n')
    check(
      '-u chooses the account in the prompt too',
      piped.includes(`"username": "${alice}"`) &&
        !piped.includes(`"username": "${bob}"`),
      piped.replace(/\s+/g, ' ').slice(0, 160)
    )
    // One login in, the replaced session out.
    check(
      'the session -u replaced is logged out',
      before != null && sessions() === before,
      `${String(before)} sessions before, ${String(sessions())} after`
    )

    const settled = sessions()
    run(['-u', alice.toUpperCase(), '-p', PASS, 'account-info'])
    run(['-u', alice.toUpperCase(), '-p', PASS, 'account-info'])
    check(
      '-u in another case reuses the session it names',
      settled != null && sessions() === settled,
      `${String(settled)} sessions before, ${String(sessions())} after`
    )
  } finally {
    run(['engine-stop'])
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * The exit code a piped script gets for several failing lines.
 *
 * One rule, the highest code any line produced. It was three: the API arm
 * was last-non-zero-wins and the two usage arms were first-wins, so a script
 * that failed 5 then 4 reported 4, and one that failed 4 then took a usage
 * error reported 4 where the reverse order reported 2. Nothing observed it,
 * because the exit code of a piped run is the one thing the other prompt
 * checks do not read.
 */
function checkPromptExitCode(): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-pipe-'))
  const user = `pipe${process.pid}`
  const login = `create-account --username=${user} --password=pipePass7x --pin=${PIN}`
  // `--spam-threshold=abc` fails the query cleaner — BAD_REQUEST, exit 5 —
  // and an unknown wallet id is WALLET_NOT_FOUND, exit 4. Two *API*
  // failures, which is what tells the rules apart: the arm that handles them
  // was last-non-zero-wins, so 5 then 4 reported 4.
  const badRequest = 'get-transactions --wallet-id=nope --spam-threshold=abc'
  const notFound = 'get-transactions --wallet-id=nope'
  const pipe = (lines: string[]): number => {
    const run = spawnSync('node', [...CLI, '--fake', `--directory=${dir}`], {
      encoding: 'utf8',
      input: lines.join('\n') + '\n'
    })
    return run.status ?? -1
  }
  try {
    const worseFirst = pipe([login, badRequest, notFound])
    // The session the first run created is still on disk, so this one line
    // reaches the engine.
    const alone = pipe([badRequest])
    check(
      'a piped script exits with the highest code, whatever the order',
      worseFirst === 5,
      `5-then-4=${worseFirst}`
    )
    check(
      'a piped script reports a failing line on its own',
      alone === 5,
      `one failure=${alone}`
    )
    // A usage error does not outrank a worse API failure that came first,
    // and does outrank a clean run.
    check(
      'a usage error alone exits 2',
      pipe(['nosuchcommand']) === 2,
      'exit code for an unknown command'
    )
  } finally {
    spawnSync('node', [...CLI, '--fake', `--directory=${dir}`, 'engine-stop'], {
      encoding: 'utf8'
    })
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * `ENGINE_UNAVAILABLE`, which needs the absence of an engine.
 *
 * Its own directory, so the suite's shared engine is not in the way. This is
 * the envelope and the exit code — `EXIT.ENGINE`, 7 — that the guide's
 * exit-code table publishes for the most common failure a first-time caller
 * meets, and no suite produced it.
 */
function checkEngineUnavailable(): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-nospawn-'))
  try {
    const run = spawnSync(
      'node',
      [...CLI, '--fake', `--directory=${dir}`, '--no-spawn', 'engine-status'],
      { encoding: 'utf8' }
    )
    const out = (run.stdout ?? '') + (run.stderr ?? '')
    const json = parseLeadingJson(out)
    check(
      '--no-spawn with no engine reports ENGINE_UNAVAILABLE',
      json?.error?.code === 'ENGINE_UNAVAILABLE',
      out.replace(/\s+/g, ' ').slice(0, 200)
    )
    check(
      '--no-spawn with no engine exits 7',
      run.status === 7,
      `status=${String(run.status)}`
    )
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * A 401 on an overridden session must not clear the persisted one.
 *
 * Runs while a real session is logged in, so the file holds a usable id. The
 * override is syntactically valid and unknown to the engine, which is exactly
 * the shape `forgetDeadSession` reacts to.
 */
function checkSessionFileSurvivesABadOverride(): void {
  if (runProfileDir == null) {
    check('a bad --session leaves session.json alone', false, 'no run dir')
    return
  }
  const file = path.join(runProfileDir, 'session.json')
  let before: string
  try {
    before = fs.readFileSync(file, 'utf8')
  } catch (error: unknown) {
    check(
      'a bad --session leaves session.json alone',
      false,
      `cannot read ${file}: ${String(error)}`
    )
    return
  }
  refuses(
    'account-info with an unknown --session',
    'INVALID_SESSION',
    '--session=sess_000000000000000000000000000000',
    'account-info'
  )
  let after: string | null = null
  try {
    after = fs.readFileSync(file, 'utf8')
  } catch {
    after = null
  }
  check(
    'a bad --session leaves session.json alone',
    after === before,
    after == null ? `${file} was deleted` : 'session.json changed'
  )
}

function main(): void {
  fs.mkdirSync(DIR, { recursive: true })
  try {
    const status = ok('engine-status', 'engine-status')
    // Taken from the engine rather than recomputed, so the leak check below
    // cannot drift from however the client resolves appId and login server.
    const socketMatch = /"socketPath":\s*"([^"]+)"/.exec(status.out)
    if (socketMatch != null) runProfileDir = path.dirname(socketMatch[1])
    const engineConfig = ok('engine-config', 'engine-config')
    // The call's stated job is to say which configuration the engine is
    // running on, and the one file this suite's engine is *not* started with
    // is the CLI conf — so `cliConfig` is null here, and the field's
    // existence is what this pins. It used to name the `keys.json` search
    // path and the app's `config.json` and not `edge-cli.conf` at all, while
    // the guide says that file "decides both halves".
    check(
      'engine-config names both config files',
      engineConfig.json?.configFiles != null &&
        'cliConfig' in engineConfig.json.configFiles &&
        'appConfig' in engineConfig.json.configFiles &&
        engineConfig.json.configFiles.cliConfig === null,
      `configFiles is ${JSON.stringify(engineConfig.json?.configFiles)}`
    )
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
    // Written to the value that is *not* the default, then read back. The
    // previous pair wrote `true`, which `spamFilterOn` already defaults to,
    // and read before writing — so a handler that answered `ok` and wrote
    // nothing, or wrote the wrong file, passed both. This is the only CLI
    // path that writes `Settings.json` on `account.localDisklet`, and the
    // setting it writes changes what `get-transactions` returns.
    ok('local-settings read', 'local-settings')
    ok('local-settings write', 'local-settings', '--spam-filter-on=false')
    const afterWrite = ok('local-settings read after write', 'local-settings')
    check(
      'a local-settings write is readable back',
      afterWrite.json?.spamFilterOn === false,
      `spamFilterOn is ${String(afterWrite.json?.spamFilterOn)}`
    )
    ok('local-settings restore', 'local-settings', '--spam-filter-on=true')
    const restored = ok('local-settings read after restore', 'local-settings')
    check(
      'a local-settings write can be undone',
      restored.json?.spamFilterOn === true,
      `spamFilterOn is ${String(restored.json?.spamFilterOn)}`
    )
    // And the published trust flag, which is how a caller tells the user's
    // choice from the cleaner's default. Only the `true` arm is reachable
    // here, because the fake world's file is readable;
    // `localSettingsRoute.test.ts` drives the other one.
    check(
      'a local-settings read says the values are the user\u2019s',
      restored.json?.trusted === true,
      `trusted is ${String(restored.json?.trusted)}`
    )

    // ------------------------------------------- the persisted session id
    //
    // `--session` and `EDGE_CLI_SESSION` are published as an override of the
    // persisted id, and a 401 on an overridden id used to delete the
    // `session.json` holding a different, still-live one — the only copy of
    // an id for an account the engine still had open.
    checkSessionFileSurvivesABadOverride()
    // `engine-status` rather than a wallet command: the subject is that
    // `help <name>` answers for a registered name, and a command the next
    // commit adds made this case fail on the engine commit's own tree.
    ok('help', 'help', 'engine-status')

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
    // `0` is not nullish, so it used to be passed through rather than
    // defaulted — a 2FA reset delay of zero seconds, which is a window in
    // which `cancel-otp-reset` cannot be used.
    refuses(
      'enable-otp with no reset window',
      'BAD_REQUEST',
      'enable-otp',
      '--timeout=0'
    )
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
    // Inside the archived window, which is the whole reason `findWalletId`
    // exists. Core builds `account.currencyWallets` from `activeWalletIds`,
    // so an archived wallet is absent from it — and these five routes only
    // need an id. Resolved through the loaded set, `all-keys` listed the
    // wallet and `get-raw-private-key` answered `WALLET_NOT_FOUND` for the
    // exact id it had just printed, on the disaster-recovery path a CLI key
    // export is for. Every other key-export check passes a loaded active
    // wallet, so reverting the routes to `findWallet` left both offline
    // suites green.
    ok('all-keys while archived', 'all-keys')
    ok('get-raw-private-key while archived', 'get-raw-private-key', w)
    // The display forms are deliberately not here. Core asks the plugin's
    // tools for them and, where the tools do not implement it, falls back to
    // a running engine — and whether an archived wallet still has one
    // depends on how far core has got with tearing it down, so the answer
    // races. `keyRoutes.test.ts` pins both outcomes instead: the key when
    // the engine is there, and `WALLET_NOT_RUNNING` when it is not, where
    // this used to be a `500 INTERNAL_ERROR` carrying core's `Wallet id …
    // does not exist in this account`.
    ok('get-raw-public-key while archived', 'get-raw-public-key', w)
    ok(
      'list-splittable-wallet-types while archived',
      'list-splittable-wallet-types',
      w
    )
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
    // The client-side `--token-id` filter used to answer `{"balances": []}`
    // and exit 0 for an id the wallet tracks nothing for, so a script could
    // not tell that from a zero balance.
    refuses(
      'balance-map with a token the wallet does not track',
      'TOKEN_NOT_FOUND',
      'balance-map',
      w,
      '--token-id=deadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
    )
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
    // `--add` of an id the plugin does not know used to answer 200 with the
    // unchanged set and exit 0, because core ends with
    // `.filter(tokenId => allTokens[tokenId] != null)` — so a script could
    // not tell a mistyped contract address from a no-op. The sugar makes
    // that likelier, not less: the client posts the whole list back, so a
    // bad id arrives inside a known-good set.
    refuses(
      'change-enabled-token-ids with an id the plugin does not know',
      'TOKEN_NOT_FOUND',
      'change-enabled-token-ids',
      w,
      '--add=deadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
    )
    refuses(
      'change-enabled-token-ids with a null id',
      'BAD_REQUEST',
      'change-enabled-token-ids',
      w,
      '--token-ids=null'
    )
    // "Disable every token on this wallet" is the empty set, and it had no
    // spelling: `--token-ids=` is refused because an empty flag value is a
    // forgotten value everywhere in this CLI, and `--token-ids=,` works but
    // reads as a typo. A no-op here, because the fake world's UTXO wallet
    // has no tokens enabled — the point is that the command is accepted and
    // answers the empty set.
    const cleared = ok(
      'change-enabled-token-ids --disable-all',
      'change-enabled-token-ids',
      w,
      '--disable-all'
    )
    check(
      'disable-all sends the empty set',
      Array.isArray(cleared.json?.enabledTokenIds) &&
        cleared.json.enabledTokenIds.length === 0,
      `enabledTokenIds is ${JSON.stringify(cleared.json?.enabledTokenIds)}`
    )
    refuses(
      'change-enabled-token-ids with --disable-all and --token-ids',
      'USAGE',
      'change-enabled-token-ids',
      w,
      '--disable-all',
      '--token-ids=a'
    )
    refuses(
      'change-enabled-token-ids with --disable-all and --add',
      'USAGE',
      'change-enabled-token-ids',
      w,
      '--disable-all',
      '--add=a'
    )
    // The reader for the one write a GET makes. Nothing read
    // `exportTxInfo.json` back, so the CLI could put a record into a synced
    // file the GUI reads and offer no way to see what it had written.
    const prefsBefore = ok('export-prefs', 'export-prefs', w)
    check(
      'export-prefs answers null for a wallet with nothing saved',
      prefsBefore.json?.prefs === null && prefsBefore.json?.key === 'BTC',
      JSON.stringify(prefsBefore.json)
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
    // Seven export checks and not one of them opened a file, so an engine
    // that stopped assembling `files`, or a `writeExportFiles` whose
    // `fs.writeFile` were deleted, would have kept all seven green: `ok()`
    // asserts only `status === 0` and the absence of an error, and the
    // client returns early when `result.files == null`.
    //
    // The wallet is empty in the fake world, which is what makes the two
    // formats differ here: QBO always writes its envelope, and the CSV
    // exporter ends in `csvStringify(items, { header: true })`, which takes
    // its header from the first record's keys — so no records means no
    // header and a zero-byte file. That is intended: an empty range is a
    // successful export of nothing, not a failure, and the route's `@note`
    // publishes it. The GUI reaches a different conclusion from the same
    // empty string — it treats `''` as "nothing to export" and shows a
    // toast (`TransactionsExportScene.tsx`) — so the exporter must keep
    // returning it, and any change here belongs in the engine rather than
    // in the shared formatter.
    const exported = (name: string): string => {
      const file = path.join(exportDir, name)
      return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '<absent>'
    }
    check(
      'a multi-format export writes exactly one file per format',
      fs.existsSync(path.join(exportDir, 'tx.csv')) &&
        fs.existsSync(path.join(exportDir, 'tx.qbo')) &&
        !fs.existsSync(path.join(exportDir, 'tx')),
      fs.readdirSync(exportDir).join(', ')
    )
    check(
      'the QBO file carries its OFX header',
      exported('tx.qbo').startsWith('OFXHEADER:100'),
      exported('tx.qbo').slice(0, 60)
    )
    check(
      'the QBO file is not empty',
      exported('tx.qbo').length > 100,
      String(exported('tx.qbo').length)
    )
    check(
      'an empty wallet exports an empty CSV',
      exported('tx.csv') === '',
      JSON.stringify(exported('tx.csv').slice(0, 60))
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
    // Read back through the route, which is what the GUI's export scene
    // sees: the id *and* all three format switches, with the two the caller
    // did not ask for recorded as false rather than left out.
    const prefsAfter = ok('export-prefs after a save', 'export-prefs', w)
    check(
      'export-prefs reads back what --save-export-prefs wrote',
      prefsAfter.json?.prefs?.bitwaveAccountId === 'acct' &&
        prefsAfter.json?.prefs?.isExportBitwave === true &&
        prefsAfter.json?.prefs?.isExportCsv === false &&
        prefsAfter.json?.prefs?.isExportQbo === false,
      JSON.stringify(prefsAfter.json?.prefs)
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
    // ------------------------------------------------------------ rates
    //
    // The success path needs the live rates server, but every refusal here
    // happens before any fetch — the empty-body arm in the handler, and the
    // rest at the declaration. They matter more than their size: this is the
    // only route whose output is a spend amount, and an unparseable date used
    // to come back inside a 200 as `rate: 0`, indistinguishable from a rate
    // the server could not supply.
    refuses(
      'rates-query with neither crypto nor fiat',
      'BAD_REQUEST',
      'rates-query'
    )
    refuses(
      'rates-query with an unparseable date',
      'BAD_REQUEST',
      'rates-query',
      `--crypto=${JSON.stringify([
        { pluginId: 'bitcoin', date: 'not-a-date' }
      ])}`
    )
    refuses(
      'rates-usd-to-native with an unparseable date',
      'BAD_REQUEST',
      'rates-usd-to-native',
      '--usd-amount=10',
      '--plugin-id=bitcoin',
      '--multiplier=100000000',
      '--date=not-a-date'
    )
    refuses(
      'rates-usd-to-native with a negative amount',
      'BAD_REQUEST',
      'rates-usd-to-native',
      '--usd-amount=-10',
      '--plugin-id=bitcoin',
      '--multiplier=100000000'
    )
    refuses(
      'rates-usd-to-native with a non-numeric multiplier',
      'BAD_REQUEST',
      'rates-usd-to-native',
      '--usd-amount=10',
      '--plugin-id=bitcoin',
      '--multiplier=abc'
    )

    // The swap quote needs real providers and funded wallets, but its
    // `nativeAmount` is validated at the declaration, which is the field that
    // reaches every swap plugin.
    refuses(
      'fetch-swap-quotes with an unknown fromTokenId',
      'TOKEN_NOT_FOUND',
      'fetch-swap-quotes',
      `--from-wallet-id=${walletId}`,
      `--to-wallet-id=${walletId}`,
      '--native-amount=1',
      '--from-token-id=notatoken'
    )
    refuses(
      'fetch-swap-quotes with an unknown toTokenId',
      'TOKEN_NOT_FOUND',
      'fetch-swap-quotes',
      `--from-wallet-id=${walletId}`,
      `--to-wallet-id=${walletId}`,
      '--native-amount=1',
      '--to-token-id=notatoken'
    )
    refuses(
      'fetch-swap-quotes with a fractional native amount',
      'BAD_REQUEST',
      'fetch-swap-quotes',
      `--from-wallet-id=${walletId}`,
      `--to-wallet-id=${walletId}`,
      '--native-amount=1.5'
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
    // The amount in a URI is now scaled by the asset the request spends, so
    // `parseUri` is told which one that is. This asserts the guard around
    // that does not refuse the ordinary case: a native-asset URI carrying an
    // amount must reach the balance check, so INSUFFICIENT_FUNDS rather than
    // BAD_REQUEST is the pass. (The mismatch arm needs a wallet with a
    // token, which the fake world has not got — it is covered by
    // `spendMemo.test.ts`'s sibling unit cases.)
    refuses(
      'make-spend from a native URI carrying an amount',
      'INSUFFICIENT_FUNDS',
      'make-spend',
      w,
      '--to=bitcoin:bc1q0qsagl9n0lrsutam6zncd6vf07rq3mekn3phl7?amount=0.0001'
    )

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

    // All three spend entries, because the guard was written out twice and
    // missing from the third: core hands an empty `spendTargets` to the
    // plugin, which throws a plain `Error` — a 500 on routes that declare
    // BAD_REQUEST, for a one-flag mistake on a documented command.
    for (const command of ['make-spend', 'spend', 'spend-max']) {
      refuses(`${command} with no destination`, 'BAD_REQUEST', command, w)
    }
    refuses(
      'get-max-spendable with no destination',
      'BAD_REQUEST',
      'get-max-spendable',
      w
    )

    // The route used to rewrite *every* failure as `NETWORK_ERROR` with
    // status 503 — exit 6, which the published table presents as the
    // retryable class — so a URL that can never work told a script to retry
    // for ever. A string that is not a URL fails inside the plugin before
    // any socket is opened, which is why this one is safe offline.
    refuses(
      'get-payment-protocol-info with a URL that is not one',
      'BAD_REQUEST',
      'get-payment-protocol-info',
      w,
      '--payment-protocol-url=not-a-url'
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
    // Partial success, which is what the route publishes and what nothing
    // reached: core's batch resolves every type up front and throws for one
    // it cannot find, so a single bad entry abandoned the whole call and
    // created nothing. Driven one entry at a time, the good one is created
    // and the bad one reports its own failure.
    const batch = ok(
      'create-currency-wallets with one bad entry',
      'create-currency-wallets',
      '--create-wallets=[{"walletType":"wallet:bitcoin","name":"Partial"},{"walletType":"wallet:bogusbogus"}]'
    )
    check(
      'a bad entry fails on its own without taking the batch down',
      Array.isArray(batch.json?.results) &&
        batch.json.results.length === 2 &&
        batch.json.results[0]?.ok === true &&
        batch.json.results[1]?.ok === false &&
        typeof batch.json.results[1]?.error === 'string',
      JSON.stringify(batch.json?.results)
    )
    ok('split', 'split', w, '--split-wallets=[]')
    // The caller mistake the route's own description sends them to
    // `list-splittable-wallet-types` to avoid, which arrived as a 500.
    refuses(
      'split into a wallet type no plugin claims',
      'BAD_REQUEST',
      'split',
      w,
      '--split-wallets=[{"walletType":"wallet:bogusbogus"}]'
    )
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
    // Core treats an unknown wallet id as new and writes a state file for it
    // without error, so these answered 204 while changing nothing and left a
    // bogus record to sync to every device.
    // The three flags the published usage advertised and the parsers
    // refused. Each is the route's own field, so the fix was to accept it,
    // and `docs:api:verify` now fails on a published flag a parser rejects.
    ok(
      'change-wallet-states with the whole walletStates map',
      'change-wallet-states',
      `--wallet-states=${JSON.stringify({ [walletId]: { hidden: false } })}`
    )
    refuses(
      'change-wallet-states with both --wallet-states and --wallet-id',
      'USAGE',
      'change-wallet-states',
      '--wallet-states={}',
      w,
      '--archived=true'
    )
    // The per-wallet flags without `--wallet-id` used to be applied as the
    // map and silently ignored, with no diagnostic.
    refuses(
      'change-wallet-states with --wallet-states and a per-wallet flag',
      'USAGE',
      'change-wallet-states',
      `--wallet-states=${JSON.stringify({ [walletId]: { hidden: false } })}`,
      '--archived=true'
    )
    refuses(
      'change-wallet-states with malformed --wallet-states',
      'USAGE',
      'change-wallet-states',
      '--wallet-states={bad'
    )

    refuses(
      'change-wallet-states with an unknown wallet id',
      'WALLET_NOT_FOUND',
      'change-wallet-states',
      '--wallet-id=nosuchwalletid',
      '--archived=true'
    )

    refuses(
      'save-tx-metadata with a non-object metadata',
      'BAD_REQUEST',
      'save-tx-metadata',
      w,
      '--txid=deadbeef',
      '--metadata=[]'
    )

    // Published contracts the routes stated and did not enforce.
    refuses(
      'change-recovery with more questions than answers',
      'BAD_REQUEST',
      'change-recovery',
      '--question=first',
      '--question=second',
      '--answer=only-one'
    )
    // The empty case is unreachable from the CLI — the parser requires
    // `--question` — so the route's guard is there for a raw REST caller.

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
    // And a ceiling, because `setTimeout` keeps its delay in a 32-bit signed
    // int: a period above that clamped to 1 ms after a warning, so "poll once
    // a month" became the fastest poll the loop could make.
    refuses(
      'admin-make-lobby with a period past the 32-bit timer ceiling',
      'BAD_REQUEST',
      'admin-make-lobby',
      '--period-seconds=2592000'
    )
    const lobby = ok('admin-make-lobby', 'admin-make-lobby')
    const handle: string = lobby.json?.objectId ?? ''
    ok(
      'admin-fetch-lobby-request',
      'admin-fetch-lobby-request',
      lobby.json?.lobbyId ?? ''
    )
    // An admin lobby is created empty, so it has no `loginRequest` — which
    // makes this the one offline way to reach `NO_LOGIN_REQUEST`, a published
    // code no test produced.
    refuses(
      'approve-login-request on a lobby with no request',
      'NO_LOGIN_REQUEST',
      'approve-login-request',
      lobby.json?.lobbyId ?? ''
    )
    // A caller's typo in a base58 key is bad argv, not an engine fault: nine
    // unguarded `base58.parse` calls made the `BAD_REQUEST` each of these
    // routes declares unreachable from its own handler.
    refuses(
      'admin-sync-repo with a non-base58 sync key',
      'BAD_REQUEST',
      'admin-sync-repo',
      'abc0OIl'
    )
    refuses(
      'admin-repo-get with a non-base58 data key',
      'BAD_REQUEST',
      'admin-repo-get',
      '11111111111111111111',
      '--data-key=not!base58',
      '--path=Keys/x.json'
    )
    // Base64 as well, because `get-raw-private-key` — the only command that
    // produces these two values — emits them base64, so the whole group was
    // undrivable from the CLI's own output. An unwritten repo lists empty,
    // which is the same answer the base58 case above it gets; the point is
    // that the key was *read* rather than refused as bad argv.
    ok(
      'admin-repo-list with a base64 key',
      'admin-repo-list',
      'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
      '--data-key=BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc='
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
    // Both used to answer `ok` for an arbitrary string, on an account whose
    // `pendingVouchers` is empty — and a voucher is a pending login the
    // login server *approves on a timer* unless it is rejected, so the
    // caller was told an unrecognised device had been denied while that
    // device's login went on to succeed.
    refuses(
      'approve-voucher with no such voucher',
      'NOT_FOUND',
      'approve-voucher',
      '--voucher-id=nosuchvoucher'
    )
    refuses(
      'reject-voucher with no such voucher',
      'NOT_FOUND',
      'reject-voucher',
      '--voucher-id=nosuchvoucher'
    )
    refuses(
      'request-otp-reset with a bad token',
      'PASSWORD_ERROR',
      'request-otp-reset',
      `--username=${USER}b`,
      '--otp-reset-token=nosuchtoken'
    )
    refuses(
      'admin-repo-get on a repo with no such file',
      'NOT_FOUND',
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
    // A real compressed secp256k1 point, base64: 33 bytes, leading `0x03`.
    // Public by definition — it is the key a lobby publishes so the other
    // party can encrypt to it — and fixed rather than generated so the case
    // tests the same bytes every run.
    const LOBBY_PUBLIC_KEY_BASE64 =
      'A5TtBTRQirwe15Yjdeq2xShERYJSy9fmo+iCXjy7swpi'
    // `{}` is a `400` from the declaration now, not a `500` from inside
    // core. The old case asserted `INTERNAL_ERROR` under the name "to an
    // unknown lobby", which it never reached: core encrypts the reply
    // *before* it fetches the lobby, so the throw was
    // `secp256k1.keyFromPublic` on a missing key — the case was pinning
    // that bug under another name.
    refuses(
      'admin-send-lobby-reply without a lobby public key',
      'BAD_REQUEST',
      'admin-send-lobby-reply',
      'nosuchlobby',
      '--lobby-request={}'
    )
    // And a well-formed request now gets *past* the declaration and all the
    // way to the login server, which the fake world answers for an unknown
    // lobby with `USERNAME_ERROR`. That is the assertion worth having: core
    // encrypts the reply *before* it fetches the lobby, so reaching the
    // server at all is proof that `encryptLobbyReply` →
    // `secp256k1.keyFromPublic` accepted the key — the step that threw
    // `Unknown point format` for every input this route could express. The
    // key is 33 bytes of compressed secp256k1 point, base64, exactly as
    // `admin-fetch-lobby-request` publishes it.
    refuses(
      'admin-send-lobby-reply reaches the server with a usable key',
      'USERNAME_ERROR',
      'admin-send-lobby-reply',
      'nosuchlobby',
      `--lobby-request=${JSON.stringify({
        publicKey: LOBBY_PUBLIC_KEY_BASE64,
        timeout: 600
      })}`
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
  checkNamedSession()
  checkPromptExitCode()
  checkEngineUnavailable()

  console.log(`\ntestCliFake: ${passes} passed, ${failures} failed`)
  if (failures > 0) process.exit(1)
}

main()
