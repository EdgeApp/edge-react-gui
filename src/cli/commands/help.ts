import { printJson } from '../client/output'
import { command, findCommand, listCommands, UsageError } from '../command'
import helpDocs from '../generated/helpDocs.json'

interface ParamHelp {
  /** How to supply it on the command line, or null when REST-only. */
  pass: string | null
  doc?: string
  optional?: boolean
}

interface CommandHelp {
  summary: string
  description?: string
  core?: string
  method: string
  path: string
  usage: string
  params?: Record<string, ParamHelp>
  returns?: Record<string, string>
  returnsDoc?: string
  notes?: string[]
  errors?: string[]
}

const generated: Record<string, CommandHelp> = helpDocs.commands as Record<
  string,
  CommandHelp
>

const helpCmd = command(
  'help',
  {
    usage: 'help [<command>]',
    help: 'List all commands, or show usage and documentation for one command'
  },
  (_ctx, argv) => {
    if (argv.length > 1) throw new UsageError(helpCmd)

    if (argv.length === 0) {
      printJson({ commands: listCommands() })
      return
    }

    const [name] = argv
    const target = findCommand(name)
    // Prose comes from the route's JSDoc via src/cli/generated/helpDocs.json.
    // Commands not yet declared with route() fall back to their own string.
    const docs = generated[target.name]
    printJson({
      name: target.name,
      usage: docs?.usage ?? target.usage ?? target.name,
      summary: docs?.summary ?? target.help ?? null,
      ...(docs?.description != null ? { description: docs.description } : {}),
      ...(docs?.core != null ? { core: docs.core } : {}),
      ...(docs != null ? { rest: `${docs.method} ${docs.path}` } : {}),
      ...(docs?.params != null ? { params: docs.params } : {}),
      ...(docs?.returns != null ? { returns: docs.returns } : {}),
      ...(docs?.returnsDoc != null ? { returnsDoc: docs.returnsDoc } : {}),
      ...(docs?.notes != null ? { notes: docs.notes } : {}),
      ...(docs?.errors != null ? { errors: docs.errors } : {}),
      needsSession: target.needsSession === true
    })
  }
)
