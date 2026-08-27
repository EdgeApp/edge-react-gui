import './bootNodeLocale'
import './commands/all'

import parse from 'lib-cmdparse'
import { red } from 'nanocolors'
import readline from 'readline'
import sourceMapSupport from 'source-map-support'

import { ApiClientError } from './client/apiClient'
import { EXIT, printError } from './client/output'
import {
  clearSessionFile,
  readSessionFile,
  writeSessionFile
} from './client/sessionFile'
import { solveChallenge } from './client/solveCaptcha'
import { ensureEngine } from './client/spawnEngine'
import {
  type CliContext,
  findCommand,
  listCommands,
  UsageError
} from './command'
import { defaultDirectory, loadConfig } from './engine/cliConfig'
import { parseCliArgs, showCliHelp } from './parseArgs'

sourceMapSupport.install()

function formatUsage(cmd: {
  name: string
  usage?: string
  needsSession?: boolean
}): string {
  let out = `Usage: edge-cli ${cmd.name}`
  if (cmd.needsSession === true) out += ' [--session <id>]'
  if (cmd.usage != null) out += ` ${cmd.usage}`
  return out
}

async function buildContext(options: {
  'api-key'?: string
  'app-id'?: string
  config?: string
  directory?: string
  test?: boolean
  session?: string
  'no-spawn'?: boolean
  tcp?: string
}): Promise<CliContext> {
  const fileConfig = loadConfig(options.config)
  const appId = options['app-id'] ?? fileConfig.appId ?? ''
  const directory =
    options.directory ??
    fileConfig.directory ??
    fileConfig.workingDir ??
    defaultDirectory()
  const testMode = options.test != null || fileConfig.testMode === true
  const apiKey = options['api-key'] ?? fileConfig.apiKey

  const { profile, client } = await ensureEngine({
    appId,
    directory,
    testMode,
    apiKey,
    noSpawn: options['no-spawn'] != null,
    tcpPort:
      options.tcp != null && options.tcp !== '' ? Number(options.tcp) : null,
    loginServer: testMode ? 'https://login-tester.edge.app' : undefined
  })

  const envSession = process.env.EDGE_CLI_SESSION
  const fileSession = readSessionFile(profile)
  let sessionId: string | null =
    options.session ?? envSession ?? fileSession?.sessionId ?? null

  const ctx: CliContext = {
    client,
    profile,
    sessionId,
    testMode,
    setSessionId(id, username) {
      sessionId = id
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
        error.details.challengeUri != null
          ? String(error.details.challengeUri as string)
          : undefined
    })
    return await run(challengeId)
  }
}

async function runPrompt(ctx: CliContext): Promise<void> {
  console.log('Use the `help` command for usage information')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer(line: string) {
      const commands = listCommands()
      const match = commands.filter(c => c.startsWith(line))
      return [match.length > 0 ? match : commands, line]
    }
  })

  await new Promise<void>(resolve => {
    const done = (): void => {
      resolve()
      rl.close()
    }
    const prompt = (): void => {
      rl.question('> ', text => {
        const trimmed = text.trim()
        if (trimmed === 'exit' || trimmed === 'quit') {
          done()
          return
        }
        ;(async () => {
          try {
            const parsed = parse(text)
            if (parsed.exec == null) return
            const cmd = findCommand(parsed.exec)
            if (cmd.needsSession === true && ctx.sessionId == null) {
              throw new UsageError(cmd, 'Please log in first')
            }
            await cmd.invoke(ctx, parsed.args)
          } catch (error: unknown) {
            if (error instanceof UsageError) {
              console.error(red(error.message))
              if (error.command != null) {
                console.error(formatUsage(error.command))
              }
            } else {
              printError(error)
            }
          } finally {
            prompt()
          }
        })().catch(() => {})
      })
    }
    rl.on('close', done)
    prompt()
  })
}

async function main(): Promise<number> {
  const { argv, options } = parseCliArgs(process.argv.slice(2))

  if (options.help != null && argv.length === 0) {
    showCliHelp()
    console.log('Commands:')
    for (const name of listCommands()) console.log(`  ${name}`)
    return EXIT.OK
  }

  const ctx = await buildContext(options)
  const solveCaptcha = options['solve-captcha'] != null

  if (argv.length === 0) {
    await runPrompt(ctx)
    return EXIT.OK
  }

  const name = argv.shift()!
  const cmd = options.help != null ? findCommand('help') : findCommand(name)

  if (cmd.needsSession === true && ctx.sessionId == null) {
    // Legacy helper: -u/-p auto password-login
    if (options.username != null && options.password != null) {
      const session = await maybeSolveAndRetry(
        solveCaptcha,
        async challengeId =>
          await ctx.client.post<{
            sessionId: string
            username?: string
          }>('/v1/login/password', {
            username: options.username,
            password: options.password,
            challengeId
          })
      )
      ctx.setSessionId(session.sessionId, session.username)
    } else {
      throw new UsageError(cmd, 'Please log in first (no sessionId)')
    }
  }

  // Special-case login commands with --solve-captcha by wrapping client.post
  // The individual commands call client directly; we handle retry at invoke
  // for known login command names:
  const loginCommands = new Set([
    'password-login',
    'account-create',
    'account-available',
    'pin-login',
    'key-login'
  ])

  if (solveCaptcha && loginCommands.has(cmd.name)) {
    // Re-invoke with challenge retry by intercepting ApiClientError
    try {
      await cmd.invoke(ctx, argv)
    } catch (error: unknown) {
      if (
        error instanceof ApiClientError &&
        error.code === 'CHALLENGE_REQUIRED' &&
        error.details != null
      ) {
        const challengeId = await solveChallenge({
          challengeId: String(error.details.challengeId),
          challengeUri:
            error.details.challengeUri != null
              ? String(error.details.challengeUri as string)
              : undefined
        })
        ctx.challengeId = challengeId
        await cmd.invoke(ctx, argv)
      } else {
        throw error
      }
    }
  } else {
    await cmd.invoke(ctx, argv)
  }

  return EXIT.OK
}

main()
  .then(code => {
    process.exit(code)
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
      process.exit(EXIT.USAGE)
    }
    const code = printError(error)
    process.exit(code)
  })
