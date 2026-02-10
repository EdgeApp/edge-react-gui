import { command, UsageError } from '../command'
import { requireAccount, requireContext } from '../util/session'

command(
  'pin-login',
  {
    usage: '<username> <pin>',
    help: 'Logs the user in with the device-specific PIN',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const context = requireContext(session)
    const username = argv[0]
    const pin = argv[1]

    await context.loginWithPIN(username, pin).then(account => {
      session.account = account
    })
  }
)

command(
  'pin-delete',
  {
    usage: '',
    help: 'Removes the PIN from an account',
    needsLogin: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const account = requireAccount(session)

    await account.deletePin()
  }
)

command(
  'pin-setup',
  {
    usage: '<pin>',
    help: 'Creates or changes the PIN for an account',
    needsLogin: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const pin = argv[0]

    await account.changePin({ pin })
  }
)
