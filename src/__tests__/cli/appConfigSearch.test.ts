import { afterEach, describe, expect, it, jest } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { loadAppConfig, loadAppConfigFrom } from '../../cli/engine/appConfig'

/**
 * Which `config.json` the engine's swap settings come from.
 *
 * The working directory is searched first, so a checkout or a container can
 * override — and `asAppConfigFile` drops unknown keys, so *any* file called
 * `config.json` parsed to `{}` and was returned as the answer. A user who
 * disabled a swap plugin in `~/.edge-cli/config.json` got it enabled again
 * by running from a directory holding an unrelated `config.json`, with
 * nothing said: `swapConfig[pluginId]` is `undefined` and `pluginInitFor`
 * enables the plugin. `loadKeys` guards against exactly this for
 * `edgeApiKey` and says so.
 */
const dirs: string[] = []
const cwd = process.cwd()

function tempDir(): string {
  // `realpathSync`, because `/var` is a symlink to `/private/var` on macOS
  // and `appConfigSearchPaths` resolves `./config.json` against
  // `process.cwd()`, which answers the resolved form.
  const dir = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-config-'))
  )
  dirs.push(dir)
  return dir
}

afterEach(() => {
  process.chdir(cwd)
  jest.restoreAllMocks()
  for (const dir of dirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

/** A fake `~` whose `.edge-cli/config.json` this test writes. */
function fakeHome(config: unknown): void {
  const home = tempDir()
  fs.mkdirSync(path.join(home, '.edge-cli'), { recursive: true })
  fs.writeFileSync(
    path.join(home, '.edge-cli', 'config.json'),
    JSON.stringify(config)
  )
  jest.spyOn(os, 'homedir').mockReturnValue(home)
}

describe('loadAppConfig', () => {
  it('prefers a working-directory file that declares swapPlugins', () => {
    fakeHome({ swapPlugins: { changenow: false } })
    const here = tempDir()
    fs.writeFileSync(
      path.join(here, 'config.json'),
      JSON.stringify({ swapPlugins: { changenow: true } })
    )
    process.chdir(here)
    expect(loadAppConfig().swapPlugins).toStrictEqual({ changenow: true })
  })

  it('is not shadowed by an unrelated config.json', () => {
    // The GUI's own repo-root `config.json`, a container's, a tool's — none
    // of them says anything about swap plugins.
    fakeHome({ swapPlugins: { changenow: false } })
    const here = tempDir()
    fs.writeFileSync(
      path.join(here, 'config.json'),
      JSON.stringify({ name: 'my-app', version: 1 })
    )
    process.chdir(here)
    expect(loadAppConfig().swapPlugins).toStrictEqual({ changenow: false })
  })

  it('answers the empty config when no file declares one', () => {
    fakeHome({ name: 'something else' })
    process.chdir(tempDir())
    expect(loadAppConfig().swapPlugins).toBeUndefined()
  })

  it('still refuses a file whose swapPlugins is the wrong type', () => {
    // Deliberately loud: a typo in the user's own file would otherwise
    // silently enable every plugin they turned off, which is what the throw
    // exists for. The message names the path, so a `config.json` that
    // belongs to something else is diagnosable from it.
    fakeHome({})
    const here = tempDir()
    fs.writeFileSync(
      path.join(here, 'config.json'),
      JSON.stringify({ swapPlugins: true })
    )
    process.chdir(here)
    expect(() => loadAppConfig()).toThrow(/config\.json at .*config\.json/)
  })

  it('reports which file supplied swapPlugins', () => {
    // `engine-config` publishes this as `configFiles.appConfigFile` and
    // nothing asserted it. The daemon inherits the working directory of
    // whichever command spawned it and hashes to the same profile from
    // anywhere, so this field is the only statement of which configuration
    // is answering — and a diagnostic nothing checks can lie silently.
    fakeHome({ swapPlugins: { changenow: false } })
    const here = tempDir()
    process.chdir(here)
    // The home file, when only it declares any.
    expect(loadAppConfigFrom().path).toBe(
      path.join(os.homedir(), '.edge-cli', 'config.json')
    )
    // The working-directory file, when it does.
    fs.writeFileSync(
      path.join(here, 'config.json'),
      JSON.stringify({ swapPlugins: { changenow: true } })
    )
    expect(loadAppConfigFrom().path).toBe(path.join(here, 'config.json'))
  })

  it('reports null when a config.json was read and ignored', () => {
    // The asymmetry worth stating: `path` is `null` whenever no file
    // *declared* `swapPlugins`, including when one was read and dropped —
    // the shadowing case this field was added for. An operator reading
    // `engine-config` sees "no file decided this", not "no file was found".
    fakeHome({ name: 'something else' })
    const here = tempDir()
    fs.writeFileSync(
      path.join(here, 'config.json'),
      JSON.stringify({ name: 'my-app' })
    )
    process.chdir(here)
    expect(loadAppConfigFrom().path).toBeNull()
  })
})
