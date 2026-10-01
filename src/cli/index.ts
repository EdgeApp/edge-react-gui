/**
 * The `edge-cli` client: argv in, JSON out.
 *
 * One process per command by default. It parses the global flags, resolves
 * the profile — a pure hash, so it needs no engine — builds the context a
 * command runs with, and lets `ApiClient` start the daemon on the first
 * request that finds nothing listening. Deferring the spawn that far means a
 * command that fails while parsing its own flags leaves no daemon behind.
 *
 * With no command it reads commands from stdin instead, one per line, over
 * the same context: the engine, the session and the flags are the same as
 * one-shot mode, which is only true because the prompt is handed the context
 * itself rather than a copy of it.
 *
 * Nothing here imports `edge-core-js`. The engine owns core; this half owns
 * argv, the socket and the output.
 */
import './bootNodeLocale'
import './commands/all'

import parse from 'lib-cmdparse'
import { red } from 'nanocolors'
import readline from 'readline'

import { ApiClient, ApiClientError } from './client/apiClient'
import { EXIT, printError } from './client/output'
import {
  clearSessionFile,
  readSessionFile,
  writeSessionFile
} from './client/sessionFile'
import { solveChallenge } from './client/solveCaptcha'
import { ensureEngine, warnIfEngineLocaleDiffers } from './client/spawnEngine'
import { readSession } from './clientResponses'
import {
  type CliContext,
  type Command,
  findCommand,
  listCommands,
  UsageError
} from './command'
import { defaultDirectory, loadConfig } from './engine/cliConfig'
import { profileHash, socketPathFor } from './engine/discovery'
import { parseTcpPort } from './engine/tcpPort'
import { TESTER_SERVERS } from './engine/testerServers'
import { type CliOptions, parseCliArgs, showCliHelp } from './parseArgs'

function formatUsage(cmd: {
  name: string
  usage?: string
  needsSession?: boolean
}): string {
  // Every usage string starts with its own command name — `docs:api:verify`
  // enforces that — so prepending the name again would print it twice.
  const body = cmd.usage ?? cmd.name
  let out = `Usage: edge-cli ${body}`
  if (cmd.needsSession === true) out += ' [--session <id>]'
  return out
}

/**
 * The `--tcp` port, validated here rather than forwarded.
 *
 * The shared validator, reported the way the client reports bad argv:
 * `Number('abc')` is `NaN`, which reached the engine as `--tcp=NaN` and cost
 * the caller a 30-second spawn timeout followed by the engine's stack inside
 * the error envelope.
 */
/**
 * `--timeout=<seconds>`, as milliseconds.
 *
 * On expiry the client destroys its socket while the engine runs the request
 * to completion, so a caller needs to be able to ask for longer — the
 * documented "Expensive" routes and a whole-wallet `get-transactions` can
 * outrun the default, and for `broadcast-tx` the report would be a failure
 * after the funds had left.
 */
function clientTimeoutMs(raw: string | undefined): number | undefined {
  if (raw == null) return undefined
  const seconds = Number(raw)
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new UsageError(
      undefined,
      `Invalid --timeout "${raw}": expected a positive number of seconds`
    )
  }
  return seconds * 1000
}

function clientTcpPort(raw: string | undefined): number | null {
  try {
    return parseTcpPort(raw)
  } catch (error: unknown) {
    throw new UsageError(
      undefined,
      error instanceof Error ? error.message : String(error)
    )
  }
}

/**
 * `CliOptions` itself, not a copy of nine of its fields.
 *
 * The inline shape had to be edited alongside `CliOptions` for every new
 * global flag, and a field left out of it is simply invisible here.
 */
async function buildContext(options: CliOptions): Promise<CliContext> {
  const fileConfig = loadConfig(options.config)
  const appId = options['app-id'] ?? fileConfig.appId ?? ''
  const directory =
    options.directory ??
    fileConfig.directory ??
    fileConfig.workingDir ??
    defaultDirectory()
  const testMode = options.test === true || fileConfig.testMode === true
  // The *explicit* key only. A key from the config file is left to the
  // engine, which reads the same file: forwarding it made `makeCoreContext`
  // read it as an operator override and silently turn off HMAC request
  // signing and the native signer.
  const apiKey = options['api-key']

  const fake = options.fake === true
  // From the same constant the engine derives it from. The profile hash must
  // match on both sides or the client spawns an engine under one profile and
  // then polls a socket under another — a 30-second "Timed out waiting for
  // engine to start" with a healthy engine running — so this is load-bearing,
  // not cosmetic.
  const loginServer = fake
    ? 'fake://login'
    : testMode
    ? TESTER_SERVERS.loginServer
    : undefined
  const engineOpts = {
    appId,
    directory,
    testMode,
    fake,
    apiKey,
    configPath: options.config,
    noSpawn: options['no-spawn'] === true,
    tcpPort: clientTcpPort(options.tcp),
    loginServer
  }

  // The profile is a pure hash of these four, so it needs no engine. Defer the
  // spawn to the first request: a command that fails while parsing its own
  // flags, or because it needs a session there isn't one for, then leaves no
  // daemon behind — and with no `-t` that daemon would point at production.
  const profile = profileHash({ appId, directory, testMode, loginServer })
  const client = new ApiClient({
    socketPath: socketPathFor(profile),
    timeoutMs: clientTimeoutMs(options.timeout),
    onConnectFail: async () => {
      await ensureEngine(engineOpts)
    },
    // The one place the locale mismatch is reported. It needs a live engine,
    // so it rides on the first request that reaches one rather than on
    // building the context, which would spawn an engine for a command that
    // never runs.
    onFirstResponse: warnIfEngineLocaleDiffers
  })

  const envSession = process.env.EDGE_CLI_SESSION
  const fileSession = readSessionFile(profile)

  const ctx: CliContext = {
    client,
    profile,
    // The field is the one copy. A closure variable beside it was only ever
    // written, never read, which read as if it were the source of truth.
    sessionId: options.session ?? envSession ?? fileSession?.sessionId ?? null,
    testMode,
    setSessionId(id, username) {
      ctx.sessionId = id
      if (id == null) clearSessionFile(profile)
      else writeSessionFile(profile, id, username)
    }
  }
  return ctx
}

async function maybeSolveAndRetry<T>(
  solve: boolean,
  run: (challengeId?: string) => Promise<T>
): Promise<T> {
  try {
    return await run()
  } catch (error: unknown) {
    if (
      !solve ||
      !(error instanceof ApiClientError) ||
      error.code !== 'CHALLENGE_REQUIRED' ||
      error.details == null
    ) {
      throw error
    }
    const challengeId = await solveChallenge({
      challengeId: String(error.details.challengeId),
      challengeUri:
        typeof error.details.challengeUri === 'string'
          ? error.details.challengeUri
          : undefined
    })
    return await run(challengeId)
  }
}

async function runPrompt(
  ctx: CliContext,
  solveCaptcha: boolean
): Promise<number> {
  const interactive = process.stdin.isTTY
  if (interactive) {
    console.log('Use the `help` command for usage information')
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: interactive ? '> ' : '',
    completer(line: string) {
      const commands = listCommands()
      const match = commands.filter(c => c.startsWith(line))
      return [match.length > 0 ? match : commands, line]
    }
  })
  if (interactive) rl.prompt()

  let worst: number = EXIT.OK

  // `for await` runs one line at a time and ends at EOF, so a piped script
  // reaches its last command. Asking for lines one at a time and resolving on
  // `close` dropped everything after the first, because EOF arrived while the
  // first command was still awaiting.
  for await (const text of rl) {
    const trimmed = text.trim()
    if (trimmed === 'exit' || trimmed === 'quit') break
    try {
      const parsed = parse(text)
      if (parsed.exec != null) {
        const cmd = findCommand(parsed.exec)
        if (cmd.needsSession === true && ctx.sessionId == null) {
          throw new UsageError(cmd, 'Please log in first')
        }
        await invokeCommand(ctx, cmd, parsed.args, solveCaptcha)
      }
    } catch (error: unknown) {
      if (error instanceof UsageError) {
        console.error(red(error.message))
        if (error.command != null) console.error(formatUsage(error.command))
        worst = worst === EXIT.OK ? EXIT.USAGE : worst
      } else {
        // The worst code any command produced, so a piped chain fails the way
        // the same commands would one-shot. This loop exists so that a piped
        // script reaches its last command, and discarding `printError`'s
        // return made the documented exit-code table unobservable in exactly
        // that mode.
        const code = printError(error)
        if (code !== EXIT.OK) worst = code
      }
    }
    if (interactive) rl.prompt()
  }
  rl.close()
  return worst
}

/**
 * Run a command, solving a CAPTCHA and retrying once when asked to.
 *
 * Keyed off the thrown error rather than a list of command names, so the flag
 * works for every command a challenge can reach and cannot rot as commands are
 * renamed. Shared by one-shot mode and the prompt, which the guide says behave
 * the same.
 */
/**
 * A session the engine has thrown away must not be sent again.
 *
 * `session.json` is removed when the *engine* stops, which an auto-logout
 * does not do, so without this every later invocation re-read the dead bearer
 * token off disk and failed 401 indefinitely — and in the prompt the
 * `needsSession` guard kept passing, so an account command reported
 * `INVALID_SESSION` rather than "Please log in first".
 */
function forgetDeadSession(ctx: CliContext, error: unknown): void {
  if (!(error instanceof ApiClientError)) return
  if (error.code !== 'INVALID_SESSION' && error.code !== 'SESSION_EXPIRED') {
    return
  }
  if (ctx.sessionId == null) return
  ctx.setSessionId(null)
}

async function invokeCommand(
  ctx: CliContext,
  cmd: Command,
  argv: string[],
  solveCaptcha: boolean
): Promise<void> {
  try {
    // Through `maybeSolveAndRetry`, which already encapsulates "on
    // CHALLENGE_REQUIRED, solve and retry once". This re-implemented it
    // inline, including a verbatim copy of the `solveChallenge({ … })` block.
    await maybeSolveAndRetry(solveCaptcha, async challengeId => {
      ctx.challengeId = challengeId
      try {
        await cmd.invoke(ctx, argv)
      } finally {
        // A challenge id is single-use. In the prompt the context outlives
        // the command, so leaving it set made every later login send an
        // already-consumed id that the login server has to reject before a
        // fresh one can be solved.
        ctx.challengeId = undefined
      }
    })
  } catch (error: unknown) {
    forgetDeadSession(ctx, error)
    throw error
  }
}

async function main(): Promise<number> {
  const { argv, options } = parseCliArgs(process.argv.slice(2))

  if (options.help === true && argv.length === 0) {
    showCliHelp()
    console.log('Commands:')
    for (const name of listCommands()) console.log(`  ${name}`)
    return EXIT.OK
  }

  // `help` is answered from the committed help table, so it must not build a
  // context: that auto-spawns an engine, and without `-t` the daemon it leaves
  // running points at production.
  const wantsHelp = options.help === true || argv[0] === 'help'
  if (wantsHelp) {
    const helpCmd = findCommand('help')
    await helpCmd.invoke(
      {
        client: null as never,
        profile: '',
        sessionId: null,
        setSessionId: () => {},
        testMode: false
      },
      argv[0] === 'help' ? argv.slice(1) : argv
    )
    return EXIT.OK
  }

  // Resolve the command before building a context. `buildContext` auto-spawns
  // the engine, so validating the name afterwards meant a typo left a daemon
  // running — and with no `-t`, a production daemon on the default data
  // directory. A command that does not exist never needs an engine.
  const name = argv.length > 0 ? argv[0] : null
  const cmd = name != null ? findCommand(name) : null
  if (cmd != null) argv.shift()

  const ctx = await buildContext(options)
  const solveCaptcha = options['solve-captcha'] === true

  if (cmd == null) {
    // The context itself, not a spread copy. `setSessionId` is a method on
    // the object literal `buildContext` built and assigns to *that* object,
    // so a copy read its own boot-time `sessionId` forever: a login inside
    // the prompt stored the id on the original and in `session.json` while
    // the prompt's `needsSession` guard still saw null, so the next account
    // command died with "Please log in first" on an account that was logged
    // in — and `forgetDeadSession` cleared the original while the copy kept
    // the dead id, so a 401 repeated for the life of the prompt.
    ctx.interactive = true
    return await runPrompt(ctx, solveCaptcha)
  }

  if (cmd.needsSession === true && ctx.sessionId == null) {
    // Legacy helper: -u/-p auto password-login
    if (options.username != null && options.password != null) {
      const session = await maybeSolveAndRetry(
        solveCaptcha,
        async challengeId =>
          // Cleaned, not an inline shape: this is the fourth place the
          // session was declared by hand, and the `sessionId` it reads is
          // what `setSessionId` writes to the 0600 session file.
          readSession(
            await ctx.client.post('/login-with-password', {
              username: options.username,
              password: options.password,
              challengeId
            }),
            'login-with-password'
          )
      )
      ctx.setSessionId(session.sessionId, session.username)
    } else {
      throw new UsageError(cmd, 'Please log in first (no sessionId)')
    }
  }

  await invokeCommand(ctx, cmd, argv, solveCaptcha)

  return EXIT.OK
}

main()
  .then(code => {
    // `process.exitCode` rather than `process.exit`: stdout writes are async
    // on a pipe, and the documented usage pipes into jq, so `process.exit`
    // truncated the largest responses at the pipe buffer. `wallet-tokens` is
    // the biggest of them — tens of KB on an EVM chain, not the megabytes an
    // earlier version of this comment claimed; the truncation is about the
    // 64KB pipe buffer, not about megabytes.
    //
    // A command that set its own code keeps it: `subscribe` reports why the
    // stream ended and still resolves normally, so an unconditional
    // assignment here would overwrite that with 0.
    if (code !== EXIT.OK) process.exitCode = code
    else process.exitCode ??= code
  })
  .catch((error: unknown) => {
    if (error instanceof UsageError) {
      console.error(
        JSON.stringify(
          {
            error: {
              code: 'USAGE',
              message: error.message,
              status: 400
            }
          },
          null,
          2
        )
      )
      // The prompt prints the usage line on a usage error; one-shot mode did
      // not, so a reader got "Incorrect arguments" with no hint which flag was
      // wrong. Usage goes to stderr, keeping stdout machine-readable.
      if (error.command != null) console.error(formatUsage(error.command))
      process.exitCode = EXIT.USAGE
      return
    }
    const code = printError(error)
    process.exitCode = code
  })
