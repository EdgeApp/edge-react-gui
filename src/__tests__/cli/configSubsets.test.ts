import { describe, expect, it } from '@jest/globals'

import { asConfigJson, asKeysJson } from '../../configKeysSchema'

/**
 * The engine reads `config.json` and `keys.json` with narrower cleaners than
 * the app's, because it needs three fields out of each and must not write
 * either file back.
 *
 * The app's loader goes through `cleaner-config`'s `makeConfig`, which fills
 * defaults and **writes the file back** on a round-trip
 * (`src/configKeysSchema.ts` says so). That is right for a developer tool and
 * wrong for a daemon: an engine asked to read a user's `keys.json` must not
 * rewrite it. So the engine keeps its own read, and these cases are what stop
 * the two shapes parting ways — the same job
 * `syncedSettingsFile.test.ts` does for the settings subset.
 */
describe('the engine config subsets', () => {
  it('accepts what the app’s config.json cleaner produces', () => {
    const { loadAppConfig } = requireAppConfig()
    const full = asConfigJson.withRest({
      corePlugins: { bitcoin: true },
      swapPlugins: { changelly: { apiKey: 'k' } },
      guiApiKeys: {},
      rampPlugins: {}
    })
    // The engine reads only `swapPlugins`, and it has to survive the app's
    // own cleaner having materialised every other key.
    const narrow = narrowAppConfig()(full)
    expect(narrow.swapPlugins).toStrictEqual({ changelly: { apiKey: 'k' } })
    expect(typeof loadAppConfig).toBe('function')
  })

  it('accepts what the app’s keys.json cleaner produces', () => {
    // `.withRest`, which is what `scripts/configure.ts` actually loads with.
    // The bare cleaner drops every key it does not declare — including the
    // three the engine reads — so the app's loader preserving the rest is
    // the contract this pins: without it, a `makeConfig` round-trip would
    // strip a developer's `edgeApiKey`, `edgeApiSecret` and `pluginApiKeys`.
    const full = asKeysJson.withRest({
      corePlugins: {},
      swapPlugins: {},
      guiApiKeys: {},
      rampPlugins: {},
      POSTHOG_API_KEY: null,
      edgeApiKey: 'api-key',
      edgeApiSecret: '00ff',
      pluginApiKeys: { monero: true }
    })
    const narrow = narrowKeysConfig()(full)
    expect(narrow.edgeApiKey).toBe('api-key')
    expect(narrow.edgeApiSecret).toBe('00ff')
    expect(narrow.pluginApiKeys).toStrictEqual({ monero: true })
  })

  it('defaults the fields the app’s cleaner leaves out', () => {
    // A `config.json` with no `swapPlugins` at all, and a `keys.json` with
    // no Edge API credentials: the engine's own defaults have to hold,
    // because that is the state a fresh clone is in.
    expect(narrowAppConfig()({}).swapPlugins).toBeUndefined()
    const keys = narrowKeysConfig()({})
    expect(keys.edgeApiKey).toBe('')
    expect(keys.pluginApiKeys).toStrictEqual({})
  })
})

/** The engine's own cleaners, reached without its loaders' file reads. */
function narrowAppConfig(): (raw: unknown) => { swapPlugins?: unknown } {
  const { asAppConfigFileForTests } = require('../../cli/engine/appConfig')
  return asAppConfigFileForTests
}
function narrowKeysConfig(): (raw: unknown) => {
  edgeApiKey: string
  edgeApiSecret?: string
  pluginApiKeys: Record<string, unknown>
} {
  const { asKeysConfigForTests } = require('../../cli/engine/keysConfig')
  return asKeysConfigForTests
}
function requireAppConfig(): { loadAppConfig: unknown } {
  return require('../../cli/engine/appConfig')
}
