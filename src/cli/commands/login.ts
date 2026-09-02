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
  'username-available',
  {
    usage: 'username-available <username>',
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
    printJson(await ctx.client.get(`/username-available?${query.toString()}`))
  }
)

const accountCreateCmd = command(
  'create-account',
  {
    usage: 'create-account <username> --password=<pass> --pin=<pin>',
    help: 'Create a new Edge account'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(accountCreateCmd, argv, {
      positional: 'required',
      flags: { password: 'string', pin: 'string' }
    })
    const session = await ctx.client.post<Session>('/create-account', {
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
  'get-login-key',
  {
    usage: 'get-login-key',
    help: "Show the current account's login key",
    needsSession: true
  },
  async ctx => {
    const sessionId = requireSession(ctx)
    printJson(
      await ctx.client.get(
        `/account/${encodeURIComponent(sessionId)}/get-login-key`
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
    printJson(await ctx.client.get(`/account/${encodeURIComponent(sessionId)}`))
  }
)

const passwordLoginCmd = command(
  'login-with-password',
  {
    usage: 'login-with-password <username> --password=<pass> [--otp=<code>]',
    help: 'Log in with a username and password'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(passwordLoginCmd, argv, {
      positional: 'required',
      flags: { password: 'string', otp: 'string' }
    })
    const session = await ctx.client.post<Session>('/login-with-password', {
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
  'login-with-key',
  {
    usage: 'login-with-key <usernameOrLoginId> --login-key=<key>',
    help: 'Log in with a raw account login key'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(keyLoginCmd, argv, {
      positional: 'required',
      flags: { 'login-key': 'string' }
    })
    const session = await ctx.client.post<Session>('/login-with-key', {
      usernameOrLoginId: args.positional,
      loginKey: args.requireString('login-key'),
      challengeId: ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const pinLoginCmd = command(
  'login-with-pin',
  {
    usage: 'login-with-pin <usernameOrLoginId> --pin=<pin>',
    help: 'Log in with a device PIN'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(pinLoginCmd, argv, {
      positional: 'required',
      flags: { pin: 'string' }
    })
    const session = await ctx.client.post<Session>('/login-with-pin', {
      usernameOrLoginId: args.positional,
      pin: args.requireString('pin'),
      challengeId: ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const recoveryLoginCmd = command(
  'login-with-recovery',
  {
    usage:
      'login-with-recovery <username> --recovery-key=<key> --answer=<text> [--answer=…]',
    help: 'Log in with recovery-question answers'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recoveryLoginCmd, argv, {
      positional: 'required',
      flags: { 'recovery-key': 'string', answer: 'repeat' }
    })
    const answers = args.strings('answer')
    if (answers.length === 0) {
      throw new UsageError(recoveryLoginCmd, 'Missing --answer')
    }
    const session = await ctx.client.post<Session>('/login-with-recovery', {
      recoveryKey: args.requireString('recovery-key'),
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
    await ctx.client.post(`/account/${encodeURIComponent(sessionId)}/logout`)
    ctx.setSessionId(null)
    printJson({ ok: true })
  }
)

command(
  'local-users',
  {
    usage: 'local-users',
    help: 'List local usernames known to this device'
  },
  async ctx => {
    printJson(await ctx.client.get('/local-users'))
  }
)

const usernameDeleteCmd = command(
  'forget-account',
  {
    usage: 'forget-account <rootLoginId>',
    help: 'Forget an account on this device (accepts a rootLoginId or username)'
  },
  async (ctx, argv) => {
    const { positional: rootLoginId } = parseCommandArgs(
      usernameDeleteCmd,
      argv,
      { positional: 'required' }
    )
    await ctx.client.post('/forget-account', { rootLoginId })
    printJson({ ok: true })
  }
)

command(
  'fetch-login-messages',
  {
    usage: 'fetch-login-messages',
    help: 'Fetch login messages for all local users'
  },
  async ctx => {
    printJson(await ctx.client.get('/fetch-login-messages'))
  }
)

command(
  'fetch-challenge',
  {
    usage: 'fetch-challenge',
    help: 'Prefetch a CAPTCHA challenge'
  },
  async ctx => {
    printJson(await ctx.client.post('/fetch-challenge'))
  }
)

const fixUsernameCmd = command(
  'fix-username',
  {
    usage: 'fix-username <username>',
    help: 'Normalize a username the way the login server does (context.fixUsername)'
  },
  async (ctx, argv) => {
    const { positional: username } = parseCommandArgs(fixUsernameCmd, argv, {
      positional: 'required'
    })
    printJson(
      await ctx.client.get(
        `/fix-username?username=${encodeURIComponent(username!)}`
      )
    )
  }
)

const checkPasswordRulesCmd = command(
  'check-password-rules',
  {
    usage: 'check-password-rules --password=<password>',
    help: 'Score a candidate password (context.checkPasswordRules)'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(checkPasswordRulesCmd, argv, {
      positional: 'none',
      flags: { password: 'string' }
    })
    const query = new URLSearchParams({
      password: args.requireString('password')
    })
    printJson(await ctx.client.get(`/check-password-rules?${query.toString()}`))
  }
)

const cancelRequestCmd = command(
  'cancel-request',
  {
    usage: 'cancel-request <pendingId>',
    help: 'Cancel a pending QR login (EdgePendingEdgeLogin.cancelRequest)'
  },
  async (ctx, argv) => {
    const { positional: pendingId } = parseCommandArgs(cancelRequestCmd, argv, {
      positional: 'required'
    })
    await ctx.client.post(
      `/pending-edge-login/${encodeURIComponent(pendingId!)}/cancel-request`
    )
    printJson({ ok: true })
  }
)
