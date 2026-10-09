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
  keysSearchPaths,
  loadKeys,
  loadKeysFrom,
  mergePluginApiKeys
} from '../../cli/engine/keysConfig'
import { readJsonConfig } from '../../cli/engine/readJsonConfig'

describe('mergePluginApiKeys', () => {
  it('lets the preferred object win field-by-field', () => {
    expect(
      mergePluginApiKeys(
        { monero: { edgeApiKey: 'remote' } },
        { monero: { edgeApiKey: 'local', apiKey: 'keep' }, bitcoin: true }
      )
    ).toEqual({
      bitcoin: true,
      monero: { apiKey: 'keep', edgeApiKey: 'remote' }
    })
  })
})

/**
 * The engine's credential loader, over the two paths it really searches.
 *
 * `./keys.json` first, then `~/.edge-cli/keys.json`, and the rule that is
 * easy to get wrong is the `foundApiKey` latch: a file that parses but
 * carries no `edgeApiKey` — the GUI's own repo-root `keys.json` is exactly
 * that — must not shadow a later file that has one. `edgeApiSecret` travels
 * with the key it pairs with, from the same file, or the engine signs with
 * one file's secret under another file's key. Plugin keys merge across both;
 * `edgeApiKey` does not.
 *
 * Driven end to end rather than through a seam, because `cliHome.ts` resolves
 * `os.homedir()` at call time for this: two temp directories and a stub.
 */
describe('loadKeys', () => {
  let home = ''
  let cwd = ''
  let originalCwd = ''

  beforeEach(() => {
    // `realpathSync`, because `/var` is a symlink to `/private/var` on
    // macOS and `process.cwd()` answers the resolved form — so
    // `configSearchPaths`, which resolves `./keys.json`, would not match a
    // path built from `os.tmpdir()`.
    const root = fs.realpathSync(
      fs.mkdtempSync(path.join(os.tmpdir(), 'edge-keys-'))
    )
    home = path.join(root, 'home')
    cwd = path.join(root, 'cwd')
    fs.mkdirSync(path.join(home, '.edge-cli'), { recursive: true })
    fs.mkdirSync(cwd, { recursive: true })
    jest.spyOn(os, 'homedir').mockReturnValue(home)
    originalCwd = process.cwd()
    process.chdir(cwd)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    jest.restoreAllMocks()
    fs.rmSync(path.dirname(home), { recursive: true, force: true })
  })

  const writeLocal = (value: unknown): void => {
    fs.writeFileSync(path.join(cwd, 'keys.json'), JSON.stringify(value))
  }
  const writeHome = (value: unknown): void => {
    fs.writeFileSync(
      path.join(home, '.edge-cli', 'keys.json'),
      JSON.stringify(value)
    )
  }

  it('searches the working directory before the CLI home', () => {
    expect(keysSearchPaths()).toStrictEqual([
      path.join(cwd, 'keys.json'),
      path.join(home, '.edge-cli', 'keys.json')
    ])
  })

  it('answers the defaults when neither file exists', () => {
    expect(loadKeys()).toStrictEqual({
      edgeApiKey: '',
      edgeApiSecret: undefined,
      pluginApiKeys: {}
    })
  })

  it('takes the key from the first file that has one', () => {
    writeLocal({ edgeApiKey: 'local', edgeApiSecret: 'local-secret' })
    writeHome({ edgeApiKey: 'home', edgeApiSecret: 'home-secret' })
    const keys = loadKeys()
    expect(keys.edgeApiKey).toBe('local')
    expect(keys.edgeApiSecret).toBe('local-secret')
  })

  it('does not let a keyless file shadow a later one', () => {
    // The GUI's own repo-root `keys.json`: valid, and no `edgeApiKey`.
    writeLocal({ pluginApiKeys: { changelly: { partnerId: 'edge' } } })
    writeHome({ edgeApiKey: 'home', edgeApiSecret: 'home-secret' })
    const keys = loadKeys()
    expect(keys.edgeApiKey).toBe('home')
    expect(keys.edgeApiSecret).toBe('home-secret')
  })

  it('pairs the secret with the key from the same file', () => {
    // A repo-root file with a key and a home file with a secret must not be
    // mixed: the signature would be computed with a secret the key does not
    // belong to.
    writeLocal({ edgeApiKey: 'local' })
    writeHome({ edgeApiKey: 'home', edgeApiSecret: 'home-secret' })
    const keys = loadKeys()
    expect(keys.edgeApiKey).toBe('local')
    expect(keys.edgeApiSecret).toBeUndefined()
  })

  it('merges plugin keys across both files', () => {
    writeLocal({ pluginApiKeys: { changelly: { partnerId: 'edge' } } })
    writeHome({
      pluginApiKeys: {
        changelly: { partnerId: 'stale', apiKey: 'home' },
        monero: true
      }
    })
    expect(loadKeys().pluginApiKeys).toStrictEqual({
      changelly: { apiKey: 'home', partnerId: 'edge' },
      monero: true
    })
  })

  it('refuses a file this version cannot read', () => {
    // Not silent defaults: the values in it decide which servers the engine
    // talks to.
    fs.writeFileSync(path.join(cwd, 'keys.json'), '{not json')
    expect(() => loadKeys()).toThrow(/Invalid JSON in .*keys\.json/)
  })

  it('reports which files it actually read, in search order', () => {
    // `engine-config` publishes this as `configFiles.keysFiles` and nothing
    // asserted it. It exists because a daemon inherits the working directory
    // of whichever command spawned it and `./keys.json` is searched first,
    // so two invocations with identical flags from different directories are
    // served by one engine running on one checkout's `edgeApiKey`,
    // `edgeApiSecret` and plugin init options, with nothing saying which.
    // A diagnostic nothing checks can lie silently.
    expect(loadKeysFrom().paths).toStrictEqual([])
    writeHome({ edgeApiKey: 'home' })
    expect(loadKeysFrom().paths).toStrictEqual([
      path.join(home, '.edge-cli', 'keys.json')
    ])
    // Both, in the order they were searched — and the keyless local file is
    // still *read*, which is the case the latch above is about.
    writeLocal({ pluginApiKeys: { changelly: { partnerId: 'edge' } } })
    expect(loadKeysFrom().paths).toStrictEqual([
      path.join(cwd, 'keys.json'),
      path.join(home, '.edge-cli', 'keys.json')
    ])
  })
})

/**
 * The two wordings an operator hand-editing a config file sees.
 *
 * They are this module's stated reason to exist — a syntax slip and a wrong
 * value say different things — and the thing they must not do is answer with
 * silent defaults.
 */
describe('readJsonConfig', () => {
  let dir = ''
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-config-'))
  })
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  const asThing = (raw: unknown): { apiKey: string } => {
    if (
      raw == null ||
      typeof raw !== 'object' ||
      typeof (raw as { apiKey?: unknown }).apiKey !== 'string'
    ) {
      throw new TypeError('expected a string at .apiKey')
    }
    return { apiKey: (raw as { apiKey: string }).apiKey }
  }

  it('answers an absent file with null, for the next search path', () => {
    const missing = path.join(dir, 'nope.json')
    expect(readJsonConfig(missing, asThing, 'CLI config')).toBeNull()
  })

  it('reads a file the cleaner accepts', () => {
    const file = path.join(dir, 'ok.json')
    fs.writeFileSync(file, '{"apiKey":"abc"}')
    expect(readJsonConfig(file, asThing, 'CLI config')).toStrictEqual({
      apiKey: 'abc'
    })
  })

  it('names the file for a syntax slip', () => {
    const file = path.join(dir, 'bad.json')
    fs.writeFileSync(file, '{"apiKey":"abc",}')
    expect(() => readJsonConfig(file, asThing, 'CLI config')).toThrow(
      new RegExp(`Invalid JSON in ${file.replace(/[.\\]/g, '\\$&')}`)
    )
  })

  it('names the label and the field for a wrong value', () => {
    const file = path.join(dir, 'wrong.json')
    fs.writeFileSync(file, '{"apiKey":7}')
    let message = ''
    try {
      readJsonConfig(file, asThing, 'CLI config')
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
    }
    expect(message).toContain('Invalid CLI config at')
    expect(message).toContain('.apiKey')
  })
})
