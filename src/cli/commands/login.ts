import { command, UsageError } from '../command'
import { requireAccount, requireContext } from '../util/session'

command(
  'account-available',
  {
    usage: '<username>',
    help: 'Determines whether or not a username is available',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const context = requireContext(session)
    const username = argv[0]

    await context.usernameAvailable(username).then(available => {
      console.log(available ? 'Available' : 'Not available')
    })
  }
)

command(
  'account-create',
  {
    usage: '<username> <password> <pin>',
    help: 'Create a login on the auth server',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 3) throw new UsageError(this)
    const context = requireContext(session)
    const username = argv[0]
    const password = argv[1]
    const pin = argv[2]

    await context.createAccount({ username, password, pin }).then(account => {
      session.account = account
    })
  }
)

command(
  'logout',
  {
    usage: '',
    help: 'Logs out of the current account',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)

    const account = requireAccount(session)
    session.account = undefined
    session.wallet = undefined
    await account.logout()
  }
)

command(
  'messages-fetch',
  {
    usage: '',
    help: 'Fetches login messages for all local users',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const context = requireContext(session)
    await context.fetchLoginMessages().then(messages => {
      console.log(messages)
    })
  }
)

command(
  'username-list',
  {
    usage: '',
    help: 'Lists the usernames on this device',
    needsContext: true
  },
  function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const context = requireContext(session)

    console.log(context.localUsers)
  }
)

command(
  'username-delete',
  {
    usage: '',
    help: 'Forgets a username, deleting its credentials from the device',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const context = requireContext(session)
    const username = context.fixUsername(argv[0])

    const userInfo = context.localUsers.find(info => info.username === username)
    if (userInfo == null) {
      console.log(`Cannot find user "${username}"`)
      return
    }

    await context.forgetAccount(userInfo.loginId)
  }
)

command(
  'account-key',
  {
    usage: '',
    help: 'Shows the login key for the account',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const account = requireAccount(session)

    console.log(await account.getLoginKey())
  }
)

command(
  'key-login',
  {
    usage: '<username> <account-key>',
    help: 'Logs the user in with the account-key',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const context = requireContext(session)
    const username = argv[0]
    const loginKey = argv[1]

    await context.loginWithKey(username, loginKey).then(account => {
      session.account = account
    })
  }
)
