/**
 * Proves the subscribe/one-shot concurrency contract against a real engine:
 *
 *   1. A subscriber holds the engine open even with no account logged in.
 *   2. One-shot commands run normally while a subscriber is attached.
 *   3. The idle timer re-arms once the last subscriber detaches.
 *   4. Stopping the engine closes the stream with a reason and exit code 7.
 *   5. Ctrl-C during a cold start still ends the process, rather than opening
 *      the stream once the engine finally answers and holding it forever.
 *   6. A `sessionId`-scoped stream is closed by that session's logout, while
 *      an unscoped one survives it.
 *   7. The idle timer re-arms on the *same* engine when the last subscriber
 *      detaches, which is the path claim 3 is actually about.
 *   8. The loopback TCP listener answers the same thing the unix socket does,
 *      and binds loopback rather than every interface.
 *
 * Uses its own --directory so it never touches a developer's live engine, and
 * the fake world so the contract holds without an Edge API key or a network.
 *
 *   node -r sucrase/register scripts/testCliSubscribe.ts
 */
import { type ChildProcess, spawn, spawnSync } from 'child_process'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

import { TCP_TOKEN_HEADER } from '../src/cli/engine/transportAuth'
import { errorMessage } from '../src/util/errorMessage'
import { sleep } from '../src/util/sleep'
import { rawRequest } from './engineRequest'
import { CLI, parseLeadingJson, readTcpToken } from './util/cliHarness'

const DIR = path.join(os.tmpdir(), `edge-cli-subscribe-${process.pid}`)
const BASE = ['--fake', `--directory=${DIR}`]

// Every response this suite provokes is checked against the route's own
// `returns` cleaner, and a drift fails the suite rather than being logged
// where nobody looks. `testCliFake.ts` has always run in this mode; this one
// set nothing, so `/engine/status` over both transports and every SSE frame
// were validated against no declared shape — while the other suite's header
// advertises strict checking as a property of "the offline suites".
//
// Set on this process rather than per spawn: the six `spawn`/`spawnSync`
// calls below pass no `env`, so they inherit it, and so does the engine the
// client spawns.
process.env.EDGE_CLI_CHECK_RESPONSES = 'strict'

let failures = 0
function check(label: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`OK   ${label}`)
  else {
    failures++
    console.error(`FAIL ${label}${detail !== '' ? ` — ${detail}` : ''}`)
  }
}

/**
 * A case this host cannot run.
 *
 * Its own word, because `check(label, true)` printed `OK` for a case that
 * did nothing and the suite's closing line is "all checks passed" — which is
 * the shape of every other "machinery that passes while not measuring" this
 * review has found.
 */
function skip(label: string, why: string): void {
  console.log(`SKIP ${label} — ${why}`)
}

/**
 * One CLI invocation, with a deadline.
 *
 * `testCli.ts` has always passed one; this helper did not, and two cases
 * below invoke `subscribe` — a command that streams until the engine closes
 * the connection. They terminate today only because the engine refuses an
 * unknown `--session-id` before it attaches an SSE client, which is the very
 * guard those cases exist to pin: if it moved below `addSseClient`, the
 * engine would attach a client and never close it, and `spawnSync` would
 * block for ever. A CI job would hang to its external timeout instead of
 * failing a check, which is the worst way for a suite to report a
 * regression.
 */
function cli(...args: string[]): { status: number; out: string } {
  const result = spawnSync('node', [...CLI, ...BASE, ...args], {
    encoding: 'utf8',
    timeout: 60_000
  })
  const out = (result.stdout ?? '') + (result.stderr ?? '')
  if (result.error != null) {
    // A timeout arrives as an `error` with `status: null`, so without this a
    // hung command read as exit -1 and whatever text had arrived.
    return {
      status: result.status ?? -1,
      out: `${out}\nspawn failed: ${result.error.message}`
    }
  }
  return { status: result.status ?? -1, out }
}

/**
 * Everything the suite creates, torn down whatever happens.
 *
 * `main` had no `try`/`finally` and the only error path was the top-level
 * `.catch`, which removed `DIR` and exited — so any throw mid-suite left
 * four engines running, two subscriber children orphaned, and three temp
 * directories behind. Those engines keep their
 * `~/.edge-cli/run/<profile>/engine.json`, so the *next* run's
 * `readTcpToken` can find a stale engine that happens to name the same port
 * — ports collide whenever two pids differ by 200 — and the Origin and Host
 * checks then fail against the wrong engine's token, spuriously.
 */
const cleanup: Array<() => void> = []

function runCleanup(): void {
  // Reverse order, so an engine is stopped before its data directory goes.
  for (const task of cleanup.reverse()) {
    try {
      task()
    } catch {
      // Best effort: one failure must not strand the rest.
    }
  }
  cleanup.length = 0
}

/**
 * Stop an engine for `dir` and remove the directory, on the way out.
 *
 * `engine-stop` rather than a kill, so the engine unlinks its own run file
 * and socket: a leaked run directory still holds a `session.json`, which is
 * a bearer token.
 */
function registerEngine(dir: string): void {
  cleanup.push(() => {
    spawnSync('node', [...CLI, '--fake', `--directory=${dir}`, 'engine-stop'], {
      encoding: 'utf8',
      timeout: 30_000
    })
    fs.rmSync(dir, { recursive: true, force: true })
  })
}

/** Kill a child the suite spawned, so a throw cannot orphan it. */
function registerChild(child: ChildProcess): void {
  cleanup.push(() => {
    if (child.exitCode == null && child.signalCode == null)
      child.kill('SIGKILL')
  })
}

async function main(): Promise<void> {
  // The suite's own engine and data directory, so a throw anywhere below
  // still stops it.
  registerEngine(DIR)
  fs.mkdirSync(DIR, { recursive: true })

  const status = cli('engine-status')
  check('engine starts', status.status === 0, status.out.slice(0, 200))

  // The two scope flags the route declares and the published usage line
  // advertises. The hand-written command accepted only `--type`, so these
  // died at the parser with `Unknown option` and exit 2 — the account-scoped
  // stream the engine supports had no CLI path at all. An unknown session is
  // the right refusal here; `Unknown option` is not.
  const sessionFlag = cli('subscribe', '--session-id=sess_nosuchsession')
  check(
    'subscribe accepts --session-id',
    sessionFlag.status !== 2 && !sessionFlag.out.includes('Unknown option'),
    sessionFlag.out.slice(0, 200)
  )
  const walletFlag = cli(
    'subscribe',
    '--session-id=sess_nosuchsession',
    '--wallet-id=w'
  )
  check(
    'subscribe accepts --wallet-id',
    walletFlag.status !== 2 && !walletFlag.out.includes('Unknown option'),
    walletFlag.out.slice(0, 200)
  )

  let subOut = ''
  const sub: ChildProcess = spawn('node', [...CLI, ...BASE, 'subscribe'], {
    stdio: ['ignore', 'pipe', 'pipe']
  })
  registerChild(sub)
  sub.stdout?.on('data', d => (subOut += String(d)))
  sub.stderr?.on('data', d => (subOut += String(d)))
  const subExit = new Promise<number>(resolve => {
    sub.on('exit', code => {
      resolve(code ?? -1)
    })
  })
  await sleep(2500)

  const held = cli('engine-status')
  check(
    'a subscriber holds off idle shutdown',
    /"idleShutdownAt":\s*null/.test(held.out) &&
      /"sessionCount":\s*0/.test(held.out),
    held.out.slice(0, 200)
  )

  const concurrent = cli('local-users')
  check(
    'one-shot commands run while subscribed',
    concurrent.status === 0 && concurrent.out.includes('localUsers'),
    concurrent.out.slice(0, 200)
  )

  const stopped = cli('engine-stop')
  check('engine-stop succeeds', stopped.status === 0, stopped.out.slice(0, 200))

  const code = await Promise.race([subExit, sleep(8000).then(() => -2)])
  check('subscriber exits when the engine stops', code === 7, `exit ${code}`)
  check(
    'subscriber is told why the stream ended',
    subOut.includes('engineShutdown'),
    subOut.slice(0, 300)
  )

  // A session-scoped stream has to be closed by that session's logout. Every
  // client used to be context-scoped, so `closeScope` matched nothing and the
  // published reference promised a teardown that could not happen.
  const scoped = await (async (): Promise<string> => {
    const created = cli(
      'create-account',
      `--username=sub${process.pid}`,
      '--password=Aa1!aaaaaa',
      '--pin=1234'
    )
    check(
      'create-account for the scope check',
      created.status === 0,
      created.out.slice(0, 200)
    )
    const statusOut = cli('engine-status').out
    const socketPath = /"socketPath":\s*"([^"]+)"/.exec(statusOut)?.[1] ?? ''
    const sessionId = JSON.parse(
      fs.readFileSync(
        path.join(path.dirname(socketPath), 'session.json'),
        'utf8'
      )
    ).sessionId as string

    let frames = ''
    await new Promise<void>(resolve => {
      // Both timers are cleared on the way out, whichever path settles this.
      // The ordinary one is the logout ending the stream at 1 s, and the 6 s
      // deadline then stayed armed — holding the event loop open for five
      // seconds after the case was over, and finally calling `destroy()` on
      // a request that had already finished.
      const timers: NodeJS.Timeout[] = []
      const settle = (): void => {
        for (const timer of timers) clearTimeout(timer)
        resolve()
      }
      const req = http.request(
        {
          socketPath,
          method: 'GET',
          path: `/engine/events?sessionId=${sessionId}`,
          headers: { Accept: 'text/event-stream' }
        },
        res => {
          res.setEncoding('utf8')
          res.on('data', (chunk: string) => {
            frames += chunk
          })
          res.on('end', settle)
        }
      )
      req.on('error', settle)
      req.end()
      // Give the stream a moment to open, then log out underneath it.
      timers.push(
        setTimeout(() => {
          cli('logout')
        }, 1000),
        setTimeout(() => {
          req.destroy()
          settle()
        }, 6000)
      )
    })
    return frames
  })()
  check(
    'a session-scoped stream is closed by that session logging out',
    scoped.includes('subscription.closed') &&
      scoped.includes('"reason":"logout"'),
    scoped.replace(/\s+/g, ' ').slice(0, 200)
  )

  // Ctrl-C on a subscription that is *already streaming*, which is the case
  // the exit code exists for: a supervisor or a `while edge-cli subscribe
  // …; do` loop has to tell an operator's interrupt from the engine ending
  // the stream normally, and without the fix this exited **0** — the same
  // value a normal end produces. The cold-start case below keeps its looser
  // accept for the reason its own comment gives; here the engine is up and
  // the stream is open, so 130 is the only right answer.
  const liveDir = `${DIR}-live`
  registerEngine(liveDir)
  fs.mkdirSync(liveDir, { recursive: true })
  // Start the engine first, so the signal cannot land during a spawn.
  spawnSync('node', [
    ...CLI,
    '--fake',
    `--directory=${liveDir}`,
    'engine-status'
  ])
  const live: ChildProcess = spawn(
    'node',
    [...CLI, '--fake', `--directory=${liveDir}`, 'subscribe'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  registerChild(live)
  let liveExited = false
  const liveExit = new Promise<string>(resolve => {
    live.on('exit', (code, signal) => {
      liveExited = true
      resolve(signal != null ? `signal ${signal}` : `code ${code ?? -1}`)
    })
  })
  // The engine is already up, so the only work before the stream opens is
  // the readiness ping and the HTTP GET. The engine sends no frame on
  // connect — there is nothing to wait *for* on stdout — so this waits long
  // enough that the stream is certainly open, and then checks the process is
  // still there, which is what distinguishes "streaming" from "exited
  // early".
  await sleep(3000)
  check('the subscription was still streaming', !liveExited, 'exited early')
  live.kill('SIGINT')
  const liveCode = await Promise.race([
    liveExit,
    sleep(15000).then(() => 'HUNG')
  ])
  check(
    'Ctrl-C on an open subscription exits 130',
    liveCode === 'code 130',
    liveCode
  )
  spawnSync('node', [...CLI, '--fake', `--directory=${liveDir}`, 'engine-stop'])
  fs.rmSync(liveDir, { recursive: true, force: true })

  // Ctrl-C while the engine is still spawning. The abort lands before the
  // stream request exists, so it is only observable by re-checking the signal
  // on the second attempt; without that, `subscribe` opened the stream after
  // the spawn and swallowed every later signal.
  const coldDir = `${DIR}-cold`
  registerEngine(coldDir)
  fs.mkdirSync(coldDir, { recursive: true })
  const cold: ChildProcess = spawn(
    'node',
    [...CLI, '--fake', `--directory=${coldDir}`, 'subscribe'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  registerChild(cold)
  const coldExit = new Promise<string>(resolve => {
    cold.on('exit', (code, signal) => {
      // Either outcome is a prompt exit. Under load the signal can arrive
      // before `subscribe` has registered its handler, and Node's own
      // terminate-on-SIGINT takes it — which is equally fine, and is why this
      // accepts a signalled exit rather than only codes 0 and 130.
      resolve(signal != null ? `signal ${signal}` : `code ${code ?? -1}`)
    })
  })
  await sleep(300)
  cold.kill('SIGINT')
  const coldCode = await Promise.race([
    coldExit,
    sleep(15000).then(() => 'HUNG')
  ])
  check(
    'Ctrl-C during a cold start exits',
    coldCode === 'code 0' ||
      coldCode === 'code 130' ||
      coldCode === 'signal SIGINT',
    coldCode
  )
  spawnSync('node', [...CLI, '--fake', `--directory=${coldDir}`, 'engine-stop'])
  fs.rmSync(coldDir, { recursive: true, force: true })

  // Claim 3, on the *same* engine. Asserting it against a fresh engine
  // started after `engine-stop` never executed the path the contract is
  // about: `EventHub.onClientsChanged` -> `IdleShutdown.notifySubscribersChanged`
  // when the last subscriber detaches.
  const detachDir = `${DIR}-detach`
  registerEngine(detachDir)
  fs.mkdirSync(detachDir, { recursive: true })
  const detachBase = ['--fake', `--directory=${detachDir}`]
  const detachCli = (...args: string[]): { status: number; out: string } => {
    const result = spawnSync('node', [...CLI, ...detachBase, ...args], {
      encoding: 'utf8'
    })
    return { status: result.status ?? -1, out: result.stdout + result.stderr }
  }
  detachCli('engine-status')
  const detachSub: ChildProcess = spawn(
    'node',
    [...CLI, ...detachBase, 'subscribe'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  registerChild(detachSub)
  detachSub.stdout?.resume()
  detachSub.stderr?.resume()
  const detachExit = new Promise<number>(resolve => {
    detachSub.on('exit', code => {
      resolve(code ?? -1)
    })
  })
  await sleep(2500)
  const whileHeld = detachCli('engine-status')
  check(
    'the idle timer is disarmed while a subscriber is attached',
    /"idleShutdownAt":\s*null/.test(whileHeld.out),
    whileHeld.out.slice(0, 200)
  )

  // Kill only the subscriber: the engine stays up.
  detachSub.kill('SIGINT')
  await Promise.race([detachExit, sleep(8000)])
  await sleep(500)
  const afterDetach = detachCli('engine-status')
  check(
    'the idle timer re-arms on the same engine when the last subscriber detaches',
    /"idleShutdownAt":\s*"/.test(afterDetach.out),
    afterDetach.out.slice(0, 200)
  )
  detachCli('engine-stop')
  fs.rmSync(detachDir, { recursive: true, force: true })

  // A fresh engine must re-arm its idle timer with no subscriber attached.
  const rearmed = cli('engine-status')
  check(
    'idle timer re-arms with no subscriber',
    /"idleShutdownAt":\s*"/.test(rearmed.out),
    rearmed.out.slice(0, 200)
  )
  cli('engine-stop')

  // The TCP transport is documented and published in the reference, and its
  // only test needed tester servers, so it had no offline coverage at all.
  const tcpDir = `${DIR}-tcp`
  registerEngine(tcpDir)
  fs.mkdirSync(tcpDir, { recursive: true })
  const tcpPort = 45700 + (process.pid % 200)
  const tcpBase = ['--fake', `--directory=${tcpDir}`, `--tcp=${tcpPort}`]
  const viaUnix = spawnSync('node', [...CLI, ...tcpBase, 'engine-status'], {
    encoding: 'utf8'
  })
  check(
    'an engine with --tcp still answers on its unix socket',
    (viaUnix.status ?? -1) === 0,
    (viaUnix.stdout + viaUnix.stderr).slice(0, 200)
  )

  /**
   * One raw TCP request, with whatever headers the case is testing.
   *
   * Through `engineRequest`'s `rawRequest`, which owns the sockets: this was
   * one of five hand-rolled clients beside the module whose docstring says it
   * ended exactly that, and the copies had diverged — two of them carried
   * neither `res.on('error')`, nor `res.on('aborted')`, nor a deadline. Every
   * case here is about a request the engine *refuses*, so the failure is
   * recorded rather than thrown: a thrown transport error would stop the
   * suite where a `status: 0` fails the one check it belongs to.
   */
  const tcpRequest = async (
    headers: Record<string, string>,
    reqPath = '/engine/status',
    opts: { method?: string; body?: string } = {}
  ): Promise<{ status: number; raw: string }> => {
    try {
      return await rawRequest(
        { host: '127.0.0.1', port: tcpPort },
        opts.method ?? 'GET',
        reqPath,
        { headers, rawBody: opts.body, timeoutMs: 30_000 }
      )
    } catch (error: unknown) {
      return {
        status: 0,
        raw: `ERROR ${errorMessage(error)}`
      }
    }
  }

  const unauthorized = await tcpRequest({})
  check(
    'TCP refuses a request with no token',
    unauthorized.status === 401 && unauthorized.raw.includes('UNAUTHORIZED'),
    `status=${unauthorized.status} ${unauthorized.raw
      .replace(/\s+/g, ' ')
      .slice(0, 160)}`
  )

  const tcpToken = readTcpToken(tcpPort)
  check(
    'the run file carries a TCP token',
    tcpToken != null && tcpToken.length >= 40,
    String(tcpToken)
  )

  // A rejected TCP request is the only sign of a probe or a brute-force
  // attempt, and nothing recorded it. It is also the one request that must
  // not reach `idle.touch()`: before the guard was hoisted above the idle
  // clock, each rejection pushed `idleShutdownAt` out by a full
  // `--idle-timeout`, so an unauthenticated poller could hold the daemon
  // open for good.
  const logText = ((): string => {
    const dir = path.join(os.homedir(), '.edge-cli', 'logs')
    try {
      return fs
        .readdirSync(dir)
        .filter(name => name.startsWith('engine-'))
        .map(name => {
          const file = path.join(dir, name)
          return { file, mtime: fs.statSync(file).mtimeMs }
        })
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, 3)
        .map(({ file }) => fs.readFileSync(file, 'utf8'))
        .join('\n')
    } catch {
      return ''
    }
  })()
  check(
    'a rejected TCP request is logged',
    logText.includes('Rejected a TCP request'),
    logText.slice(-200).replace(/\s+/g, ' ')
  )

  const wrongOrigin = await tcpRequest({
    [TCP_TOKEN_HEADER]: tcpToken ?? '',
    Origin: 'https://evil.example'
  })
  check(
    'TCP refuses a request carrying Origin',
    wrongOrigin.status === 403 && wrongOrigin.raw.includes('FORBIDDEN'),
    `status=${wrongOrigin.status}`
  )

  const wrongHost = await tcpRequest({
    [TCP_TOKEN_HEADER]: tcpToken ?? '',
    Host: `evil.example:${tcpPort}`
  })
  check(
    'TCP refuses a foreign Host header',
    wrongHost.status === 403 && wrongHost.raw.includes('FORBIDDEN'),
    `status=${wrongHost.status}`
  )

  // Three published codes the CLI client cannot produce, because it never
  // makes a raw request: a wrong method, a wrong content type, and an
  // oversized body. The gates check that a *declared* code is in the
  // catalogue, never that a catalogued code can be produced, so these arms
  // could rot silently.
  const wrongMethod = await tcpRequest(
    { [TCP_TOKEN_HEADER]: readTcpToken(tcpPort) ?? '' },
    '/engine/stop'
  )
  check(
    'TCP answers a wrong method with 405',
    wrongMethod.status === 405 &&
      wrongMethod.raw.includes('METHOD_NOT_ALLOWED'),
    `status=${wrongMethod.status}`
  )

  const token = readTcpToken(tcpPort) ?? ''
  const rawPost = async (
    headers: Record<string, string>,
    payload: string
  ): Promise<{ status: number; raw: string }> =>
    await tcpRequest(
      { [TCP_TOKEN_HEADER]: token, ...headers },
      '/rates/query',
      { method: 'POST', body: payload }
    )

  const wrongType = await rawPost({ 'Content-Type': 'text/plain' }, '{}')
  check(
    'TCP answers a non-JSON content type with 415',
    wrongType.status === 415 &&
      wrongType.raw.includes('UNSUPPORTED_MEDIA_TYPE'),
    `status=${wrongType.status}`
  )

  // `tcpRequest` with a token header, which is all this ever was: it was
  // declared in the same scope as `tcpRequest` and repeated its twenty-five
  // lines, minus the error, aborted and timeout handling.
  const tcpStatus = (await tcpRequest({ [TCP_TOKEN_HEADER]: tcpToken ?? '' }))
    .raw
  // Field by field against what *this* engine answers over its own unix
  // socket, because the claim is that it is the same engine: two field names
  // appearing proves only that something answered, and a second engine
  // passes that. Its own directory, not the suite's: the TCP engine has its
  // own profile, so the suite's `cli()` would reach a different daemon and
  // the check would fail for the wrong reason.
  const unixRun = spawnSync(
    'node',
    [...CLI, '--fake', `--directory=${tcpDir}`, 'engine-status'],
    { encoding: 'utf8' }
  )
  const unixStatus = parseLeadingJson(
    (unixRun.stdout ?? '') + (unixRun.stderr ?? '')
  )
  const tcpJson = parseLeadingJson(tcpStatus)
  check(
    'the same engine answers /engine/status over TCP',
    tcpJson != null &&
      unixStatus != null &&
      tcpJson.pid === unixStatus.pid &&
      tcpJson.apiVersion === unixStatus.apiVersion &&
      tcpJson.socketPath === unixStatus.socketPath,
    `tcp=${JSON.stringify({
      pid: tcpJson?.pid,
      apiVersion: tcpJson?.apiVersion
    })} unix=${JSON.stringify({
      pid: unixStatus?.pid,
      apiVersion: unixStatus?.apiVersion
    })}`
  )

  // Last of the TCP checks: this arm answers and then drops the connection,
  // so the rest of the oversized upload is never read into memory, which
  // upsets any request that follows it on the same keep-alive socket.
  const tooBig = await rawPost(
    { 'Content-Type': 'application/json', 'Content-Length': '9999999' },
    '{}'
  )
  check(
    'TCP answers an oversized declared body with 413',
    tooBig.status === 413 && tooBig.raw.includes('PAYLOAD_TOO_LARGE'),
    `status=${tooBig.status}`
  )

  // `--tcp-host` defaults to loopback and refuses anything else, so no
  // external address answers even with a valid token.
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter(
      (info): info is os.NetworkInterfaceInfo =>
        info != null && info.family === 'IPv4' && !info.internal
    )
  if (addresses.length === 0) {
    skip(
      'the TCP listener is not reachable off-host',
      'this host has no external IPv4 address to probe'
    )
  } else {
    const external = addresses[0].address
    const reachable = await new Promise<boolean>(resolve => {
      const req = http.request(
        {
          host: external,
          port: tcpPort,
          method: 'GET',
          path: '/engine/status',
          timeout: 3000
        },
        res => {
          res.resume()
          resolve(true)
        }
      )
      req.on('error', () => {
        resolve(false)
      })
      req.on('timeout', () => {
        req.destroy()
        resolve(false)
      })
      req.end()
    })
    check(
      `the TCP listener is not reachable on ${external}`,
      !reachable,
      'the default bind host must be loopback'
    )
  }

  spawnSync('node', [...CLI, ...tcpBase, 'engine-stop'], { encoding: 'utf8' })
  fs.rmSync(tcpDir, { recursive: true, force: true })

  // ------------------------------------------ a plugin's stray rejection
  //
  // An unhandled rejection used to be a fatal shutdown, which is Node's own
  // default and the wrong one for a daemon hosting third-party plugins in
  // its own process: one plugin rejects on a timer, so an account holding a
  // single `wallet:fio` wallet lost its engine — and with it every session,
  // every live `subscribe` stream and every object handle — 10 to 20
  // seconds after the wallet started, every time. Nothing could reach the
  // handler: the fake world registers only the plugins it builds wallets
  // for, and the handler is installed inside `main()`. So the engine makes
  // one on request, and this is the case that proves it is survivable.
  const rejectDir = path.join(os.tmpdir(), `edge-cli-reject-${process.pid}`)
  fs.mkdirSync(rejectDir, { recursive: true })
  const rejectBase = ['--fake', `--directory=${rejectDir}`]
  const rejectStatus = spawnSync(
    'node',
    [...CLI, ...rejectBase, 'engine-status'],
    {
      encoding: 'utf8',
      timeout: 60_000,
      env: { ...process.env, EDGE_CLI_TEST_UNHANDLED_REJECTION: '1' }
    }
  )
  check(
    'an engine starts with a stray rejection pending',
    (rejectStatus.status ?? -1) === 0,
    (rejectStatus.stdout + rejectStatus.stderr).slice(0, 200)
  )
  // Past the 50ms the rejection is armed for, and then some.
  const until = Date.now() + 3000
  while (Date.now() < until) {
    // Busy-wait rather than a timer: this script is synchronous throughout.
  }
  const afterReject = spawnSync(
    'node',
    [...CLI, ...rejectBase, '--no-spawn', 'engine-status'],
    { encoding: 'utf8', timeout: 60_000 }
  )
  check(
    'the engine survives an unhandled rejection',
    (afterReject.status ?? -1) === 0,
    (afterReject.stdout + afterReject.stderr).slice(0, 300)
  )
  // And it is reported in full. `String(error)` on a plain object is
  // `[object Object]`, which was the only diagnostic for the one failure
  // class that actually happens here — no plugin name, no chain, no stack.
  const rejectProfile = /"socketPath":\s*"([^"]+)"/.exec(afterReject.stdout)
  let rejectLog = ''
  if (rejectProfile != null) {
    const logFile = path.join(
      os.homedir(),
      '.edge-cli',
      'logs',
      `engine-${path.basename(path.dirname(rejectProfile[1]))}.log`
    )
    try {
      rejectLog = fs.readFileSync(logFile, 'utf8')
    } catch {
      rejectLog = ''
    }
  }
  check(
    'the rejected value is logged, not "[object Object]"',
    rejectLog.includes('unhandled rejection') &&
      rejectLog.includes('edge-cli-test-rejection') &&
      !rejectLog.includes('[object Object]'),
    rejectLog.slice(-300)
  )
  spawnSync('node', [...CLI, ...rejectBase, 'engine-stop'], {
    encoding: 'utf8'
  })
  fs.rmSync(rejectDir, { recursive: true, force: true })

  fs.rmSync(DIR, { recursive: true, force: true })
  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\ntestCliSubscribe: all checks passed')
}

main()
  .then(() => {
    runCleanup()
  })
  .catch((error: unknown) => {
    console.error(error)
    runCleanup()
    fs.rmSync(DIR, { recursive: true, force: true })
    process.exit(1)
  })
