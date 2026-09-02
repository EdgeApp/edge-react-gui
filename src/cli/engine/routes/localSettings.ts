import { asBoolean, asObject } from 'cleaners'

import {
  readLocalAccountSettingsFromDisk,
  writeLocalAccountSettingsToDisk
} from '../../../util/localAccountSettings'
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
  cli: { command: 'local-settings' },
  returns: asLocalSettings,

  async handler(ctx) {
    const settings = await readLocalAccountSettingsFromDisk(getAccount(ctx))
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
    notes: 'With no flag the command reads; with one it writes.'
  },
  body: asLocalSettings.withRest,
  returns: asLocalSettings,

  async handler(ctx) {
    const account = getAccount(ctx)
    const settings = await readLocalAccountSettingsFromDisk(account)
    const updated = await writeLocalAccountSettingsToDisk(account, {
      ...settings,
      spamFilterOn: ctx.body.spamFilterOn
    })
    return { spamFilterOn: updated.spamFilterOn }
  }
})
