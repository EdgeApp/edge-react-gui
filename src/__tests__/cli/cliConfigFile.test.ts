import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  CliConfigError,
  defaultConfigPath,
  loadConfig,
  loadConfigFrom
} from '../../cli/engine/cliConfig'

/**
 * What `edge-cli.conf` accepts, and which file answered.
 *
 * Two things had no test. The cleaner is the only declaration of what the
 * file takes, and it accepted three keys nothing read — `authServer`,
 * `username` and `password` — which is how a user who followed the guide's
 * advice to keep credentials off a command line got no login *and* a
 * password in a plaintext file for nothing. And `loadConfig` answered only
 * the values, so `engine-config`'s `configFiles` could not name this file:
 * it listed the `keys.json` search path and the app's `config.json`, and the
 * one file that decided `directory`, `appId`, `locale` and `apiKey` was
 * invisible in the call whose stated job is to say which configuration the
 * engine is running on.
 *
 * `asObject` without `.withRest` drops an unknown key silently, so a
 * misspelled one is a setting that does nothing and the file cannot report
 * it back — which is why the accepted set is published in
 * `docs/EDGE_CLI.md` and asserted here.
 */
describe('edge-cli.conf', () => {
  let dir = ''
  let home = ''

  beforeEach(() => {
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'edge-conf-')))
    home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'edge-home-')))
    jest.spyOn(os, 'homedir').mockReturnValue(home)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    fs.rmSync(dir, { recursive: true, force: true })
    fs.rmSync(home, { recursive: true, force: true })
  })

  const write = (value: unknown): string => {
    const file = path.join(dir, 'edge-cli.conf')
    fs.writeFileSync(file, JSON.stringify(value))
    return file
  }

  it('takes exactly the keys the guide lists', () => {
    const file = write({
      apiKey: 'k',
      appId: 'a',
      directory: '/tmp/d',
      locale: 'fr-FR',
      testMode: true,
      workingDir: '/tmp/w'
    })
    expect(loadConfig(file)).toStrictEqual({
      apiKey: 'k',
      appId: 'a',
      directory: '/tmp/d',
      locale: 'fr-FR',
      testMode: true,
      workingDir: '/tmp/w'
    })
  })

  it('does not accept a credential or a server', () => {
    // Deleted rather than wired: a cleaner that accepts a setting is what
    // tells a user it works. `-t` is the supported way to reach the tester
    // servers, and `EDGE_CLI_PASSWORD` the supported way to keep a password
    // off a command line.
    const config: Record<string, unknown> = loadConfig(
      write({ username: 'u', password: 'p', authServer: 'https://example' })
    )
    expect(config.username).toBeUndefined()
    expect(config.password).toBeUndefined()
    expect(config.authServer).toBeUndefined()
  })

  it('reports the file it read', () => {
    const file = write({ locale: 'fr-FR' })
    expect(loadConfigFrom(file).path).toBe(file)
    expect(loadConfigFrom(file).config.locale).toBe('fr-FR')
  })

  it('reports null when there is no file to read', () => {
    // An absent *default* path is not an error — most users have no conf —
    // and `null` is what `engine-config` then publishes, which is a
    // different statement from naming a file.
    const out = loadConfigFrom()
    expect(out.path).toBeNull()
    expect(out.config).toStrictEqual({
      apiKey: undefined,
      appId: undefined,
      directory: undefined,
      locale: undefined,
      testMode: undefined,
      workingDir: undefined
    })
  })

  it('reads the default path when one is there', () => {
    fs.mkdirSync(path.join(home, '.config', 'edge-cli'), { recursive: true })
    fs.writeFileSync(defaultConfigPath(), JSON.stringify({ appId: 'home' }))
    const out = loadConfigFrom()
    expect(out.path).toBe(defaultConfigPath())
    expect(out.config.appId).toBe('home')
  })

  it('refuses an explicit -c that is not there', () => {
    // The two semantics this loader keeps: an explicit `-c` that is missing
    // is an error, and the default path being missing is not.
    expect(() => loadConfigFrom(path.join(dir, 'nope.conf'))).toThrow(
      /no such file/
    )
  })

  it('types that refusal, so the client can report argv', () => {
    // A plain `Error` fell through `printError`'s generic arm, so a typo in
    // a `-c` path printed `{"code":"INTERNAL_ERROR","status":500}` and
    // exited 1 — an engine fault, for a mistake in the command line — while
    // `clientTimeoutMs` and `clientTcpPort` both report a usage error and
    // exit 2 for theirs.
    let caught: unknown
    try {
      loadConfigFrom(path.join(dir, 'nope.conf'))
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(CliConfigError)
  })
})
