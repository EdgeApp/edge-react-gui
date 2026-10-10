import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

import { LOCALE_KEYS, resolveLocaleTable } from '../../locales/localeKeys'
import de from '../../locales/strings/de.json'
import ja from '../../locales/strings/ja.json'

const ROOT = path.resolve(__dirname, '../../..')
const CLIENT_BUNDLE = path.join(ROOT, 'lib/edgeCli.js')

/**
 * The client ships no translation tables, which nothing checked.
 *
 * `bootNodeLocale.ts` and `docs/EDGE_CLI.md` both state it as fact — the
 * client renders no localized string, so applying the language is the
 * engine's job — and it was not true: `spawnEngine.ts` imported
 * `resolveLocaleTableOrEnglish` from `locales/strings`, which statically
 * imports `en_US.ts` and eleven JSON tables and keeps them live through
 * `allLocales`. Rollup cannot shake a value `Object.keys` reads, so the
 * committed `lib/edgeCli.js` carried all eleven: 1.9 MB of 3.63 MB, over
 * half the client, in tables it never looks at.
 *
 * Skipped when the bundle is absent, like the other built-bundle checks:
 * `npm test` runs with no `lib/`, and `test:cli:offline:built` builds first.
 */
describe('the built client bundle', () => {
  const built = fs.existsSync(CLIENT_BUNDLE)
  const source = built ? fs.readFileSync(CLIENT_BUNDLE, 'utf8') : ''

  it('carries no translation table', () => {
    if (!built) {
      console.log('lib/edgeCli.js absent, so the bundle check did not run')
      return
    }
    // A long, distinctive sentence from two different tables, so a match is
    // the table itself and not a coincidence.
    const samples = [
      de.action_queue_display_unknown_message,
      ja.action_queue_display_unknown_message
    ]
    for (const sample of samples) {
      expect(sample.length).toBeGreaterThan(20)
      expect(source).not.toContain(sample)
    }
  })
})

/**
 * The key list and the tables cannot drift apart.
 *
 * `LOCALE_KEYS` is the list the client reads and `allLocales` is the set the
 * engine merges from; they live in different modules precisely so the client
 * does not import the tables, which is also what would let them disagree.
 */
describe('LOCALE_KEYS against the tables', () => {
  it('names every table the build ships, in the same order', () => {
    // `require`, because importing `strings.ts` for its own sake is what
    // this split exists to avoid doing from the client.
    const strings = require('../../locales/strings')
    expect([...LOCALE_KEYS]).toStrictEqual(Object.keys(strings.allLocales))
  })

  it('resolves every one of them', () => {
    for (const key of LOCALE_KEYS) {
      expect(resolveLocaleTable(key)).toBe(key)
    }
  })
})
