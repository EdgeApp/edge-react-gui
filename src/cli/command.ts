import type { Session } from './util/session'

/** Console interface used by CLI commands. */
export interface CliConsole {
  log: (...args: unknown[]) => void
}

type InvokeCommand = (
  this: Command,
  console: CliConsole,
  session: Session,
  argv: string[]
) => void | Promise<void>

export interface Command {
  name: string
  invoke: InvokeCommand

  help?: string
  usage?: string

  needsWallet: boolean
  needsAccount: boolean
  needsLogin: boolean
  needsContext: boolean
}

interface CommandOptions {
  replace?: boolean

  help?: string
  usage?: string

  needsWallet?: boolean
  needsAccount?: boolean
  needsLogin?: boolean
  needsContext?: boolean
}

const commands: Record<string, Command> = {}

/**
 * Creates an error indicating a problem with the command-line arguments.
 * @param command The command that was invoked. Can be null.
 */
export class UsageError extends Error {
  command?: Command

  constructor(command?: Command, message = 'Incorrect arguments') {
    super(message)
    this.command = command
    this.name = 'UsageError'
  }
}

export function asMaybeUsageError(error: unknown): UsageError | undefined {
  if (error instanceof Error && error.name === 'UsageError') {
    return error
  }
}

/**
 * Creates a new command, and adds it to the global command registry.
 */
export function command(
  name: string,
  opts: CommandOptions,
  invoke: InvokeCommand
): Command {
  const { replace = false, help, usage } = opts
  if (name in commands && !replace) {
    throw new Error(`Command "${name}" defined twice`)
  }

  // Expand the needs flags:
  let {
    needsWallet = false,
    needsAccount = false,
    needsLogin = false,
    needsContext = false
  } = opts
  needsAccount = needsAccount || needsWallet
  needsLogin = needsLogin || needsAccount
  needsContext = needsContext || needsLogin

  const cmd: Command = {
    name,
    invoke,
    help,
    usage,
    needsAccount,
    needsContext,
    needsLogin,
    needsWallet
  }
  commands[name] = cmd
  return cmd
}

/**
 * Finds the command with the given name.
 */
export function findCommand(name: string): Command {
  const cmd = commands[name]
  if (cmd == null) throw new UsageError(undefined, `No command named "${name}"`)
  return cmd
}

/**
 * Returns the list of all commands, in sorted order.
 */
export function listCommands(): string[] {
  return Object.keys(commands).sort((a, b) => a.localeCompare(b))
}
