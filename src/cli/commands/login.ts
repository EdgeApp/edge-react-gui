import { printJson } from '../client/output'
import { readSession } from '../clientResponses'
import {
  type CliContext,
  command,
  requireSession,
  UsageError
} from '../command'
import { parseCommandArgs, type ParsedCommandArgs } from '../commandArgs'
import { accountPath } from './paths'

/**
 * The three auth flags every login route takes.
 *
 * One declaration, because the five handlers below had it five times — the
 * flags, the usage tail, and the three body fields — and `docs:api:verify`
 * gates each usage string against its route declaration, so changing the
 * auth tail was five edits that had to agree.
 */
const AUTH_FLAGS = {
  otp: 'string',
  'otp-key': 'string',
  'challenge-id': 'string'
} as const

/** The same three, as the usage line spells them. */
const AUTH_USAGE = '[--otp=<code>] [--otp-key=<key>] [--challenge-id=<id>]'

/**
 * The auth fields of a login body.
 *
 * `challengeId` falls back to `ctx.challengeId`, which is how a retry after
 * `CHALLENGE_REQUIRED` carries the solved challenge without the caller
 * passing it again.
 */
function authFields(
  args: ParsedCommandArgs,
  ctx: CliContext
): { otp?: string; otpKey?: string; challengeId?: string } {
  return {
    otp: args.string('otp'),
    otpKey: args.secret('otp-key'),
    challengeId: args.string('challenge-id') ?? ctx.challengeId
  }
}

/**
 * What every login does with the answer: read it, keep it, print it.
 *
 * `setSessionId` before the print, because the print is what a script reads
 * and a session that was not persisted first would be a session the next
 * command cannot use.
 */
function finishLogin(ctx: CliContext, raw: unknown, label: string): void {
  const session = readSession(raw, label)
  ctx.setSessionId(session.sessionId, session.username)
  printJson(session)
}

const accountCreateCmd = command(
  'create-account',
  {
    usage: `create-account [--username=<name>] --password=<pass> --pin=<pin> ${AUTH_USAGE}`
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(accountCreateCmd, argv, {
      flags: {
        username: 'string',
        password: 'string',
        pin: 'string',
        ...AUTH_FLAGS
      }
    })
    finishLogin(
      ctx,
      await ctx.client.post('/create-account', {
        username: args.string('username'),
        password: args.requireSecret('password'),
        pin: args.requireSecret('pin'),
        ...authFields(args, ctx)
      }),
      'create-account'
    )
  }
)

const passwordLoginCmd = command(
  'login-with-password',
  {
    usage: `login-with-password --username=<name> --password=<pass> ${AUTH_USAGE}`
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(passwordLoginCmd, argv, {
      flags: { username: 'string', password: 'string', ...AUTH_FLAGS }
    })
    finishLogin(
      ctx,
      await ctx.client.post('/login-with-password', {
        username: args.requireString('username'),
        password: args.requireSecret('password'),
        ...authFields(args, ctx)
      }),
      'login-with-password'
    )
  }
)

const keyLoginCmd = command(
  'login-with-key',
  {
    usage: `login-with-key --username-or-login-id=<value> --login-key=<key> [--use-login-id[=false]] ${AUTH_USAGE}`
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(keyLoginCmd, argv, {
      flags: {
        'username-or-login-id': 'string',
        'login-key': 'string',
        // Declared by the route and published in the usage line, so the
        // parser has to take it. It did not, and `edge-cli help` printed it
        // anyway: the flag gate only asked whether an accepted flag was
        // declared, never whether a declared one was accepted.
        //
        // `'boolean'`, not `'boolstr'`: the usage line publishes
        // `[--use-login-id[=false]]`, and `'boolstr'` demands a value, so a
        // bare `--use-login-id` — the spelling the bracket advertises and
        // the only one that means true — was `--use-login-id requires a
        // value`. This is the same shape every generated optional boolean
        // uses: sent only when given, so the route's `asOptional` default
        // survives an absent flag.
        'use-login-id': 'boolean',
        ...AUTH_FLAGS
      }
    })
    finishLogin(
      ctx,
      await ctx.client.post('/login-with-key', {
        usernameOrLoginId: args.requireString('username-or-login-id'),
        loginKey: args.requireSecret('login-key'),
        useLoginId: args.booleanGiven('use-login-id')
          ? args.boolean('use-login-id')
          : undefined,
        ...authFields(args, ctx)
      }),
      'login-with-key'
    )
  }
)

const pinLoginCmd = command(
  'login-with-pin',
  {
    usage: `login-with-pin --username-or-login-id=<value> --pin=<pin> [--use-login-id[=false]] ${AUTH_USAGE}`
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(pinLoginCmd, argv, {
      flags: {
        'username-or-login-id': 'string',
        pin: 'string',
        // As `login-with-key`: declared, published, and refused until now,
        // and `'boolean'` for the same reason.
        'use-login-id': 'boolean',
        ...AUTH_FLAGS
      }
    })
    finishLogin(
      ctx,
      await ctx.client.post('/login-with-pin', {
        usernameOrLoginId: args.requireString('username-or-login-id'),
        pin: args.requireSecret('pin'),
        useLoginId: args.booleanGiven('use-login-id')
          ? args.boolean('use-login-id')
          : undefined,
        ...authFields(args, ctx)
      }),
      'login-with-pin'
    )
  }
)

const recoveryLoginCmd = command(
  'login-with-recovery',
  {
    usage: `login-with-recovery --username=<name> --recovery-key=<key> --answer=<text> [--answer=…] ${AUTH_USAGE}`
  },
  async (ctx, argv) => {
    const args = parseCommandArgs(recoveryLoginCmd, argv, {
      flags: {
        username: 'string',
        'recovery-key': 'string',
        answer: 'repeat',
        ...AUTH_FLAGS
      }
    })
    const answers = args.strings('answer')
    if (answers.length === 0) {
      throw new UsageError(recoveryLoginCmd, 'Missing --answer')
    }
    finishLogin(
      ctx,
      await ctx.client.post('/login-with-recovery', {
        username: args.requireString('username'),
        recoveryKey: args.requireSecret('recovery-key'),
        answers,
        ...authFields(args, ctx)
      }),
      'login-with-recovery'
    )
  }
)

command(
  'logout',
  {
    usage: 'logout',
    needsSession: true
  },
  async (ctx: CliContext) => {
    const sessionId = requireSession(ctx)
    await ctx.client.post(accountPath(sessionId, '/logout'))
    ctx.setSessionId(null)
    printJson({ ok: true })
  }
)
