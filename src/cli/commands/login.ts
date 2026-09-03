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

const keyLoginCmd = command(
  'login-with-key',
  {
    usage:
      'login-with-key --username-or-login-id=<value> --login-key=<key> [--otp=<code>] [--otp-key=<key>] [--challenge-id=<id>]',
    help: 'Log in with a raw account login key'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(keyLoginCmd, argv, {
      positional: 'none',
      flags: {
        'username-or-login-id': 'string',
        'login-key': 'string',
        otp: 'string',
        'otp-key': 'string',
        'challenge-id': 'string'
      }
    })
    const session = await ctx.client.post<Session>('/login-with-key', {
      usernameOrLoginId: args.requireString('username-or-login-id'),
      loginKey: args.requireString('login-key'),
      otp: args.string('otp'),
      otpKey: args.string('otp-key'),
      challengeId: args.string('challenge-id') ?? ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const pinLoginCmd = command(
  'login-with-pin',
  {
    usage:
      'login-with-pin --username-or-login-id=<value> --pin=<pin> [--otp=<code>] [--otp-key=<key>] [--challenge-id=<id>]',
    help: 'Log in with a device PIN'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(pinLoginCmd, argv, {
      positional: 'none',
      flags: {
        'username-or-login-id': 'string',
        pin: 'string',
        otp: 'string',
        'otp-key': 'string',
        'challenge-id': 'string'
      }
    })
    const session = await ctx.client.post<Session>('/login-with-pin', {
      usernameOrLoginId: args.requireString('username-or-login-id'),
      pin: args.requireString('pin'),
      otp: args.string('otp'),
      otpKey: args.string('otp-key'),
      challengeId: args.string('challenge-id') ?? ctx.challengeId
    })
    ctx.setSessionId(session.sessionId, session.username)
    printJson(session)
  }
)

const recoveryLoginCmd = command(
  'login-with-recovery',
  {
    usage:
      'login-with-recovery --username=<name> --recovery-key=<key> --answer=<text> [--answer=…] [--otp=<code>] [--otp-key=<key>] [--challenge-id=<id>]',
    help: 'Log in with recovery-question answers'
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recoveryLoginCmd, argv, {
      positional: 'none',
      flags: {
        username: 'string',
        'recovery-key': 'string',
        answer: 'repeat',
        otp: 'string',
        'otp-key': 'string',
        'challenge-id': 'string'
      }
    })
    const answers = args.strings('answer')
    if (answers.length === 0) {
      throw new UsageError(recoveryLoginCmd, 'Missing --answer')
    }
    const session = await ctx.client.post<Session>('/login-with-recovery', {
      username: args.requireString('username'),
      recoveryKey: args.requireString('recovery-key'),
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
