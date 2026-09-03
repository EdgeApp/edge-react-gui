/**
 * Edge CLI engine daemon entry point.
 *
 * Usage:
 *   node -r sucrase/register src/cli/engine/index.ts [options]
 *   edge-engine -t --tcp=9008
 *
 * Options:
 *   -t, --test              Use tester servers
 *   --fake                  Emulate login/info/sync in-process (no network)
 *   -d, --directory <path>  Working directory for core data
 *   -a, --app-id <id>       Application ID
 *   -k, --api-key <key>     Override API key
 *   --locale <tag>          Language tag (BCP 47 / POSIX)
 *   --tcp=<port>            Also listen on 127.0.0.1:<port> (off by default)
 *   --tcp-host=<host>       TCP bind host (default 127.0.0.1)
 *   --idle-timeout=<sec>    Self-shutdown after idle with no sessions (default 300; 0=never)
 *   -c, --config <path>     Config file
 *   -h, --help
 */

import '../bootNodeLocale'

import sourceMapSupport from 'source-map-support'

import { defaultDirectory, loadConfig } from './cliConfig'
import {
  API_VERSION,
  cleanupStaleLock,
  ensureRunDir,
  profileHash,
  removeRunArtifacts,
  socketPathFor,
  writeRunFile
} from './discovery'
import { EventHub } from './events'
import { IdleShutdown } from './idleShutdown'
import { EngineLogger } from './logger'
import { makeCoreContext } from './makeCoreContext'
import { ObjectHandleStore } from './objectHandles'
import { type EngineState, Router } from './router'
import { registerRoutes } from './routes'
import { createRequestHandler, listenTcp, listenUnix } from './server'
import { SessionStore } from './sessions'
import { TESTER_SERVERS } from './testerServers'

sourceMapSupport.install()

interface EngineArgs {
  testMode: boolean
  fake: boolean
  directory?: string
  appId?: string
  apiKey?: string
  locale?: string
  tcpPort: number | null
  tcpHost: string
  idleTimeoutSeconds: number
  configPath?: string
  help: boolean
}

function parseArgs(argv: string[]): EngineArgs {
  const args: EngineArgs = {
    testMode: false,
    fake: false,
    tcpPort: null,
    tcpHost: '127.0.0.1',
    idleTimeoutSeconds: 300,
    help: false
  }

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '-h' || a === '--help') {
      args.help = true
    } else if (a === '-t' || a === '--test') {
      args.testMode = true
    } else if (a === '--fake') {
      args.fake = true
    } else if (a === '-d' || a === '--directory') {
      args.directory = argv[++i]
    } else if (a.startsWith('--directory=')) {
      args.directory = a.slice('--directory='.length)
    } else if (a === '-a' || a === '--app-id') {
      args.appId = argv[++i]
    } else if (a.startsWith('--app-id=')) {
      args.appId = a.slice('--app-id='.length)
    } else if (a === '-k' || a === '--api-key') {
      args.apiKey = argv[++i]
    } else if (a.startsWith('--api-key=')) {
      args.apiKey = a.slice('--api-key='.length)
    } else if (a === '--locale') {
      args.locale = argv[++i]
    } else if (a.startsWith('--locale=')) {
      args.locale = a.slice('--locale='.length)
    } else if (a === '-c' || a === '--config') {
      args.configPath = argv[++i]
    } else if (a.startsWith('--config=')) {
      args.configPath = a.slice('--config='.length)
    } else if (a === '--tcp') {
      throw new Error('--tcp requires a port, e.g. --tcp=9008')
    } else if (a.startsWith('--tcp=')) {
      const port = Number(a.slice('--tcp='.length))
      if (!Number.isFinite(port) || port < 0) {
        throw new Error(`Invalid --tcp port: ${a}`)
      }
      args.tcpPort = port
    } else if (a.startsWith('--tcp-host=')) {
      args.tcpHost = a.slice('--tcp-host='.length)
    } else if (a.startsWith('--idle-timeout=')) {
      const seconds = Number(a.slice('--idle-timeout='.length))
      if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error(`Invalid --idle-timeout: ${a}`)
      }
      args.idleTimeoutSeconds = seconds
    } else if (a === '--idle-timeout') {
      const raw = argv[++i]
      const seconds = Number(raw)
      if (!Number.isFinite(seconds) || seconds < 0) {
        throw new Error(`Invalid --idle-timeout: ${raw}`)
      }
      args.idleTimeoutSeconds = seconds
    } else {
      throw new Error(`Unknown argument: ${a}`)
    }
  }
  return args
}

function printHelp(): void {
  console.log(`Usage: edge-engine [options]

Options:
  -t, --test                 Use tester servers (login/info/sync/change-tester)
      --fake                 Emulate the login/info/sync servers in-process
  -d, --directory <path>     Working directory for core data
  -a, --app-id <id>          Application ID
  -k, --api-key <key>        Override API key from keys.json
      --locale <tag>         Language tag (BCP 47 or POSIX)
  --tcp=<port>               Also listen on 127.0.0.1:<port> (off by default)
  --tcp-host=<host>          TCP bind host (default 127.0.0.1)
  --idle-timeout=<seconds>   Self-shutdown when idle with no sessions (default 300; 0=never)
  -c, --config <path>        Config file
  -h, --help                 Show help
`)
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    process.exit(0)
  }

  const fileConfig = loadConfig(args.configPath)
  const appId = args.appId ?? fileConfig.appId ?? ''
  const directory =
    args.directory ??
    fileConfig.directory ??
    fileConfig.workingDir ??
    defaultDirectory()
  const testMode = args.testMode || fileConfig.testMode === true
  const apiKey = args.apiKey ?? fileConfig.apiKey

  const events = new EventHub()
  const sessions = new SessionStore(events)
  const objects = new ObjectHandleStore()

  // The fake world is its own profile, so a fake engine never answers on the
  // socket a real one is using, or vice versa.
  const profile = profileHash({
    appId,
    directory,
    testMode,
    loginServer: args.fake
      ? 'fake://login'
      : testMode
      ? TESTER_SERVERS.loginServer
      : undefined
  })
  const logger = new EngineLogger(profile)
  logger.info('Engine starting', {
    pid: process.pid,
    appId,
    directory,
    testMode,
    locale: args.locale
  })

  const core = await makeCoreContext({
    apiKey,
    appId,
    directory,
    testMode,
    fake: args.fake,
    events,
    logger
  })

  const livePid = cleanupStaleLock(profile)
  if (livePid != null) {
    console.error(
      `[edge-engine] An engine is already running for profile ${profile} (pid ${livePid}).\n` +
        `Stop it first (edge-cli engine-stop) or use a different --directory/--app-id.`
    )
    process.exit(1)
  }
  ensureRunDir(profile)
  const socketPath = socketPathFor(profile)

  let shuttingDown = false
  let unixServer: Awaited<ReturnType<typeof listenUnix>> | null = null
  let tcpServer: Awaited<ReturnType<typeof listenTcp>>['server'] | null = null
  let boundTcpPort: number | null = null

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    state.shuttingDown = true
    events.emit('engine.shutdown', { reason: 'requested' })
    idle.stop()
    sessions.stopAutoLogoutTicker()
    objects.stopTicker()
    await objects.clearAll()
    await sessions.logoutAll()
    try {
      await core.context.close()
    } catch {
      // ignore
    }
    // Let subscribers learn why the stream ended before the socket closes.
    events.closeAll('engineShutdown')
    logger.info('Engine shutdown complete')
    await logger.close()
    await new Promise<void>(resolve => {
      if (unixServer == null) {
        resolve()
        return
      }
      unixServer.close(() => {
        resolve()
      })
    })
    await new Promise<void>(resolve => {
      if (tcpServer == null) {
        resolve()
        return
      }
      tcpServer.close(() => {
        resolve()
      })
    })
    removeRunArtifacts(profile)
    process.exit(0)
  }

  const idle = new IdleShutdown({
    idleTimeoutSeconds: args.idleTimeoutSeconds,
    getSessionCount: () => sessions.size,
    getSubscriberCount: () => events.clientCount,
    onFire: async () => {
      logger.warn('Idle timeout — shutting down')
      await shutdown()
    }
  })
  sessions.onSessionsChanged = () => {
    idle.notifySessionsChanged()
  }
  events.onClientsChanged = () => {
    idle.notifySubscribersChanged()
  }

  const state: EngineState = {
    core,
    sessions,
    objects,
    events,
    idle,
    logger,
    profile,
    socketPath,
    tcpPort: null,
    startedAt: Date.now(),
    shuttingDown: false,
    shutdown
  }

  const router = new Router()
  registerRoutes(router)

  unixServer = await listenUnix(createRequestHandler(state, router), socketPath)
  console.error(`[edge-engine] Listening on unix:${socketPath}`)

  if (args.tcpPort != null) {
    // Opt-in loopback TCP for local scripts. No transport auth: the engine is
    // a local convenience daemon; Edge account auth still happens on the login
    // server (password / PIN / login key / OTP).
    const tcp = await listenTcp(
      createRequestHandler(state, router),
      args.tcpPort,
      args.tcpHost
    )
    tcpServer = tcp.server
    boundTcpPort = tcp.port
    state.tcpPort = boundTcpPort
    console.error(
      `[edge-engine] Listening on http://${args.tcpHost}:${boundTcpPort}`
    )
  }

  writeRunFile(profile, {
    pid: process.pid,
    apiVersion: API_VERSION,
    socketPath,
    tcpPort: boundTcpPort,
    appId,
    testMode,
    startedAt: new Date().toISOString()
  })

  sessions.startAutoLogoutTicker()
  objects.startTicker()

  const onSignal = (): void => {
    shutdown().catch(() => {})
  }
  process.on('SIGINT', onSignal)
  process.on('SIGTERM', onSignal)

  console.error(
    `[edge-engine] Ready (pid=${process.pid}, profile=${profile}, testMode=${testMode}, log=${logger.logPath})`
  )
  logger.info('Ready', { pid: process.pid, profile, testMode })
}

main().catch((error: unknown) => {
  console.error('[edge-engine] Fatal:', error)
  process.exit(1)
})
