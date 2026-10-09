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

import { red } from 'nanocolors'
import readline from 'readline'

import { ApiClient, ApiClientError } from './client/apiClient'
import { printUsageEnvelope } from './client/exitCodes'
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
import {
  CliConfigError,
  defaultDirectory,
  loadConfig
} from './engine/cliConfig'
import { profileHash, socketPathFor } from './engine/discovery'
import { errorMessage } from './engine/errors'
import { parseTcpPort } from './engine/tcpPort'
import { TESTER_SERVERS } from './engine/testerServers'
import { emptyToUndefined } from './envValue'
import { type CliOptions, parseCliArgs, showCliHelp } from './parseArgs'
import { splitPromptLine, UnterminatedQuoteError } from './promptLine'
import { MAX_BUDGET_MS } from './requestBudget'

function formatUsage(cmd: {
  name: string
  usage?: string
  needsSession?: boolean
}): string {
  // Every usage string starts with its own command name — generated ones by
  // construction (`cliUsage.ts` builds them from `cli.command`), hand-written
  // ones because `usagePrefix.test.ts` checks the whole registry — so
  // prepending the name again would print it twice.
  const body = cmd.usage ?? cmd.name
  let out = `Usage: edge-cli ${body}`
  if (cmd.needsSession === true) out += ' [--session <id>]'
  return out
}

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
  const ms = seconds * 1000
  // Node holds a timer's delay in a signed 32-bit integer, so
  // `http.request({ timeout })` above the ceiling warns and *clamps to
  // 1 ms*: `--timeout=1e9`, which is how a caller asks for "effectively
  // never" on the `broadcast-tx` this flag exists for, failed instantly
  // with `REQUEST_TIMEOUT` and exit 6 — the exact opposite. Refused rather
  // than clamped down, because silently waiting 24 days less than asked is
  // the same class of surprise. `MAX_BUDGET_MS` is the ceiling the engine
  // already applies to the budget header this value becomes.
  if (ms > MAX_BUDGET_MS) {
    throw new UsageError(
      undefined,
      `Invalid --timeout "${raw}": at most ${Math.floor(
        MAX_BUDGET_MS / 1000
      )} seconds, Node's timer ceiling`
    )
  }
  return ms
}

/**
 * The `--tcp` port, validated here rather than forwarded.
 *
 * The shared validator, reported the way the client reports bad argv:
 * `Number('abc')` is `NaN`, which reached the engine as `--tcp=NaN` and cost
 * the caller a 30-second spawn timeout followed by the engine's stack inside
 * the error envelope.
 */
function clientTcpPort(raw: string | undefined): number | null {
  try {
    return parseTcpPort(raw)
  } catch (error: unknown) {
    throw new UsageError(undefined, errorMessage(error))
  }
}

/**
 * `CliOptions` itself, not a copy of nine of its fields.
 *
 * The inline shape had to be edited alongside `CliOptions` for every new
 * global flag, and a field left out of it is simply invisible here.
 */
async function buildContext(options: CliOptions): Promise<CliContext> {
  // An explicit `-c` that is not there is an argv mistake, reported the way
  // `clientTimeoutMs` and `clientTcpPort` report theirs: a plain `Error`
  // here printed an `INTERNAL_ERROR` envelope and exited 1 for a typo in a
  // path, with no usage line.
  let fileConfig
  try {
    fileConfig = loadConfig(options.config)
  } catch (error: unknown) {
    if (!(error instanceof CliConfigError)) throw error
    throw new UsageError(undefined, error.message)
  }
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

  // `''` is not a session id. It is not nullish either, so a blank
  // `EDGE_CLI_SESSION` — exported empty, or set from a command substitution
  // that produced nothing — shadowed a perfectly good `session.json`:
  // `needsSession` tests `== null` and passed, and every account command
  // then built `/account//…`, which the router cannot match, so they all
  // answered NOT_FOUND at exit 4 with the real session unread. The engine
  // guards its own env var this way.
  const envSession = emptyToUndefined(process.env.EDGE_CLI_SESSION)
  const fileSession = readSessionFile(profile)

  const ctx: CliContext = {
    client,
    profile,
    // The field is the one copy. A closure variable beside it was only ever
    // written, never read, which read as if it were the source of truth.
    sessionId: options.session ?? envSession ?? fileSession?.sessionId ?? null,
    testMode,
    setSessionId(id, username) {
      const forgotten = ctx.sessionId
      ctx.sessionId = id
      if (id != null) {
        writeSessionFile(profile, id, username)
        return
      }
      // Only when the id being forgotten is the one on disk.
      //
      // `--session` and `EDGE_CLI_SESSION` are published as an override of
      // the persisted id, which is the two-account workflow, and three paths
      // reach here with an id the file never held: `forgetDeadSession` after
      // a 401, `logout`, and `delete-remote-account`. So
      // `edge-cli --session=<stale> currency-wallets` used to answer 401 and
      // then delete a `session.json` holding a *different*, still-live
      // session — the only copy of an id for an account the engine still had
      // open — and an `EDGE_CLI_SESSION` left set in a shell turned every
      // such 401 into the same loss.
      // Re-read rather than compare against the snapshot taken above: a
      // login earlier in the same interactive session rewrites the file.
      const onDisk = readSessionFile(profile)?.sessionId
      if (forgotten != null && forgotten === onDisk) {
        clearSessionFile(profile)
      }
    }
  }
  return ctx
}

/**
 * Run a command, solving a CAPTCHA and retrying once when asked to.
 *
 * Keyed off the thrown error rather than a list of command names, so the flag
 * works for every command a challenge can reach and cannot rot as commands are
 * renamed. Shared by one-shot mode and the prompt, which the guide says behave
 * the same.
 */
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

  // The highest exit code any line produced. One rule for every arm, which
  // it was not: the API arm was last-non-zero-wins and the two usage arms
  // were first-wins, so a script that failed 5 then 4 reported 4, and one
  // that failed 4 then took a usage error reported 4 where the reverse order
  // reported 2. `Math.max` is the rule, because a piped chain has one exit
  // code for several commands and the most severe failure is the one worth
  // reporting; one-shot mode still reports each command's own code, which is
  // what the published table describes.
  let worst: number = EXIT.OK
  const worsen = (code: number): void => {
    worst = Math.max(worst, code)
  }

  // `for await` runs one line at a time and ends at EOF, so a piped script
  // reaches its last command. Asking for lines one at a time and resolving on
  // `close` dropped everything after the first, because EOF arrived while the
  // first command was still awaiting.
  for await (const text of rl) {
    const trimmed = text.trim()
    if (trimmed === 'exit' || trimmed === 'quit') break
    try {
      const parsed = splitPromptLine(text)
      if (parsed.command != null) {
        const cmd = findCommand(parsed.command)
        if (cmd.needsSession === true && ctx.sessionId == null) {
          throw new UsageError(cmd, 'Please log in first')
        }
        await invokeCommand(ctx, cmd, parsed.args, solveCaptcha)
      }
    } catch (error: unknown) {
      if (error instanceof UnterminatedQuoteError) {
        // Bad argv, because that is what it is: the line never became a
        // command, so nothing was sent.
        console.error(red(error.message))
        worsen(EXIT.USAGE)
      } else if (error instanceof UsageError) {
        console.error(red(error.message))
        if (error.command != null) console.error(formatUsage(error.command))
        worsen(EXIT.USAGE)
      } else {
        // This loop exists so that a piped script reaches its last command,
        // and discarding `printError`'s return made the documented exit-code
        // table unobservable in exactly that mode.
        worsen(printError(error))
      }
    }
    if (interactive) rl.prompt()
  }
  rl.close()
  return worst
}

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
      printUsageEnvelope(error.message)
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
