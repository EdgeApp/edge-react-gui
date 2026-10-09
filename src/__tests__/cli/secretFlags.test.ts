// The generated table, because the fallback belongs to every command that
// takes one of these flags, not to the hand-written ones only.
import '../../cli/commands/all'

import { afterEach, describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { findCommand, listCommands, UsageError } from '../../cli/command'
import { parseCommandArgs } from '../../cli/commandArgs'
import { asCommandsTableJson } from '../../cli/generatedSchemas'
import {
  AUTHENTICATE_ONLY_COMMANDS,
  SECRET_FLAG_ENV,
  secretEnvFor
} from '../../cli/secretFlags'

const ROOT = path.resolve(__dirname, '../../..')

/**
 * A credential must have a path that is not argv.
 *
 * `ps -ef` and `/proc/<pid>/cmdline` show a command line to every other user
 * on the host, and a shell writes it to its history. `spawnEngine.ts` states
 * the rule for the API key and forwards it in the environment; the account
 * password, the PIN, the login key and the repo data key had no such path.
 */
const saved = new Map<string, string | undefined>()

afterEach(() => {
  for (const [name, value] of saved) {
    // Reassigning rather than deleting: `process.env` turns a value into a
    // string, so `undefined` would become the literal "undefined" — but the
    // helpers treat a blank value as unset, which is the state a variable
    // that was not set behaves as here.
    process.env[name] = value ?? ''
  }
  saved.clear()
})

function setEnv(name: string, value: string): void {
  if (!saved.has(name)) saved.set(name, process.env[name])
  process.env[name] = value
}

const cmd = findCommand('help')

function parse(argv: string[]): ReturnType<typeof parseCommandArgs> {
  return parseCommandArgs(cmd, argv, {
    flags: { password: 'string', pin: 'string' }
  })
}

describe('secret flags', () => {
  it('reads the variable when the flag is absent', () => {
    setEnv('EDGE_CLI_PASSWORD', 'from-env')
    expect(parse([]).requireSecret('password')).toBe('from-env')
  })

  it('lets the flag win when both are given', () => {
    setEnv('EDGE_CLI_PASSWORD', 'from-env')
    expect(parse(['--password=from-argv']).requireSecret('password')).toBe(
      'from-argv'
    )
  })

  it('treats a blank variable as unset', () => {
    // A variable exported empty, or set from a command substitution that
    // produced nothing, is the ordinary way this happens — and `''` is not
    // nullish, so it would otherwise shadow the thing it overrides.
    setEnv('EDGE_CLI_PIN', '')
    expect(parse([]).secret('pin')).toBeUndefined()
  })

  it('names the variable in the usage error', () => {
    setEnv('EDGE_CLI_PIN', '')
    let message = ''
    try {
      parse([]).requireSecret('pin')
    } catch (error) {
      if (!(error instanceof UsageError)) throw error
      message = error.message
    }
    expect(message).toContain('--pin')
    expect(message).toContain('EDGE_CLI_PIN')
  })

  it('never writes the login credential as the new one', () => {
    // The hazard the per-command table exists for. `--password` means
    // "authenticate with this" on five commands and "the new password" on
    // `change-password`, so one variable for both meanings turns a
    // forgotten flag into a silent credential reset: with
    // `EDGE_CLI_PASSWORD` exported for a login, `change-password` with no
    // `--password` used to resolve it, send it as the new password and exit
    // 0. It has to fail instead, and name its own variable when it does.
    setEnv('EDGE_CLI_PASSWORD', 'the-login-password')
    setEnv('EDGE_CLI_NEW_PASSWORD', '')
    setEnv('EDGE_CLI_PIN', '1234')
    setEnv('EDGE_CLI_NEW_PIN', '')

    const write = (name: string, flag: string): string => {
      const args = parseCommandArgs(findCommand(name), [], {
        flags: { [flag]: 'string' }
      })
      try {
        args.requireSecret(flag)
      } catch (error) {
        if (!(error instanceof UsageError)) throw error
        return error.message
      }
      return 'resolved a value'
    }

    expect(write('change-password', 'password')).toContain(
      'EDGE_CLI_NEW_PASSWORD'
    )
    expect(write('change-pin', 'pin')).toContain('EDGE_CLI_NEW_PIN')

    // And the authenticating commands still read the login variable.
    const login = parseCommandArgs(findCommand('check-password'), [], {
      flags: { password: 'string' }
    })
    expect(login.requireSecret('password')).toBe('the-login-password')
  })

  it('reads the new-credential variable when it is set', () => {
    setEnv('EDGE_CLI_NEW_PIN', '9999')
    const args = parseCommandArgs(findCommand('change-pin'), [], {
      flags: { pin: 'string' }
    })
    expect(args.requireSecret('pin')).toBe('9999')
  })

  it('maps every credential-writing flag to its own variable', () => {
    // The check that would have caught `create-account`. The first version
    // of `WRITE_CREDENTIAL_ENV` enumerated two commands, so a third that
    // *writes* a credential — `create-account`, which resolves both
    // `password` and `pin` through `requireSecret` — fell through to the
    // login variable and created an account whose password and PIN were
    // another live account's. This walks every command instead: each one
    // that resolves a credential must either read a write-side variable or
    // be named in `AUTHENTICATE_ONLY_COMMANDS`, which makes adding a
    // credential-taking command a decision rather than an omission.
    const CREDENTIALS = ['password', 'pin']
    const unaccounted: string[] = []
    for (const name of listCommands()) {
      const { usage } = findCommand(name)
      if (usage == null) continue
      for (const match of usage.matchAll(/--([a-z-]+)=/g)) {
        const flag = match[1]
        if (!CREDENTIALS.includes(flag)) continue
        const variable = secretEnvFor(name, flag)
        const authenticateOnly =
          AUTHENTICATE_ONLY_COMMANDS[name]?.includes(flag)
        const writeSide = variable?.includes('_NEW_') === true
        if (!authenticateOnly && !writeSide) {
          unaccounted.push(`${name} --${flag} -> ${String(variable)}`)
        }
      }
    }
    expect(unaccounted).toStrictEqual([])
  })

  it('never writes the login credential as a new account’s', () => {
    setEnv('EDGE_CLI_PASSWORD', 'the-login-password')
    setEnv('EDGE_CLI_PIN', '1234')
    setEnv('EDGE_CLI_NEW_PASSWORD', '')
    setEnv('EDGE_CLI_NEW_PIN', '')
    const args = parseCommandArgs(findCommand('create-account'), [], {
      flags: { password: 'string', pin: 'string' }
    })
    for (const flag of ['password', 'pin']) {
      let message = ''
      try {
        args.requireSecret(flag)
      } catch (error) {
        if (!(error instanceof UsageError)) throw error
        message = error.message
      }
      expect(message).toContain('_NEW_')
    }
  })

  it('covers every flag a command takes a secret through', () => {
    // The published usage is the registry: a flag whose name says it carries
    // a credential must be in the table, or it has argv and nothing else.
    const secretish = /^(password|pin|login-key|data-key|otp-key|recovery-key)$/
    const uncovered: string[] = []
    for (const name of listCommands()) {
      const { usage } = findCommand(name)
      if (usage == null) continue
      for (const match of usage.matchAll(/--([a-z-]+)=/g)) {
        const flag = match[1]
        const bare = flag.replace(/^new-/, '')
        if (!secretish.test(bare)) continue
        if (SECRET_FLAG_ENV[flag] == null) uncovered.push(`${name} --${flag}`)
      }
    }
    expect(uncovered).toStrictEqual([])
  })

  it('reads every secret flag through the secret accessors', () => {
    // The table is not the gate: `login.ts` had `args.string('otp-key')`
    // and `args.requireString('recovery-key')` while the guide published
    // `EDGE_CLI_OTP_KEY` and `EDGE_CLI_RECOVERY_KEY`, so two of the eight
    // variables did nothing — the OTP one silently, since `--otp-key` is
    // optional and the request simply went out without it. The call sites
    // are what has to be checked.
    const dir = path.join(ROOT, 'src/cli/commands')
    const flags = Object.keys(SECRET_FLAG_ENV)
      .map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const wrong = new RegExp(`\\.(?:require)?String\\('(${flags})'\\)`, 'g')
    const offenders: string[] = []
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.ts')) continue
      const text = fs.readFileSync(path.join(dir, file), 'utf8')
      for (const m of text.matchAll(wrong)) {
        offenders.push(`src/cli/commands/${file}: ${m[0]}`)
      }
    }
    expect(offenders).toStrictEqual([])
  })

  it('does not put a secret in a URL', () => {
    // `check-password-rules`, `admin-repo-list` and `admin-repo-get` were
    // `GET` with the secret in the query string, which the engine's own log
    // redacts values out of precisely because a URL is written down by
    // everything it passes through.
    //
    // Against the generated table, because the property is directly
    // checkable there: `commands.json` records `method` per command and
    // `target` per argument. This case used to assert `not.toContain(
    // '?password=')` on each command's *usage string* — a string of the form
    // `check-password-rules --password=<password>`, which could not hold a
    // query parameter under any defect, so all three of those commands
    // would have passed it had they gone back to `GET`. And one route had:
    // `fetch-recovery-questions` was `GET` with `recoveryKey` in the query,
    // and a recovery key with the answers resets the account's password.
    const secretish = new RegExp(
      `^(new-)?(${Object.keys(SECRET_FLAG_ENV)
        .map(flag => flag.replace(/^new-/, ''))
        .join('|')})$`
    )
    const offenders: string[] = []
    let checked = 0
    const table = asCommandsTableJson(
      fs.readFileSync(
        path.join(ROOT, 'src/cli/generated/commands.json'),
        'utf8'
      )
    )
    for (const command of table.commands) {
      for (const arg of command.args) {
        if (arg.flag == null || !secretish.test(arg.flag)) continue
        ++checked
        if (command.method !== 'POST' || arg.target !== 'body') {
          offenders.push(
            `${command.command} --${String(arg.flag)}: ${command.method} ${
              arg.target
            }`
          )
        }
      }
    }
    expect(offenders).toStrictEqual([])
    // The same guard `routeBodyKinds.test.ts` carries: a sweep that matches
    // nothing passes, so the count is part of the assertion.
    expect(checked).toBeGreaterThan(8)
  })
})
