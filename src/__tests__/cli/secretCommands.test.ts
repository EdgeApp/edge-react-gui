// Every command, generated and hand-written, so `findCommand` reaches them.
import '../../cli/commands/all'

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'

import { type CliContext, findCommand, UsageError } from '../../cli/command'

/**
 * The key-material variables, through the commands that read them.
 *
 * `secretFlags.test.ts` checks the table and the accessors; this runs the
 * handlers, because a call site reading `args.strings('answer')` or a
 * generated arm reading `args.string(a.flag)` would leave a documented
 * variable doing nothing while every table check passed — the way two of
 * the first eight credential variables once did.
 */
const saved = new Map<string, string | undefined>()

function setEnv(name: string, value: string): void {
  if (!saved.has(name)) saved.set(name, process.env[name])
  process.env[name] = value
}

afterEach(() => {
  for (const [name, value] of saved) process.env[name] = value ?? ''
  saved.clear()
})

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

interface Posted {
  path: string
  body: any
}

function makeCtx(reply: unknown = { ok: true }): {
  ctx: CliContext
  posted: Posted[]
} {
  const posted: Posted[] = []
  const ctx = {
    client: {
      post: async (path: string, body: unknown) => {
        posted.push({ path, body })
        return reply
      },
      get: async () => reply
    },
    profile: 'test',
    sessionId: 'session-1',
    setSessionId: () => {},
    testMode: false
  } as unknown as CliContext
  return { ctx, posted }
}

const session = {
  sessionId: 'session-2',
  username: 'alice',
  rootLoginId: 'root',
  loginMethod: 'recovery',
  autoLogoutSeconds: 0,
  autoLogoutRead: true,
  expiresAt: null,
  lastActivityAt: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z'
}

async function run(
  name: string,
  argv: string[],
  reply?: unknown
): Promise<Posted[]> {
  const { ctx, posted } = makeCtx(reply)
  await findCommand(name).invoke(ctx, argv)
  return posted
}

describe('key-material variables, through the commands', () => {
  it('sends recovery answers from their variable when asked', async () => {
    setEnv('EDGE_CLI_RECOVERY_ANSWERS', '["first", "second"]')
    const posted = await run(
      'login-with-recovery',
      ['--username=alice', '--recovery-key=key', '--answer=@env'],
      session
    )
    expect(posted[0].body.answers).toStrictEqual(['first', 'second'])
  })

  it('sends import text from its variable when asked', async () => {
    setEnv('EDGE_CLI_IMPORT_TEXT', 'twelve seed words')
    const posted = await run('create-currency-wallet', [
      '--wallet-type=wallet:bitcoin',
      '--import-text=@env'
    ])
    expect(posted[0].body.importText).toBe('twelve seed words')
  })

  it('creates fresh keys when the variable is set but not asked for', async () => {
    // A forgotten `export` must not turn a create into an import.
    setEnv('EDGE_CLI_IMPORT_TEXT', 'twelve seed words')
    const posted = await run('create-currency-wallet', [
      '--wallet-type=wallet:bitcoin'
    ])
    expect(posted[0].body.importText).toBeUndefined()
  })

  it('sends a JSON variable through the JSON parser', async () => {
    setEnv('EDGE_CLI_SWEEP_SPEND_INFO', '{"privateKeys":["k"]}')
    const posted = await run('sweep-private-keys', [
      '--wallet-id=w',
      '--spend-info=@env'
    ])
    expect(posted[0].body.spendInfo).toStrictEqual({ privateKeys: ['k'] })
  })

  it('names the variable when its JSON is malformed', async () => {
    setEnv('EDGE_CLI_CREATE_WALLETS', '[{bad')
    await expect(
      run('create-currency-wallets', ['--create-wallets=@env'])
    ).rejects.toThrow(/^EDGE_CLI_CREATE_WALLETS must be valid JSON/)
  })

  it('still requires a required flag when only the variable is set', async () => {
    // An exported batch or sweep is not re-run by a command that forgot it.
    setEnv('EDGE_CLI_CREATE_WALLETS', '[]')
    const error = await run('create-currency-wallets', []).catch(
      (error: unknown) => error
    )
    expect(error).toBeInstanceOf(UsageError)
    expect(String((error as Error).message)).toContain(
      '--create-wallets=@env with EDGE_CLI_CREATE_WALLETS set'
    )
  })

  it('refuses @env when the variable is not set', async () => {
    setEnv('EDGE_CLI_URI', '')
    await expect(
      run('parse-uri', ['--wallet-id=w', '--uri=@env'])
    ).rejects.toThrow('--uri=@env needs EDGE_CLI_URI set')
  })
})
