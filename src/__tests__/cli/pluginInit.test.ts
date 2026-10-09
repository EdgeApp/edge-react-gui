import { describe, expect, it, jest } from '@jest/globals'

import { pluginInitFor } from '../../cli/engine/makeCoreContext'
import { mergePluginInit } from '../../configKeysMerge'

/** `{}`, or an object whose every value is `undefined`. */
function isEmptyInit(value: unknown): boolean {
  if (value == null || typeof value !== 'object') return false
  return Object.values(value).every(inner => inner === undefined)
}

/**
 * The engine and the app must agree about what enables a plugin.
 *
 * The engine had its own `mergePluginInit`, same name and same signature as
 * the one `src/configKeysMerge.ts` exports and `configKeysMerge.test.ts`
 * already pins, and the two disagreed on six of ten cases — so that suite
 * was asserting behaviour the engine did not use. The same remote
 * `infoRollup` feeds both, so a divergence is the CLI and the app reading one
 * server's answer two ways.
 */
describe('pluginInitFor', () => {
  const noWarn = undefined

  it('agrees with the app on every boolean and object case', () => {
    const cases: Array<[unknown, unknown]> = [
      [true, false],
      [true, null],
      [undefined, false],
      [true, {}],
      [{ a: 1 }, false],
      [undefined, { k: 2 }],
      [false, { k: 2 }],
      [true, { k: 2 }],
      [undefined, undefined],
      [false, false]
    ]
    for (const [config, keys] of cases) {
      const shared = mergePluginInit(config, keys)
      const engine = pluginInitFor('p', config, keys, noWarn)
      // The wrapper narrows to what `EdgeCorePluginsInit` can carry: an
      // absent answer becomes `false`, and an init with no options at all
      // becomes `true` rather than `{}` — the same normalisation the
      // currency path has always done, so the `monero === true` warning can
      // see a plugin enabled with no key.
      const expected =
        shared == null ? false : isEmptyInit(shared) ? true : shared
      expect(engine).toStrictEqual(expected)
    }
  })

  it('keeps a plugin enabled when only the keys say false', () => {
    // The disagreement that mattered: keys are never an off switch, only
    // config.json is. The engine used to answer `false` here, so the same
    // server response disabled a plugin in the CLI and not in the app.
    expect(pluginInitFor('p', true, false, noWarn)).toBe(true)
    expect(pluginInitFor('p', { a: 1 }, false, noWarn)).toStrictEqual({ a: 1 })
  })

  it('disables a plugin whose init is neither boolean nor object', () => {
    // A server sending the *string* `"false"`. The engine answered `true`,
    // switching a swap plugin on with no keys, where the currency path in the
    // same file deliberately disables it and says so.
    const warn = jest.fn()
    expect(pluginInitFor('changelly', 'false', undefined, warn)).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][0])).toContain('changelly')
    expect(String(warn.mock.calls[0][0])).toContain('unusable init')
  })

  it('names the plugin even with no logger attached', () => {
    expect(pluginInitFor('p', 'nonsense', undefined, noWarn)).toBe(false)
  })
})

/**
 * The swap path and the currency path read one entry the same way.
 *
 * They did not: `initFromKeysEntry` was the currency path's, and the swap
 * path handed the merged value to core with no cleaner at all. These cases
 * run through `pluginInitFor`, the swap side, because that is the side that
 * had nothing.
 */
describe('a keys entry on the swap path', () => {
  it('honours an explicit enabled: false', () => {
    expect(
      pluginInitFor('changelly', undefined, { enabled: false }, undefined)
    ).toBe(false)
  })

  it('disables an entry the cleaner rejects', () => {
    const warn = jest.fn()
    expect(
      pluginInitFor('changelly', undefined, { enabled: 'yes' }, warn)
    ).toBe(false)
    expect(String(warn.mock.calls[0][0])).toContain('changelly')
  })

  it('disables an array entry, with a warning', () => {
    // `asObject` accepts an array: `["a","b"]` cleaned to
    // `{"0":"a","1":"b"}` — `.withRest` keeps the indices — so the plugin
    // was enabled with that as its init, and `[]` enabled it as `true`.
    // Neither warned, and these entries come from `keys.json` and the info
    // server's signed `appKeys`.
    const warn = jest.fn()
    expect(pluginInitFor('changelly', undefined, ['a', 'b'], warn)).toBe(false)
    expect(String(warn.mock.calls[0][0])).toContain('changelly')

    const warnEmpty = jest.fn()
    expect(pluginInitFor('changelly', undefined, [], warnEmpty)).toBe(false)
    expect(String(warnEmpty.mock.calls[0][0])).toContain('changelly')
  })

  it('keeps the options of an entry it accepts', () => {
    expect(
      pluginInitFor(
        'changelly',
        undefined,
        { enabled: true, apiKey: 'k' },
        undefined
      )
    ).toStrictEqual({ apiKey: 'k' })
  })

  it('is `true`, not `{}`, for an entry with no options', () => {
    expect(
      pluginInitFor('changelly', undefined, { enabled: true }, undefined)
    ).toBe(true)
  })
})
