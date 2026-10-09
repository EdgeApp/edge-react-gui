import { asBoolean, asObject } from 'cleaners'

import {
  readLocalAccountSettingsFromDisk,
  readLocalAccountSettingsOrDefaults,
  writeLocalAccountSettingsToDisk
} from '../../../util/localAccountSettings'
import { serializeByKey } from '../../../util/serializeByKey'
import { doc } from '../doc'
import { route } from '../route'
import { getAccount } from './helpers'

const SPAM_FILTER_DOC =
  'Hide spam transactions in `get-transactions` results. Defaults to `true`, ' +
  'matching the GUI. The filter hides rows; it never changes stored metadata.'

/** Every device-local setting. One today; new ones are added as fields here. */
const asLocalSettings = asObject({
  spamFilterOn: doc(asBoolean, SPAM_FILTER_DOC)
})

/**
 * The same settings, plus whether they are the user's.
 *
 * The read is lenient, so a `Settings.json` that is *there* and cannot be
 * read answered `{ spamFilterOn: true }` — the cleaner's default,
 * indistinguishable from a user who really has the filter on.
 * `localAccountSettings`' own rule is that "a caller that caches must not
 * then mark itself authoritative", and the GUI applies it; a REST caller
 * could not, because nothing in the response said which it had.
 */
const asLocalSettingsRead = asObject({
  spamFilterOn: doc(asBoolean, SPAM_FILTER_DOC),
  trusted: doc(
    asBoolean,
    'False when `Settings.json` is present and could not be read, in which case every value here is a default rather than the user\u2019s choice. Do not cache a `false` reading, and do not write back on top of it — `change-local-settings` answers a `500` for the same file, which is the call that must not persist defaults over a real file.'
  )
})

/**
 * Local settings.
 *
 * Device-local account settings, stored in `Settings.json` on
 * `account.localDisklet`. They are not synced — a phone and a CLI keep
 * separate copies unless they share an Edge data directory.
 *
 * @coreNote GUI code (src/util/localAccountSettings), reached through
 *   account.localDisklet.
 */
export const localSettings = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}/local-settings',
  cli: { command: 'local-settings', custom: true },
  returns: asLocalSettingsRead,

  async handler(ctx) {
    // Lenient: a read-only route must not answer 500 for a file it could
    // report defaults for. The read-modify-write below stays strict, because
    // there the defaults would be written back.
    const { settings, trusted } = await readLocalAccountSettingsOrDefaults(
      getAccount(ctx)
    )
    // And reported, not only published: the warning the reader writes goes to
    // `console`, which in the daemon is the startup log a clean stop deletes.
    if (!trusted) {
      ctx.state.logger.warn(
        'local-settings answered defaults: Settings.json is present and unreadable'
      )
    }
    return { spamFilterOn: settings.spamFilterOn, trusted }
  }
})

/**
 * Change local settings.
 *
 * Writes device-local account settings. Every option is a field on the body;
 * `spamFilterOn` is the only one today, and new options are added alongside it.
 *
 * @note Omitting a field is a `400`, not a no-op, so a caller cannot clear a
 *   setting by accident.
 * @coreNote GUI code (src/util/localAccountSettings).
 */
export const changeLocalSettings = route({
  core: null,
  method: 'POST',
  path: '/account/{sessionId}/change-local-settings',
  cli: {
    command: 'local-settings',
    custom: true,
    notes: 'With no flag the command reads; with one it writes.'
  },
  body: asLocalSettings.withRest,
  returns: asLocalSettings,

  async handler(ctx) {
    const account = getAccount(ctx)
    // Read-modify-write over the whole `Settings.json`, so two concurrent
    // writes must not interleave: the loser's fields would be silently
    // dropped, and the route's own note says new settings are "added
    // alongside it", so the blast radius grows with every option.
    return await serializeByKey(
      `localSettings:${account.rootLoginId}`,
      async () => {
        // The strict reader, which now throws for a file that is there and
        // unreadable rather than answering the thirteen defaults — so this
        // write cannot put them over the user's `spendingLimits`. The
        // failure reaches the caller as a 500 that says what happened,
        // instead of a silent reset.
        const settings = await readLocalAccountSettingsFromDisk(account)
        const updated = await writeLocalAccountSettingsToDisk(account, {
          ...settings,
          spamFilterOn: ctx.body.spamFilterOn
        })
        return { spamFilterOn: updated.spamFilterOn }
      }
    )
  }
})
