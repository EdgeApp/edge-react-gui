import { describe, expect, it } from '@jest/globals'
import { spawnSync } from 'child_process'

import { engineEnv } from '../../cli/client/spawnEngine'
import { allSecretEnvNames } from '../../cli/secretFlags'

/**
 * The daemon must not inherit the caller's credentials.
 *
 * The engine is detached and long-lived, so `{ ...process.env }` handed it
 * every variable in `SECRET_FLAG_ENV` for its whole life: a
 * `EDGE_CLI_PASSWORD=… edge-cli login-with-password` exits in a second
 * while the engine it spawned keeps that password in `/proc/<pid>/environ`
 * for hours, and in any core dump. The engine never needs them — the client
 * resolves each secret and sends it in the request body — which is why
 * `EDGE_CLI_API_KEY` is the one credential forwarded, deliberately.
 */
describe('engineEnv', () => {
  const source = {
    NODE_ENV: 'test',
    PATH: '/usr/bin',
    HOME: '/home/someone',
    EDGE_CLI_PASSWORD: 'hunter2',
    EDGE_CLI_PIN: '1234',
    EDGE_CLI_NEW_PASSWORD: 'hunter3',
    EDGE_CLI_NEW_PIN: '9999',
    EDGE_CLI_LOGIN_KEY: 'login-key',
    EDGE_CLI_DATA_KEY: 'data-key',
    EDGE_CLI_OTP_KEY: 'otp-key',
    EDGE_CLI_RECOVERY_KEY: 'recovery-key',
    EDGE_CLI_SESSION: 'session-token',
    EDGE_CLI_API_KEY: 'api-key'
  }

  it('withholds every secret-flag variable', () => {
    const out = engineEnv(source)
    // Every credential variable, the write-side ones included:
    // `EDGE_CLI_NEW_PASSWORD` is a password too.
    expect(allSecretEnvNames()).toContain('EDGE_CLI_NEW_PASSWORD')
    expect(allSecretEnvNames()).toContain('EDGE_CLI_NEW_PIN')
    for (const name of allSecretEnvNames()) {
      expect(out[name]).toBeUndefined()
    }
  })

  it('withholds the session, which is a bearer token', () => {
    expect(engineEnv(source).EDGE_CLI_SESSION).toBeUndefined()
  })

  it('keeps everything the engine does need', () => {
    const out = engineEnv(source)
    expect(out.PATH).toBe('/usr/bin')
    expect(out.HOME).toBe('/home/someone')
    expect(out.NODE_ENV).toBe('test')
    // Forwarded on purpose, and the only credential that is: `ps` shows an
    // argv to every user on the host, so the API key crosses this way.
    expect(out.EDGE_CLI_API_KEY).toBe('api-key')
  })

  it('really keeps them out of a child process', () => {
    // Not just absent from the object: Node drops a key whose value is
    // `undefined` when it builds the child environment, and this asserts
    // that rather than assuming it.
    const probe = spawnSync(
      process.execPath,
      [
        '-e',
        'console.log(JSON.stringify({ pw: process.env.EDGE_CLI_PASSWORD ?? null, api: process.env.EDGE_CLI_API_KEY ?? null }))'
      ],
      { env: engineEnv(source), encoding: 'utf8' }
    )
    const seen = JSON.parse(probe.stdout.trim())
    expect(seen.pw).toBeNull()
    expect(seen.api).toBe('api-key')
  })
})
