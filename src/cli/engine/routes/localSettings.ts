import {
  asBoolean,
  asEither,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

import {
  readLocalAccountSettingsForWrite,
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
    'False when `Settings.json` is present and could not be read, in which case every value here is a default rather than the user\u2019s choice. Do not cache a `false` reading. A `change-local-settings` call against the same file reads it again, twice, and if it still cannot be read moves it aside (or deletes it, when its content will not decrypt) before writing — so every other local setting, `spendingLimits` among them, goes back to its default, and the response\u2019s `recovery` says which happened.'
  )
})

/**
 * What a write had to do to an unreadable file first, as published.
 *
 * A union rather than an optional path, because a path cannot say "deleted":
 * when the file will not even decrypt there is nothing to move, and the
 * answer used to be the same absent field as an ordinary write.
 */
const asRecovery = asEither(
  asObject({
    kind: doc(asValue('moved'), 'The unreadable file was kept under `to`.'),
    to: doc(
      asString,
      'The name the old file now has on `account.localDisklet`, kept for inspection.'
    )
  }),
  asObject({
    kind: doc(
      asValue('deleted'),
      'The file\u2019s content would not decrypt or parse, so there was nothing to keep and it was deleted.'
    ),
    reason: doc(asString, 'Why the content could not be read.')
  })
)

/**
 * The settings a write produced, and whether it had to recover a file first.
 */
const asLocalSettingsWrite = asObject({
  spamFilterOn: doc(asBoolean, SPAM_FILTER_DOC),
  recovery: doc(
    asOptional(asRecovery),
    'Absent on an ordinary write. Present when `Settings.json` was present and unreadable on two attempts, so this call recovered a writable file before writing — in which case every other setting in the account is now its default. Refusing the write instead was a one-way door: the file does not repair itself, so every later write failed the same way.'
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
  returns: asLocalSettingsWrite,

  async handler(ctx) {
    const account = getAccount(ctx)
    // Read-modify-write over the whole `Settings.json`, so two concurrent
    // writes must not interleave: the loser's fields would be silently
    // dropped, and the route's own note says new settings are "added
    // alongside it", so the blast radius grows with every option.
    return await serializeByKey(
      `localSettings:${account.rootLoginId}`,
      async () => {
        // Strict, so this write cannot put the twelve defaults over the
        // user's `spendingLimits` — and, after two failed attempts, it
        // moves the unreadable file aside rather than answering the same
        // `500` forever. A refusal with no way out is what it used to do:
        // `Settings.json` does not repair itself, so `--spam-filter-on`
        // failed identically on every later call, and the file is on
        // `account.localDisklet` where the caller cannot move it by hand.
        const { settings, recovery } = await readLocalAccountSettingsForWrite(
          account
        )
        if (recovery != null) {
          ctx.state.logger.warn(
            recovery.kind === 'moved'
              ? `change-local-settings moved an unreadable Settings.json to ${recovery.to}; other settings are back to their defaults`
              : `change-local-settings deleted a Settings.json that would not decrypt (${recovery.reason}); other settings are back to their defaults`
          )
        }
        const updated = await writeLocalAccountSettingsToDisk(account, {
          ...settings,
          spamFilterOn: ctx.body.spamFilterOn
        })
        return { spamFilterOn: updated.spamFilterOn, recovery }
      }
    )
  }
})
