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
import {
  clientConfig,
  clientTcpPort,
  clientTimeoutMs,
  legacyLoginAction,
  sameUsername,
  sessionToLogOut
} from './client/clientArgs'
import { printUsageEnvelope } from './client/exitCodes'
import { EXIT, printError } from './client/output'
import {
  clearSessionFile,
  readSessionFile,
  writeSessionFile
} from './client/sessionFile'
import { solveChallenge } from './client/solveCaptcha'
import {
  ensureEngine,
  type EnsureEngineOpts,
  warnIfEngineLocaleDiffers
} from './client/spawnEngine'
import { readAccountUsername, readSession } from './clientResponses'
import {
  type CliContext,
  type Command,
  findCommand,
  listCommands,
  UsageError
} from './command'
import { accountPath } from './commands/paths'
import { defaultDirectory } from './engine/cliConfig'
import { profileHash, socketPathFor } from './engine/discovery'
import { SESSION_ERRORS } from './engine/errorGroups'
import { errorMessage } from './engine/errors'
import { FAKE_SERVERS } from './engine/fakeServers'
import { TESTER_SERVERS } from './engine/testerServers'
import { emptyToUndefined } from './envValue'
import { type CliOptions, parseCliArgs, showCliHelp } from './parseArgs'
import { splitPromptLine, UnterminatedQuoteError } from './promptLine'

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
  // `--session` is a *global* flag, so it goes before the command name.
  // Appended after the body, the hint would teach the one spelling the
  // command rejects: `parseCliArgs` stops at the first positional and hands
  // the rest to the command's own parser, which answers
  // `Unknown option --session` and exit 2. `EDGE_CLI_SESSION` is the other
  // way to give it.
  const session = cmd.needsSession === true ? '[--session <id>] ' : ''
  return `Usage: edge-cli ${session}${body}`
}

/**
 * `CliOptions` itself, not a copy of some of its fields.
 *
 * A copied shape would have to be edited alongside `CliOptions` for every new
 * global flag, and a field left out of it would be invisible here.
 */
async function buildContext(options: CliOptions): Promise<CliContext> {
  // An explicit `-c` that is not there is an argv mistake, reported the way
  // `clientTimeoutMs` and `clientTcpPort` report theirs: as a usage error,
  // not an `INTERNAL_ERROR` envelope and exit 1 for a typo in a path.
  const fileConfig = clientConfig(options.config)
  const appId = options['app-id'] ?? fileConfig.appId ?? ''
  const directory =
    options.directory ??
    fileConfig.directory ??
    fileConfig.workingDir ??
    defaultDirectory()
  const testMode = options.test === true || fileConfig.testMode === true
  // The *explicit* key only. A key from the config file is left to the
  // engine, which reads the same file: forwarding it would make
  // `makeCoreContext` read it as an operator override and silently turn off
  // HMAC request signing and the native signer.
  const apiKey = options['api-key']

  const fake = options.fake === true
  // From the same constant the engine derives it from. The profile hash must
  // match on both sides or the client spawns an engine under one profile and
  // then polls a socket under another — a 30-second "Timed out waiting for
  // engine to start" with a healthy engine running — so this is load-bearing,
  // not cosmetic.
  const loginServer = fake
    ? FAKE_SERVERS.loginServer
    : testMode
    ? TESTER_SERVERS.loginServer
    : undefined
  // Annotated, so a field `ensureEngine` takes and this leaves out — or one
  // it no longer takes — is a compile error here rather than a value
  // silently dropped on the way to the spawn.
  const engineOpts: EnsureEngineOpts = {
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
    // A getter, read at every request: on Windows the pipe name lives in the
    // engine's run file, which a spawn partway through this command creates.
    get socketPath() {
      return socketPathFor(profile)
    },
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
  // `EDGE_CLI_SESSION`, exported empty or set from a command substitution
  // that produced nothing, would shadow a good `session.json`: every account
  // command would build `/account//…`, which the router cannot match, and
  // answer NOT_FOUND at exit 4 with the real session unread. The engine
  // guards its own env var this way.
  const envSession = emptyToUndefined(process.env.EDGE_CLI_SESSION)
  const fileSession = readSessionFile(profile)

  const ctx: CliContext = {
    client,
    profile,
    // The field is the one copy.
    sessionId: options.session ?? envSession ?? fileSession?.sessionId ?? null,
    // Both sources, not the one that won: with `--session` and
    // `EDGE_CLI_SESSION` both set, the variable is still the caller's.
    pinnedSessionIds: [options.session, envSession].filter(
      (id): id is string => id != null
    ),
    testMode,
    setSessionId(id, username, namedLogin) {
      const forgotten = ctx.sessionId
      ctx.sessionId = id
      if (id != null) {
        writeSessionFile(profile, id, username, namedLogin)
        return
      }
      // Only when the id being forgotten is the one on disk.
      //
      // `--session` and `EDGE_CLI_SESSION` are published as an override of
      // the persisted id, which is the two-account workflow, and three paths
      // reach here with an id the file never held: `forgetDeadSession` after
      // a 401, `logout`, and `delete-remote-account`. Clearing the file
      // regardless would let a 401 on a stale pinned id delete a
      // `session.json` holding a *different*, still-live session, the only
      // copy of an id for an account the engine still has open.
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
 * Put an account command on the session of the account `-u` names.
 *
 * Both arms of `main` call it — one-shot mode and every line of the prompt,
 * which pipes are the documented way to run several commands through — so
 * `-u` chooses the account wherever a command runs. With `-u`, the session
 * in use, or failing that the saved one, is used here when the engine says
 * it is the named user's; otherwise `legacyLoginAction` decides between a
 * login and a refusal. Without `-u` it answers "use the session in use", or
 * a refusal when there is none. This carries the answer out.
 *
 * Whose session an id is comes from the engine, not the session file: the
 * file cannot speak for a pinned id, nor say whether its own is still live.
 * When the session in use is not the named user's — someone else's, a
 * light account's, or dead — but the saved one is, the saved one is used,
 * with no login. A login replaces the saved session, and `sessionToLogOut`
 * says which session, if any, it then logs out.
 */
async function ensureNamedSession(
  ctx: CliContext,
  cmd: Command,
  options: CliOptions,
  solveCaptcha: boolean
): Promise<void> {
  if (cmd.needsSession !== true) return
  const { username } = options
  // The variable the guide promises every secret flag, so the password
  // need not sit on an argv `ps` shows other users.
  const password =
    options.password ?? emptyToUndefined(process.env.EDGE_CLI_PASSWORD)
  // What the file held when this started: a login below logs out only a
  // session that is still this one when it writes, so two shells running
  // `-u` at once do not log out each other's fresh sessions.
  const savedAtStart = readSessionFile(ctx.profile)
  // Ids the engine said it does not know, which are never sent a logout.
  const deadIds = new Set<string>()
  let heldBy: string | undefined
  let dead = false
  if (username != null && ctx.sessionId != null) {
    const inUse = await sessionHolder(ctx, ctx.sessionId)
    if (!inUse.live) deadIds.add(ctx.sessionId)
    if (inUse.live && inUse.username != null) {
      if (sameUsername(inUse.username, username)) return
    }
    // The session in use is someone else's, light, or dead, but the saved
    // one may be the named user's: a pin to bob does not make `-u alice`
    // log in again over alice's own saved session.
    if (
      savedAtStart != null &&
      savedAtStart.sessionId !== ctx.sessionId &&
      savedAtStart.username != null &&
      sameUsername(savedAtStart.username, username)
    ) {
      const saved = await sessionHolder(ctx, savedAtStart.sessionId)
      if (!saved.live) deadIds.add(savedAtStart.sessionId)
      if (
        saved.live &&
        saved.username != null &&
        sameUsername(saved.username, username)
      ) {
        ctx.sessionId = savedAtStart.sessionId
        return
      }
    }
    heldBy = inUse.live ? inUse.username : undefined
    dead = !inUse.live
  }
  const action = legacyLoginAction({
    username,
    password,
    sessionId: ctx.sessionId,
    heldBy,
    dead
  })
  if (action.kind === 'refuse') throw new UsageError(cmd, action.reason)
  if (action.kind !== 'login') return
  const session = await maybeSolveAndRetry(solveCaptcha, async challengeId =>
    // Cleaned, not an inline shape: the `sessionId` it reads is what
    // `setSessionId` writes to the 0600 session file.
    readSession(
      await ctx.client.post('/login-with-password', {
        username,
        password,
        challengeId
      }),
      'login-with-password'
    )
  )
  // Read the file now, with no await before the write below: the login
  // took a network round trip (and with `--solve-captcha` a proof of work),
  // and another shell's `-u` may have replaced the file meanwhile. What is
  // overwritten is what is on disk at the write — and it is logged out only
  // if it is also what was there at the start, because a session another
  // shell's `-u` wrote in between is that shell's, in use right now.
  const replaced = readSessionFile(ctx.profile)
  ctx.setSessionId(session.sessionId, session.username, true)
  const logOut = sessionToLogOut({
    replaced,
    savedAtStart,
    newSessionId: session.sessionId,
    pinned: ctx.pinnedSessionIds ?? [],
    dead: deadIds
  })
  if (logOut != null) {
    // Left alone, a session `-u` minted stays a logged-in account in the
    // engine, syncing and holding it awake, under an id nothing holds.
    await ctx.client
      .post(accountPath(logOut, '/logout'), {})
      .catch((error: unknown) => {
        console.error(
          red(
            `Could not log out the session -u replaced: ${errorMessage(error)}`
          )
        )
      })
  }
}

/**
 * Whose session an id is, according to the engine.
 *
 * Only the two dead-session codes mean "not live"; anything else — a
 * timeout, an engine shutting down, a shape this client does not know — is
 * the command's failure, not a reason to log in again or to refuse naming
 * nobody.
 */
async function sessionHolder(
  ctx: CliContext,
  sessionId: string
): Promise<{ live: true; username?: string } | { live: false }> {
  try {
    const raw = await ctx.client.get(accountPath(sessionId))
    return { live: true, username: readAccountUsername(raw) }
  } catch (error: unknown) {
    if (isDeadSession(error)) return { live: false }
    throw error
  }
}

/** The engine's answer for an id it no longer has: logged out or expired. */
function isDeadSession(error: unknown): boolean {
  return error instanceof ApiClientError && SESSION_ERRORS.includes(error.code)
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
  options: CliOptions,
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

  // The highest exit code any line produced, by one rule for every arm.
  // `Math.max` is the rule, because a piped chain has one exit code for
  // several commands and the most severe failure is the one worth reporting;
  // one-shot mode reports each command's own code, which is what the
  // published table describes.
  let worst: number = EXIT.OK
  const worsen = (code: number): void => {
    worst = Math.max(worst, code)
  }

  // `for await` runs one line at a time and ends at EOF, so a piped script
  // reaches its last command even though EOF arrives while the first command
  // is still awaiting.
  for await (const text of rl) {
    const trimmed = text.trim()
    if (trimmed === 'exit' || trimmed === 'quit') break
    try {
      const parsed = splitPromptLine(text)
      if (parsed.command != null) {
        const cmd = findCommand(parsed.command)
        await ensureNamedSession(ctx, cmd, options, solveCaptcha)
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
        // so `printError`'s return is kept: discarding it would make the
        // documented exit-code table unobservable in exactly that mode.
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
 * does not do, so without this every later invocation would re-read the dead
 * bearer token off disk and fail 401 indefinitely, and in the prompt the
 * `needsSession` guard would keep passing, so an account command would report
 * `INVALID_SESSION` rather than "Please log in first".
 */
function forgetDeadSession(ctx: CliContext, error: unknown): void {
  if (!isDeadSession(error)) return
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
    // Through `maybeSolveAndRetry`, which encapsulates "on
    // CHALLENGE_REQUIRED, solve and retry once".
    await maybeSolveAndRetry(solveCaptcha, async challengeId => {
      ctx.challengeId = challengeId
      try {
        await cmd.invoke(ctx, argv)
      } finally {
        // A challenge id is single-use. In the prompt the context outlives
        // the command, so leaving it set would make every later login send an
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

  // `help` is answered from the committed help table, so it runs on a stub
  // context and never reaches an engine.
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

  // Resolve the command before building a context: a command that does not
  // exist never needs an engine.
  const name = argv.length > 0 ? argv[0] : null
  const cmd = name != null ? findCommand(name) : null
  if (cmd != null) argv.shift()

  const ctx = await buildContext(options)
  const solveCaptcha = options['solve-captcha'] === true

  if (cmd == null) {
    // The context itself, not a spread copy. `setSessionId` is a method on
    // the object literal `buildContext` built and assigns to *that* object,
    // so a copy would read its own boot-time `sessionId` forever: after a
    // login inside the prompt the next account command would answer "Please
    // log in first", and after `forgetDeadSession` the dead id would keep
    // drawing a 401 for the life of the prompt.
    ctx.interactive = true
    return await runPrompt(ctx, options, solveCaptcha)
  }

  await ensureNamedSession(ctx, cmd, options, solveCaptcha)
  await invokeCommand(ctx, cmd, argv, solveCaptcha)

  return EXIT.OK
}

main()
  .then(code => {
    // `process.exitCode` rather than `process.exit`: stdout writes are async
    // on a pipe, and the documented usage pipes into jq, so `process.exit`
    // would truncate any response larger than the pipe buffer.
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
      // The usage line, as the prompt prints it, so a reader sees which flag
      // was wrong rather than only "Incorrect arguments". Usage goes to
      // stderr, keeping stdout machine-readable.
      if (error.command != null) console.error(formatUsage(error.command))
      process.exitCode = EXIT.USAGE
      return
    }
    const code = printError(error)
    process.exitCode = code
  })
