import { printJson } from '../client/output'
import { command, findCommand, listCommands, UsageError } from '../command'

const helpCmd = command(
  'help',
  {
    usage: 'help [<command>]',
    help: 'List all commands, or show usage/help for one command'
  },
  (_ctx, argv) => {
    if (argv.length > 1) throw new UsageError(helpCmd)

    if (argv.length === 0) {
      printJson({ commands: listCommands() })
      return
    }

    const [name] = argv
    const target = findCommand(name)
    printJson({
      name: target.name,
      usage: target.usage ?? target.name,
      help: target.help ?? null,
      needsSession: target.needsSession === true
    })
  }
)
