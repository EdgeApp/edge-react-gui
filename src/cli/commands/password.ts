import { command, UsageError } from '../command'
import { requireAccount, requireContext } from '../util/session'

command(
  'password-login',
  {
    usage: '<username> <password> [<otp secret>]',
    help: 'Logs the user in with a username and password',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length < 2 || argv.length > 3) throw new UsageError(this)
    const context = requireContext(session)
    const username = argv[0]
    const password = argv[1]
    const otpSecret = argv[2]

    await context
      .loginWithPassword(username, password, { otp: otpSecret })
      .then(account => {
        session.account = account
      })
  }
)

command(
  'password-setup',
  {
    usage: '<password>',
    help: 'Creates or changes the password for a login',
    needsLogin: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const password = argv[0]

    await account.changePassword(password)
  }
)
