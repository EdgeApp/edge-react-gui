/**
 * The flags whose values are secrets, and the variable each reads instead.
 *
 * `spawnEngine.ts` already states the rule for the API key — "Not on argv:
 * `ps` shows a command line to every user on the host, and this is a
 * credential" — and `docs/EDGE_CLI.md` publishes it. The branch applied it
 * to the *lowest*-value credential it handles and left the higher ones with
 * no other path: an account password, a PIN, a login key and a repo data key
 * were ordinary argv flags, visible to any local user's `ps -ef` or
 * `/proc/<pid>/cmdline` for the life of the call and written into shell
 * history.
 *
 * The engine already treats them as secrets on its own side, which is why
 * `redactUrl` replaces every query *value* in its log.
 *
 * Reading a variable rather than prompting, so this works in a script, which
 * is where the exposure is. The flag still wins when both are given: an
 * explicit argument is what the caller asked for.
 */
export const SECRET_FLAG_ENV: Record<string, string> = {
  password: 'EDGE_CLI_PASSWORD',
  pin: 'EDGE_CLI_PIN',
  'login-key': 'EDGE_CLI_LOGIN_KEY',
  'data-key': 'EDGE_CLI_DATA_KEY',
  'otp-key': 'EDGE_CLI_OTP_KEY',
  'recovery-key': 'EDGE_CLI_RECOVERY_KEY'
}

/**
 * Flags whose variable depends on the command, because the same flag name
 * means two different things.
 *
 * `--password` is "authenticate with this" on `login-with-password`,
 * `check-password` and `change-username`, and "**the new** password" on
 * `change-password` and `create-account` — or a candidate the server
 * scores, on `check-password-rules`. `change-password`'s body field is
 * documented as `The new password.`
 * One variable for both meanings is a credential-overwrite waiting to
 * happen: with `EDGE_CLI_PASSWORD` exported for a login, a
 * `change-password` that forgot its `--password` would silently reset the
 * account to the login password and exit 0, where it has to fail. `--pin`
 * and `change-pin` have the identical shape.
 *
 * The write-side variables live only here. `SECRET_FLAG_ENV` used to declare
 * them too, keyed by `new-password` and `new-pin` — flags no command, route
 * or generated table declares, so `secretEnvFor` could never reach them.
 */
export const WRITE_CREDENTIAL_ENV: Record<string, Record<string, string>> = {
  'change-password': { password: 'EDGE_CLI_NEW_PASSWORD' },
  'change-pin': { pin: 'EDGE_CLI_NEW_PIN' },
  // `create-account` writes both, which the first version of this table
  // missed: with `EDGE_CLI_PASSWORD` and `EDGE_CLI_PIN` exported to log in
  // — the pattern this module and the guide prescribe — a
  // `create-account --username=newguy` that forgot its flags created a
  // brand-new account whose password and PIN were *another live account's*
  // credentials, and exited 0.
  'create-account': {
    password: 'EDGE_CLI_NEW_PASSWORD',
    pin: 'EDGE_CLI_NEW_PIN'
  },
  // Not a write, but not an authentication either: the argument is a
  // *candidate* password the server scores, so reading the one exported to
  // log in sends the live account password to the rules endpoint for no
  // reason. It has its own variable for the same reason as the writes.
  'check-password-rules': { password: 'EDGE_CLI_NEW_PASSWORD' }
}

/**
 * Commands whose `--password`/`--pin` really do mean "authenticate with
 * this", so reading the login variable is correct.
 *
 * Written down because the test walks every command that resolves a
 * credential through `requireSecret` and asserts it reads a write-side
 * variable *or* appears here — enumerating the write side two commands deep
 * is what let `create-account` through.
 */
export const AUTHENTICATE_ONLY_COMMANDS: Record<string, string[]> = {
  'login-with-password': ['password'],
  'check-password': ['password'],
  'check-pin': ['pin'],
  'change-username': ['password'],
  'login-with-pin': ['pin']
}

/**
 * The variable a flag falls back to, or undefined for an ordinary flag.
 *
 * `command` so that a flag whose value is *written* reads its own variable
 * and never the one a caller exported to log in with.
 */
export function secretEnvFor(
  command: string,
  flag: string
): string | undefined {
  return WRITE_CREDENTIAL_ENV[command]?.[flag] ?? SECRET_FLAG_ENV[flag]
}

/**
 * Every variable this module reads a credential from.
 *
 * What `spawnEngine` withholds from the detached daemon: the write-side
 * variables are credentials as much as the login ones, so deriving the list
 * from `SECRET_FLAG_ENV` alone would hand `EDGE_CLI_NEW_PASSWORD` to a
 * process that lives for hours.
 */
export function allSecretEnvNames(): string[] {
  const names = new Set<string>(Object.values(SECRET_FLAG_ENV))
  for (const flags of Object.values(WRITE_CREDENTIAL_ENV)) {
    for (const name of Object.values(flags)) names.add(name)
  }
  return [...names]
}
