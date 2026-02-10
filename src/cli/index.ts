import './commands/all'

import {
  addEdgeCorePlugins,
  asMaybePasswordError,
  type EdgeCorePluginsInit,
  lockEdgeCorePlugins,
  makeEdgeContext
} from 'edge-core-js'
import accountbasedPlugins from 'edge-currency-accountbased'
import currencyPlugins from 'edge-currency-plugins'
import parse from 'lib-cmdparse'
import { dim, green, red } from 'nanocolors'
import Getopt from 'node-getopt'
import path from 'path'
import readline from 'readline'
import sourceMapSupport from 'source-map-support'
import xdgBasedir from 'xdg-basedir'

import { type CliConfig, loadConfig } from './cliConfig'
import {
  asMaybeUsageError,
  type CliConsole,
  type Command,
  command,
  findCommand,
  listCommands,
  UsageError
} from './command'
import { printCommandList } from './commands/help'
import { loadKeys } from './keysConfig'
import type { Session } from './util/session'

// Register currency plugins with edge-core-js
addEdgeCorePlugins(currencyPlugins)
addEdgeCorePlugins(accountbasedPlugins)
lockEdgeCorePlugins()

// Load API keys from keys.json
const keysConfig = loadKeys()

// Build the plugins init object - enable all currency plugins with their API keys
const pluginsInit: EdgeCorePluginsInit = {}

// Add UTXO-based plugins (edge-currency-plugins)
for (const pluginId of Object.keys(currencyPlugins)) {
  const pluginKeys = keysConfig.pluginApiKeys[pluginId]
  if (pluginKeys != null && typeof pluginKeys === 'object') {
    pluginsInit[pluginId] = pluginKeys as Record<string, unknown>
  } else {
    pluginsInit[pluginId] = true
  }
}

// Add account-based plugins (edge-currency-accountbased)
// These are disabled by default due to slow initialization in CLI environments.
// To enable specific plugins, add them to keys.json with `"enabled": true`.
// Example: "ethereum": { "enabled": true, "evmScanApiKey": ["..."] }
for (const pluginId of Object.keys(accountbasedPlugins)) {
  const pluginKeys = keysConfig.pluginApiKeys[pluginId]
  if (
    pluginKeys != null &&
    typeof pluginKeys === 'object' &&
    (pluginKeys as Record<string, unknown>).enabled === true
  ) {
    // Remove the 'enabled' flag before passing to the plugin
    const { enabled, ...rest } = pluginKeys as Record<string, unknown>
    pluginsInit[pluginId] = Object.keys(rest).length > 0 ? rest : true
  } else {
    pluginsInit[pluginId] = false
  }
}

// Test server URLs (same as EdgeReact GUI maestro mode):
const LOGIN_TEST_SERVER = 'https://login-tester.edge.app'
const INFO_TEST_SERVER = 'https://info-tester.edge.app'
const SYNC_TEST_SERVER = 'https://sync-tester-us1.edge.app'

// Display the original source location for errors:
sourceMapSupport.install()

// Program options:
const getopt = new Getopt([
  ['k', 'api-key=ARG', 'Auth server API key'],
  ['a', 'app-id=ARG', 'appId'],
  ['', 'auth-server=ARG', 'Auth server URI'],
  ['c', 'config=ARG', 'Configuration file'],
  ['d', 'directory=ARG', 'Working directory'],
  ['u', 'username=ARG', 'Username'],
  ['p', 'password=ARG', 'Password'],
  ['t', 'test', 'Use test servers (login-tester, info-tester, sync-tester)'],
  ['h', 'help', 'Display options']
])

function formatUsage(cmd: Command): string {
  // Set up the help options:
  let out = `Usage: ${cmd.name}`
  if (cmd.needsContext) {
    out += ' [-k <api-key>] [-d <work-dir>]'
  }
  if (cmd.needsLogin) {
    out += ' -u <username> -p <password>'
  }
  if (cmd.usage != null) {
    out += ` ${cmd.usage}`
  }
  return out
}

const helpCommand = command(
  'help',
  {
    usage: '[command]',
    help: 'Displays help for any command',
    replace: true
  },
  function (console, session, argv) {
    if (argv.length > 1) throw new UsageError(this, 'Too many parameters')

    if (argv.length === 1) {
      // Command help:
      const cmd = findCommand(argv[0])
      console.log(formatUsage(cmd))
      if (cmd.help != null) {
        console.log(cmd.help)
      }
    } else {
      // Program help:
      getopt.showHelp()
      printCommandList(console)
    }
  }
)

/**
 * If we are passed a single object, format that as proper JSON.
 */
const jsonConsole: CliConsole = {
  log(...args: unknown[]): void {
    if (args.length === 1) {
      const arg = args[0]
      if (typeof arg === 'string') {
        console.log(arg)
      } else if (arg instanceof Error) {
        logError(arg)
      } else {
        console.log(green(JSON.stringify(arg, null, 2)))
      }
    } else {
      console.log(...args)
    }
  }
}

/**
 * Logs an Error instance to the console.
 */
function logError(error: unknown): void {
  console.error(red(String(error)))

  // Special handling for particular error types:
  const usageError = asMaybeUsageError(error)
  if (usageError?.command != null) {
    console.error(formatUsage(usageError.command))
    return
  }

  const passwordError = asMaybePasswordError(error)
  if (passwordError?.wait != null) {
    console.error(`Please try again in ${passwordError.wait} seconds`)
    return
  }

  if (error instanceof Error && error.stack != null) {
    console.error(dim(error.stack.replace(/.*\n/, '')))
  }
}

let pendingLogs: string[] = []

function showCoreLogs(): void {
  for (const line of pendingLogs) console.log(line)
  pendingLogs = []
}

/**
 * Creates a session object with a basic context object.
 */
async function makeSession(config: CliConfig): Promise<Session> {
  const defaultDir =
    xdgBasedir.config != null
      ? path.join(xdgBasedir.config, '/edge-cli')
      : './edge-cli'
  const {
    appId = '',
    apiKey,
    directory = defaultDir,
    testMode = false
  } = config

  // Use API key from keys.json if not overridden by config/command line
  const effectiveApiKey = apiKey ?? keysConfig.edgeApiKey
  const apiSecret =
    keysConfig.edgeApiSecret != null
      ? Buffer.from(keysConfig.edgeApiSecret, 'hex')
      : undefined

  // Use test servers when testMode is enabled (same as EdgeReact GUI maestro mode):
  const loginServer = testMode ? LOGIN_TEST_SERVER : undefined
  const infoServer = testMode ? INFO_TEST_SERVER : undefined
  const syncServer = testMode ? SYNC_TEST_SERVER : undefined

  if (testMode) {
    console.log('Using test servers')
  }

  const context = await makeEdgeContext({
    apiKey: effectiveApiKey,
    apiSecret,
    appId,
    loginServer,
    infoServer,
    syncServer,
    path: directory,
    plugins: pluginsInit,
    onLog(event) {
      pendingLogs.push(`${event.source}: ${event.message}`)
    }
  })
  return {
    context
  }
}

/**
 * Sets up a session object with the Edge objects needed by the command.
 */
async function prepareSession(
  config: CliConfig,
  cmd: Command
): Promise<Session> {
  // Create a context if we need one:
  const session: Session = cmd.needsContext ? await makeSession(config) : {}

  // Create a login if we need one:
  if (cmd.needsLogin) {
    if (config.username == null || config.password == null) {
      throw new UsageError(cmd, 'No login credentials')
    }
    if (session.context == null) {
      throw new UsageError(cmd, 'Login requires a context')
    }

    const account = await session.context.loginWithPassword(
      config.username,
      config.password
    )
    session.account = account
  }

  return session
}

/**
 * Parses the provided command line and attempts to run the command.
 */
async function runLine(text: string, session: Session): Promise<void> {
  const parsed = parse(text)
  if (parsed.exec == null) {
    showCoreLogs()
    return
  }
  const cmd = findCommand(parsed.exec)

  if ((cmd.needsLogin || cmd.needsAccount) && session.account == null) {
    throw new UsageError(cmd, 'Please log in first')
  }

  await cmd.invoke(jsonConsole, session, parsed.args)
  showCoreLogs()
}

/**
 * Repeatedly prompts the user for a command to run.
 */
async function runPrompt(
  rl: readline.Interface,
  session: Session
): Promise<void> {
  console.log('Use the `help` command for usage information')

  await new Promise<void>((resolve, _reject) => {
    function done(): void {
      resolve()
      rl.close()
    }

    function prompt(): void {
      rl.question('> ', text => {
        if (text.includes('exit')) {
          done()
          return
        }
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        runLine(text, session).catch(logError).then(prompt)
      })
    }

    rl.on('close', done)
    prompt()
  })
}

/**
 * Parses the options and invokes the requested command.
 */
async function main(): Promise<void> {
  const { argv, options } = getopt.parseSystem()

  // Load the config file, and merge it with the command-line options:
  const config = loadConfig(options.config)
  config.apiKey = options['api-key'] ?? config.apiKey
  config.appId = options['app-id'] ?? config.appId
  config.authServer = options['auth-server'] ?? config.authServer
  config.directory = options.directory ?? config.workingDir
  config.password = options.password ?? config.password
  config.testMode = options.test != null
  config.username = options.username ?? config.username

  if (argv.length === 0) {
    // Run the interactive shell:
    const session = await makeSession(config)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer(line: string) {
        const commands = listCommands()
        const match = commands.filter(command => command.startsWith(line))
        return [match.length > 0 ? match : commands, line]
      }
    })
    await runPrompt(rl, session)
  } else {
    // Look up the command:
    const cmd =
      options.help != null || argv.length === 0
        ? helpCommand
        : findCommand(argv.shift())

    // Set up the session:
    const session = await prepareSession(config, cmd)
    // Invoke the command:
    await cmd.invoke(jsonConsole, session, argv)
    showCoreLogs()
  }
}

// Invoke the main function with error reporting:
main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    logError(error)
    process.exit(1)
  })
