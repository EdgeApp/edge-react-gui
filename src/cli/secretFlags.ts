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
  'new-password': 'EDGE_CLI_NEW_PASSWORD',
  pin: 'EDGE_CLI_PIN',
  'new-pin': 'EDGE_CLI_NEW_PIN',
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
 * `change-password`, whose body field is documented as `The new password.`
 * One variable for both meanings is a credential-overwrite waiting to
 * happen: with `EDGE_CLI_PASSWORD` exported for a login, a
 * `change-password` that forgot its `--password` would silently reset the
 * account to the login password and exit 0, where it has to fail. `--pin`
 * and `change-pin` have the identical shape, and these are the two
 * variables `SECRET_FLAG_ENV` already declared for them.
 */
const WRITE_CREDENTIAL_ENV: Record<string, Record<string, string>> = {
  'change-password': { password: 'EDGE_CLI_NEW_PASSWORD' },
  'change-pin': { pin: 'EDGE_CLI_NEW_PIN' }
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
