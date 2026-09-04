import { asBoolean, asObject, asOptional, asString } from 'cleaners'

import {
  readLocalAccountSettingsFromDisk,
  writeLocalAccountSettingsToDisk
} from '../../../util/localAccountSettings'
import { doc } from '../doc'
import { engineError } from '../errors'
import { route } from '../route'
import { getAccount } from './helpers'

const SPAM_FILTER_DOC =
  'Hide spam transactions in `get-transactions` results. Defaults to `true`, ' +
  'matching the GUI. The filter hides rows; it never changes stored metadata.'

const NICKNAME_DOC =
  'A stored name for this account, for a caller that wants somewhere to keep ' +
  'one. Arbitrary — it need not be a real name. Empty until one is set.\n\n' +
  'Nothing here reads it. The wallet-share commands take their name from ' +
  '`--display-name` on the call itself, so a caller that wants this value ' +
  'sent must read it and pass it. Setting it changes no other behavior.'

/** Every device-local setting. New ones are added as fields here. */
const asLocalSettings = asObject({
  spamFilterOn: doc(asBoolean, SPAM_FILTER_DOC),
  nickname: doc(asString, NICKNAME_DOC)
})

/** A write names only the settings it means to change. */
const asLocalSettingsPatch = asObject({
  spamFilterOn: asOptional(doc(asBoolean, SPAM_FILTER_DOC)),
  nickname: asOptional(doc(asString, NICKNAME_DOC))
})

/**
 * Local settings.
 *
 * Device-local account settings, stored in `Settings.json` on
 * `account.localDisklet`. They are not synced — a phone and a CLI keep
 * separate copies unless they share an Edge data directory.
 *
 * Settings differ in whether anything acts on them. `spamFilterOn` is read by
 * `get-transactions`; `nickname` is inert, stored and returned and nothing
 * more. In particular it is not wired to the wallet-share commands, which
 * name themselves through `--display-name` on the call.
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
    const settings = await readLocalAccountSettingsFromDisk(getAccount(ctx))
    return {
      spamFilterOn: settings.spamFilterOn,
      nickname: settings.nickname
    }
  }
})

/**
 * Change local settings.
 *
 * Writes device-local account settings. Every option is a field on the body,
 * and only the fields present are written.
 *
 * @note A body naming no setting at all is a `400`, so a typo'd flag fails
 *   loudly rather than reporting success while changing nothing.
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
  body: asLocalSettingsPatch.withRest,
  returns: asLocalSettings,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const { spamFilterOn, nickname } = ctx.body
    if (spamFilterOn == null && nickname == null) {
      throw engineError(
        'BAD_REQUEST',
        'Name at least one setting to change',
        400
      )
    }

    const account = getAccount(ctx)
    const settings = await readLocalAccountSettingsFromDisk(account)
    const updated = await writeLocalAccountSettingsToDisk(account, {
      ...settings,
      ...(spamFilterOn == null ? {} : { spamFilterOn }),
      ...(nickname == null ? {} : { nickname })
    })
    return {
      spamFilterOn: updated.spamFilterOn,
      nickname: updated.nickname
    }
  }
})
