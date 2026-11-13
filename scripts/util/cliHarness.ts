/**
 * What the CLI's test scripts share.
 *
 * One `EDGE_CLI_BIN` / `CLI` block, so a change to how the suites are
 * pointed at a built bundle happens once.
 */
import { type ChildProcess, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

import { solveCaptcha } from '../../src/cli/client/solveCaptcha'
import { cliRunRoot } from '../../src/cli/engine/cliHome'
import { RUN_FILE_NAME } from '../../src/cli/engine/runFile'

/**
 * Enough of `engineRequest`'s answer for the CAPTCHA retry.
 *
 * Structural rather than imported: `scripts/engineRequest.ts` is a sibling
 * of the suites and not of this module, and the retry needs only the status
 * and the error envelope.
 */
interface Rawish {
  status: number
  json?: any
}

/** `engineRequest`, as the suites pass it in. */
type EngineRequest = (
  socketPath: string,
  method: string,
  urlPath: string,
  body?: unknown
) => Promise<Rawish>

/**
 * How to invoke the CLI: the sources through sucrase, or a built bundle.
 *
 * `EDGE_CLI_BIN` runs a suite against `lib/edgeCli.js` instead. Three
 * transforms produce a CLI — sucrase here, Babel for jest, and
 * `@babel/preset-env` for the rollup bundle — and only the bundle is what
 * `build:cli` produces and what `docs/EDGE_CLI.md` tells people to run, so a
 * transform-only defect is invisible to every other suite.
 */
export const CLI: string[] =
  process.env.EDGE_CLI_BIN != null
    ? [process.env.EDGE_CLI_BIN]
    : ['-r', 'sucrase/register', 'src/cli/index.ts']

/**
 * Where the CLI keeps its per-profile run directories.
 *
 * Re-exported from the engine's own declaration rather than rebuilt from
 * `os.homedir()`, so a run directory a suite names cannot stop agreeing
 * with `cliHome()`.
 */
export { cliRunRoot as runRoot }

/**
 * The TCP bearer token an engine minted, read the way a script would.
 *
 * Black-box on purpose: rather than recompute `profileHash`, this scans the
 * run root for the engine whose run file names this port. The token lives
 * only in that `0600` file, which is what authorises a TCP caller.
 *
 * Here rather than in one suite, because `testCli.ts` needs it too: its
 * unix/TCP parity probe has to send the token as `X-Edge-Token`, or the
 * guard answers 401.
 */
export function readTcpToken(port: number): string | null {
  const root = cliRunRoot()
  let names: string[] = []
  try {
    names = fs.readdirSync(root)
  } catch {
    return null
  }
  for (const name of names) {
    try {
      const raw = fs.readFileSync(path.join(root, name, RUN_FILE_NAME), 'utf8')
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

/**
 * The first balanced JSON object in some text, or null.
 *
 * Brace-counted and quote-aware rather than regexed, because the engine's
 * envelopes are pretty-printed and their `details` nest.
 *
 * This one answers `null`, because the suites read output that may be
 * anything — a usage line after an envelope, a plain message, nothing at all
 * — and a throw there would fail the harness rather than the check. The
 * caller that wants a hard failure can still raise one.
 */
export function firstJsonObject(text: string | undefined): string | null {
  if (text == null) return null
  const start = text.indexOf('{')
  if (start < 0) return null
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
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

/**
 * The leading JSON object of some output, parsed, or `undefined`.
 *
 * The wrapper the suites use. `undefined` rather than a throw for the same
 * reason `firstJsonObject` answers `null`: a check reads
 * `run.json?.error?.code` and a stream that carried no JSON is an ordinary
 * outcome.
 */
export function parseLeadingJson(text: string | undefined): any {
  const found = firstJsonObject(text)
  if (found == null) return undefined
  try {
    return JSON.parse(found)
  } catch {
    return undefined
  }
}

/**
 * A `socketPath` regexed out of `engine-status`, unescaped.
 *
 * The capture is still JSON, which only shows on Windows: every `\` of the
 * pipe name arrives doubled, and a connect to that names no pipe at all.
 */
export function socketPathOf(captured: string): string {
  return JSON.parse(`"${captured}"`)
}

/**
 * The run directory behind an engine's socket path. On Windows that is a
 * named pipe embedding the run directory under `\\?\pipe\`, where
 * `path.dirname` alone names a directory that does not exist.
 */
export function runDirOfSocket(socketPath: string): string {
  return path.dirname(socketPath.replace(/^\\\\\?\\pipe\\/, ''))
}

/**
 * Start a real engine from source and wait until it is serving.
 *
 * Shared by the three network suites: spawn `src/cli/engine/index.ts` under
 * sucrase with `-t -d <tmp>`, take the socket path from stderr's
 * `Listening on unix:` line, resolve on `Ready`, reject after a minute. The
 * match is on that whole prefix, because any other stderr line containing
 * `unix:` would capture the wrong path, and an `exit` handler rejects at
 * once for an engine that dies during boot rather than hanging the suite for
 * the full minute and then blaming a timeout.
 *
 * `-t` is not optional here. These suites talk to live servers with a funded
 * account, and `scripts/testCli.ts` asserts the engine's own config as well;
 * the flag is in the shared call so a suite cannot forget it.
 */
export async function startEngine(opts: {
  directory: string
  /** Extra engine flags, such as `--tcp=9008`. */
  args?: string[]
  idleTimeoutSeconds?: number
  timeoutMs?: number
}): Promise<{ engine: ChildProcess; socketPath: string }> {
  const { directory, args = [], idleTimeoutSeconds = 120 } = opts
  const timeoutMs = opts.timeoutMs ?? 60_000
  const engine = spawn(
    process.execPath,
    [
      '-r',
      'sucrase/register',
      'src/cli/engine/index.ts',
      '-t',
      '-d',
      directory,
      `--idle-timeout=${idleTimeoutSeconds}`,
      ...args
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )

  let socketPath = ''
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`engine did not start within ${timeoutMs}ms`))
    }, timeoutMs)
    const onExit = (code: number | null): void => {
      clearTimeout(timer)
      // The exit code, not a timeout: a bad keys.json or a plugin that throws
      // is the ordinary reason boot fails, and it says so in one second.
      reject(new Error(`engine exited early: ${code}`))
    }
    engine.on('exit', onExit)
    engine.stderr?.on('data', (buf: Buffer) => {
      const line = buf.toString()
      process.stderr.write(line)
      const found = /Listening on unix:(.+)/.exec(line)
      if (found != null) socketPath = found[1].trim()
      if (line.includes('Ready')) {
        clearTimeout(timer)
        engine.off('exit', onExit)
        resolve()
      }
    })
  })
  return { engine, socketPath }
}

/**
 * The credentials the three network suites create and log in with.
 *
 * `pin` only on creation; a password login does not take one.
 */
interface SuiteCredentials {
  username: string
  password: string
  pin?: string
}

/**
 * Post credentials, solve a CAPTCHA if the login server demands one, and
 * post again with the `challengeId`.
 *
 * One copy for the network suites' create and login calls. A CAPTCHA that
 * fails to solve throws "CAPTCHA failed" rather than returning the
 * `CHALLENGE_REQUIRED` envelope, because that is the diagnosis
 * `testCliCaptcha.ts` exists to give.
 *
 * The code alone is the gate here: `CHALLENGE_REQUIRED` means a challenge
 * whatever status carries it, and the suites must not fail on a status the
 * engine is free to change.
 */
async function postWithCaptcha(
  request: EngineRequest,
  socketPath: string,
  urlPath: string,
  body: Record<string, unknown>
): Promise<Rawish> {
  const first = await request(socketPath, 'POST', urlPath, body)
  if (first.json?.error?.code !== 'CHALLENGE_REQUIRED') return first

  const { challengeId, challengeUri } = first.json.error.details
  const solved = await solveCaptcha(challengeUri)
  if (!solved) throw new Error('CAPTCHA failed')
  return await request(socketPath, 'POST', urlPath, { ...body, challengeId })
}

/** `POST /create-account`, through the CAPTCHA if there is one. */
export async function createAccountWithCaptcha(
  request: EngineRequest,
  socketPath: string,
  creds: SuiteCredentials
): Promise<Rawish> {
  return await postWithCaptcha(request, socketPath, '/create-account', {
    username: creds.username,
    password: creds.password,
    pin: creds.pin
  })
}

/** `POST /login-with-password`, through the CAPTCHA if there is one. */
export async function loginWithPasswordAndCaptcha(
  request: EngineRequest,
  socketPath: string,
  creds: SuiteCredentials
): Promise<Rawish> {
  return await postWithCaptcha(request, socketPath, '/login-with-password', {
    username: creds.username,
    password: creds.password
  })
}
