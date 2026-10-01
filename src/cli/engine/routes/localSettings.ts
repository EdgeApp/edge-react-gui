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
  returns: asLocalSettings,

  async handler(ctx) {
    // Lenient: a read-only route must not answer 500 for a file it could
    // report defaults for. The read-modify-write below stays strict, because
    // there the defaults would be written back.
    const { settings } = await readLocalAccountSettingsOrDefaults(
      getAccount(ctx)
    )
    return { spamFilterOn: settings.spamFilterOn }
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
