import { printJson } from '../client/output'
import {
  type CliContext,
  command,
  requireSession,
  UsageError
} from '../command'

interface Session {
  sessionId: string
  username?: string
  [key: string]: unknown
}

const accountAvailableCmd = command(
  'account-available',
  {
    usage: 'account-available <username>',
    help: 'Check whether a username is available'
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(accountAvailableCmd)
    const [username] = argv
    const query = new URLSearchParams({ username })
    printJson(
      await ctx.client.get(`/v1/username-available?${query.toString()}`)
    )
  }
)

const accountCreateCmd = command(
  'account-create',
  {
    usage: 'account-create <username> <password> <pin>',
    help: 'Create a new Edge account'
  },
  async (ctx, argv) => {
    if (argv.length !== 3) throw new UsageError(accountCreateCmd)
    const [username, password, pin] = argv
    const session = await ctx.client.post<Session>('/v1/login/create', {
      username,
      password,
      pin
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

command(
  'account-key',
  {
    usage: 'account-key',
    help: "Show the current account's login key",
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/v1/accounts/${encodeURIComponent(sessionId)}/login-key`
      )
    )
  }
)

command(
  'account-info',
  {
    usage: 'account-info',
    help: 'Show the current session and account details',
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(`/v1/accounts/${encodeURIComponent(sessionId)}`)
    )
  }
)

const passwordLoginCmd = command(
  'password-login',
  {
    usage: 'password-login <username> <password> [<otp>]',
    help: 'Log in with a username and password'
  },
  async (ctx, argv) => {
    if (argv.length < 2 || argv.length > 3)
      throw new UsageError(passwordLoginCmd)
    const [username, password, otp] = argv
    const session = await ctx.client.post<Session>('/v1/login/password', {
      username,
      password,
      otp
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const keyLoginCmd = command(
  'key-login',
  {
    usage: 'key-login <username> <loginKey>',
    help: 'Log in with a raw account login key'
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(keyLoginCmd)
    const [username, loginKey] = argv
    const session = await ctx.client.post<Session>('/v1/login/key', {
      username,
      loginKey
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const pinLoginCmd = command(
  'pin-login',
  {
    usage: 'pin-login <username> <pin>',
    help: 'Log in with a device PIN'
  },
  async (ctx, argv) => {
    if (argv.length !== 2) throw new UsageError(pinLoginCmd)
    const [username, pin] = argv
    const session = await ctx.client.post<Session>('/v1/login/pin', {
      username,
      pin
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const recovery2LoginCmd = command(
  'recovery2-login',
  {
    usage: 'recovery2-login <recovery2Key> <username> <answers...>',
    help: 'Log in with recovery-question answers'
  },
  async (ctx, argv) => {
    if (argv.length < 3) throw new UsageError(recovery2LoginCmd)
    const [recovery2Key, username, ...answers] = argv
    const session = await ctx.client.post<Session>('/v1/login/recovery2', {
      recovery2Key,
      username,
      answers
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

command(
  'logout',
  {
    usage: 'logout',
    help: 'Log out of the current session',
    needsSession: true
  },
  async (ctx: CliContext) => {
    const sessionId = requireSession(ctx)
    await ctx.client.delete(`/v1/accounts/${encodeURIComponent(sessionId)}`)
    ctx.setSessionId(null)
    printJson({ ok: true })
  }
)

command(
  'username-list',
  {
    usage: 'username-list',
    help: 'List local usernames known to this device'
  },
  async ctx => {
    printJson(await ctx.client.get('/v1/users'))
  }
)

const usernameDeleteCmd = command(
  'username-delete',
  {
    usage: 'username-delete <username>',
    help: 'Forget a username (and its local credentials) on this device'
  },
  async (ctx, argv) => {
    if (argv.length !== 1) throw new UsageError(usernameDeleteCmd)
    const [username] = argv
    await ctx.client.delete(`/v1/users/${encodeURIComponent(username)}`)
    printJson({ ok: true })
  }
)

command(
  'messages-fetch',
  {
    usage: 'messages-fetch',
    help: 'Fetch login messages for all local users'
  },
  async ctx => {
    printJson(await ctx.client.get('/v1/login-messages'))
  }
)

command(
  'challenge-create',
  {
    usage: 'challenge-create',
    help: 'Prefetch a CAPTCHA challenge'
  },
  async ctx => {
    printJson(await ctx.client.post('/v1/challenge'))
  }
)
