import type { ApiClient } from './client/apiClient'

export interface CliContext {
  client: ApiClient
  profile: string
  sessionId: string | null
  setSessionId: (sessionId: string | null, username?: string) => void
  testMode: boolean
  /** Set when --solve-captcha retries a login after CHALLENGE_REQUIRED. */
  challengeId?: string
}

export type CommandHandler = (
  ctx: CliContext,
  argv: string[]
) => Promise<void> | void

export interface Command {
  name: string
  usage?: string
  help?: string
  needsSession?: boolean
  invoke: CommandHandler
}

// A null-prototype map, so user input like `constructor` or `toString` cannot
// resolve to an inherited Object.prototype member instead of a Command.
const commands: Record<string, Command> = Object.create(null)

export class UsageError extends Error {
  command?: Command
  constructor(command?: Command, message = 'Incorrect arguments') {
    super(message)
    this.name = 'UsageError'
    this.command = command
  }
}

export function command(
  name: string,
  opts: {
    usage?: string
    help?: string
    needsSession?: boolean
    replace?: boolean
  },
  invoke: CommandHandler
): Command {
  if (name in commands && opts.replace !== true) {
    throw new Error(`Command "${name}" defined twice`)
  }
  const cmd: Command = {
    name,
    usage: opts.usage,
    help: opts.help,
    needsSession: opts.needsSession === true,
    invoke
  }
  commands[name] = cmd
  return cmd
}

export function findCommand(name: string): Command {
  const cmd = commands[name]
  if (cmd == null) throw new UsageError(undefined, `No command named "${name}"`)
  return cmd
}

export function listCommands(): string[] {
  return Object.keys(commands).sort((a, b) => a.localeCompare(b))
}

export function requireSession(ctx: CliContext): string {
  if (ctx.sessionId == null) {
    throw new UsageError(undefined, 'Please log in first (no sessionId)')
  }
  return ctx.sessionId
}
