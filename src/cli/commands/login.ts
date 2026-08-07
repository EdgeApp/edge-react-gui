import { printJson } from '../client/output'
import {
  type CliContext,
  command,
  requireSession,
  UsageError
} from '../command'
import { parseCommandArgs } from '../commandArgs'

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
    const { positional: username } = parseCommandArgs(
      accountAvailableCmd,
      argv,
      { positional: 'required' }
    )
    const query = new URLSearchParams({ username: username! })
    if (ctx.challengeId != null) query.set('challengeId', ctx.challengeId)
    printJson(
      await ctx.client.get(`/v1/username-available?${query.toString()}`)
    )
  }
)

const accountCreateCmd = command(
  'account-create',
  {
    usage: 'account-create <username> --password=<pass> --pin=<pin>',
    help: 'Create a new Edge account'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(accountCreateCmd, argv, {
      positional: 'required',
      flags: { password: 'string', pin: 'string' }
    })
    const session = await ctx.client.post<Session>('/v1/login/create', {
      username: args.positional,
      password: args.requireString('password'),
      pin: args.requireString('pin'),
      challengeId: ctx.challengeId
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
    usage: 'password-login <username> --password=<pass> [--otp=<code>]',
    help: 'Log in with a username and password'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(passwordLoginCmd, argv, {
      positional: 'required',
      flags: { password: 'string', otp: 'string' }
    })
    const session = await ctx.client.post<Session>('/v1/login/password', {
      username: args.positional,
      password: args.requireString('password'),
      otp: args.string('otp'),
      challengeId: ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const keyLoginCmd = command(
  'key-login',
  {
    usage: 'key-login <username> --login-key=<key>',
    help: 'Log in with a raw account login key'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(keyLoginCmd, argv, {
      positional: 'required',
      flags: { 'login-key': 'string' }
    })
    const session = await ctx.client.post<Session>('/v1/login/key', {
      username: args.positional,
      loginKey: args.requireString('login-key'),
      challengeId: ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const pinLoginCmd = command(
  'pin-login',
  {
    usage: 'pin-login <username> --pin=<pin>',
    help: 'Log in with a device PIN'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(pinLoginCmd, argv, {
      positional: 'required',
      flags: { pin: 'string' }
    })
    const session = await ctx.client.post<Session>('/v1/login/pin', {
      username: args.positional,
      pin: args.requireString('pin'),
      challengeId: ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const recovery2LoginCmd = command(
  'recovery2-login',
  {
    usage:
      'recovery2-login <username> --recovery-key=<key> --answer=<text> [--answer=…]',
    help: 'Log in with recovery-question answers'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recovery2LoginCmd, argv, {
      positional: 'required',
      flags: { 'recovery-key': 'string', answer: 'repeat' }
    })
    const answers = args.strings('answer')
    if (answers.length === 0) {
      throw new UsageError(recovery2LoginCmd, 'Missing --answer')
    }
    const session = await ctx.client.post<Session>('/v1/login/recovery2', {
      recovery2Key: args.requireString('recovery-key'),
      username: args.positional,
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
    const { positional: username } = parseCommandArgs(usernameDeleteCmd, argv, {
      positional: 'required'
    })
    await ctx.client.delete(`/v1/users/${encodeURIComponent(username!)}`)
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
