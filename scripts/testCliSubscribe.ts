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

import { CLI, runRoot } from './util/cliHarness'

const DIR = path.join(os.tmpdir(), `edge-cli-subscribe-${process.pid}`)
const BASE = ['--fake', `--directory=${DIR}`]

let failures = 0
/**
 * The TCP bearer token the engine minted, read the way a script would.
 *
 * Black-box on purpose: rather than recompute `profileHash`, this scans the
 * run root for the engine whose run file names this port. The token lives
 * only in that `0600` file, which is what authorises a TCP caller.
 */
function readTcpToken(port: number): string | null {
  const root = runRoot()
  let names: string[] = []
  try {
    names = fs.readdirSync(root)
  } catch {
    return null
  }
  for (const name of names) {
    try {
      const raw = fs.readFileSync(path.join(root, name, 'engine.json'), 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed?.tcpPort === port && typeof parsed?.tcpToken === 'string') {
        return parsed.tcpToken
      }
    } catch {
      // Not this profile's run file, or it is mid-write.
    }
  }
  return null
}

function check(label: string, ok: boolean, detail = ''): void {
  if (ok) console.log(`OK   ${label}`)
  else {
    failures++
    console.error(`FAIL ${label}${detail !== '' ? ` — ${detail}` : ''}`)
  }
}

function cli(...args: string[]): { status: number; out: string } {
  const result = spawnSync('node', [...CLI, ...BASE, ...args], {
    encoding: 'utf8'
  })
  return { status: result.status ?? -1, out: result.stdout + result.stderr }
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
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
          res.on('end', resolve)
        }
      )
      req.on('error', () => {
        resolve()
      })
      req.end()
      // Give the stream a moment to open, then log out underneath it.
      setTimeout(() => {
        cli('logout')
      }, 1000)
      setTimeout(() => {
        req.destroy()
        resolve()
      }, 6000)
    })
    return frames
  })()
  check(
    'a session-scoped stream is closed by that session logging out',
    scoped.includes('subscription.closed') &&
      scoped.includes('"reason":"logout"'),
    scoped.replace(/\s+/g, ' ').slice(0, 200)
  )

  // Ctrl-C while the engine is still spawning. The abort lands before the
  // stream request exists, so it is only observable by re-checking the signal
  // on the second attempt; without that, `subscribe` opened the stream after
  // the spawn and swallowed every later signal.
  const coldDir = `${DIR}-cold`
  fs.mkdirSync(coldDir, { recursive: true })
  const cold: ChildProcess = spawn(
    'node',
    [...CLI, '--fake', `--directory=${coldDir}`, 'subscribe'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
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

  /** One raw TCP request, with whatever headers the case is testing. */
  const tcpRequest = async (
    headers: Record<string, string>,
    reqPath = '/engine/status'
  ): Promise<{ status: number; raw: string }> =>
    await new Promise(resolve => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: tcpPort,
          method: 'GET',
          path: reqPath,
          headers
        },
        res => {
          let raw = ''
          res.setEncoding('utf8')
          res.on('data', (chunk: string) => {
            raw += chunk
          })
          res.on('end', () => {
            resolve({ status: res.statusCode ?? 0, raw })
          })
        }
      )
      req.on('error', (error: Error) => {
        resolve({ status: 0, raw: `ERROR ${error.message}` })
      })
      req.end()
    })

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
    'X-Edge-Token': tcpToken ?? '',
    Origin: 'https://evil.example'
  })
  check(
    'TCP refuses a request carrying Origin',
    wrongOrigin.status === 403 && wrongOrigin.raw.includes('FORBIDDEN'),
    `status=${wrongOrigin.status}`
  )

  const wrongHost = await tcpRequest({
    'X-Edge-Token': tcpToken ?? '',
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
    { 'X-Edge-Token': readTcpToken(tcpPort) ?? '' },
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
    await new Promise(resolve => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port: tcpPort,
          method: 'POST',
          path: '/rates/query',
          headers: { 'X-Edge-Token': token, ...headers }
        },
        res => {
          let raw = ''
          res.setEncoding('utf8')
          res.on('data', (chunk: string) => {
            raw += chunk
          })
          res.on('end', () => {
            resolve({ status: res.statusCode ?? 0, raw })
          })
        }
      )
      req.on('error', (error: Error) => {
        resolve({ status: 0, raw: `ERROR ${error.message}` })
      })
      req.write(payload)
      req.end()
    })

  const wrongType = await rawPost({ 'Content-Type': 'text/plain' }, '{}')
  check(
    'TCP answers a non-JSON content type with 415',
    wrongType.status === 415 &&
      wrongType.raw.includes('UNSUPPORTED_MEDIA_TYPE'),
    `status=${wrongType.status}`
  )

  const tcpStatus = await new Promise<string>(resolve => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: tcpPort,
        method: 'GET',
        path: '/engine/status',
        headers: { 'X-Edge-Token': tcpToken ?? '' }
      },
      res => {
        let raw = ''
        res.setEncoding('utf8')
        res.on('data', (chunk: string) => {
          raw += chunk
        })
        res.on('end', () => {
          resolve(raw)
        })
      }
    )
    req.on('error', (error: Error) => {
      resolve(`ERROR ${error.message}`)
    })
    req.end()
  })
  check(
    'the same engine answers /engine/status over TCP',
    tcpStatus.includes('"socketPath"') && tcpStatus.includes('"apiVersion"'),
    tcpStatus.replace(/\s+/g, ' ').slice(0, 200)
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
    check('no external IPv4 address to probe (skipped)', true)
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

  fs.rmSync(DIR, { recursive: true, force: true })
  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\ntestCliSubscribe: all checks passed')
}

main().catch((error: unknown) => {
  console.error(error)
  fs.rmSync(DIR, { recursive: true, force: true })
  process.exit(1)
})
