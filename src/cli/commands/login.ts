import { printJson } from '../client/output'
import { type CliContext, command, requireSession } from '../command'
import { parseCommandArgs } from '../commandArgs'

interface Session {
  sessionId: string
  username?: string
  [key: string]: unknown
}

const accountCreateCmd = command(
  'create-account',
  {
    usage:
      'create-account [--username=<name>] --password=<pass> --pin=<pin> [--otp=<code>] [--otp-key=<key>] [--challenge-id=<id>]',
    help: 'Create a new Edge account'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(accountCreateCmd, argv, {
      positional: 'none',
      flags: {
        username: 'string',
        password: 'string',
        pin: 'string',
        otp: 'string',
        'otp-key': 'string',
        'challenge-id': 'string'
      }
    })
    const session = await ctx.client.post<Session>('/create-account', {
      username: args.string('username'),
      password: args.requireString('password'),
      pin: args.requireString('pin'),
      otp: args.string('otp'),
      otpKey: args.string('otp-key'),
      challengeId: args.string('challenge-id') ?? ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const passwordLoginCmd = command(
  'login-with-password',
  {
    usage:
      'login-with-password --username=<name> --password=<pass> [--otp=<code>] [--otp-key=<key>] [--challenge-id=<id>]',
    help: 'Log in with a username and password'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(passwordLoginCmd, argv, {
      positional: 'none',
      flags: {
        username: 'string',
        password: 'string',
        otp: 'string',
        'otp-key': 'string',
        'challenge-id': 'string'
      }
    })
    const session = await ctx.client.post<Session>('/login-with-password', {
      username: args.requireString('username'),
      password: args.requireString('password'),
      otp: args.string('otp'),
      otpKey: args.string('otp-key'),
      challengeId: args.string('challenge-id') ?? ctx.challengeId
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
