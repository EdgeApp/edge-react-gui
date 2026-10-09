import { asJSON, uncleaner } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

import {
  asLocalAccountSettings,
  type LocalAccountSettings
} from '../types/types'
import { errorMessage } from './errorMessage'
import { isMissingFile } from './predicates'
import { reportWarning } from './reportWarning'

const uncleanLocalAccountSettings = uncleaner(asLocalAccountSettings)

export const LOCAL_SETTINGS_FILENAME = 'Settings.json'

/**
 * Read account.localDisklet Settings.json.
 *
 * An **absent** file, or one whose contents this version cannot read, yields
 * the cleaner's defaults (`spamFilterOn: true`). A failure to *read* a file
 * that is there does not: it throws.
 *
 * The distinction is the whole point. `changeLocalSettings` is a
 * read-modify-write over this one file, so answering any failure with the
 * 13 defaults and then writing them back turned one unreadable file — an
 * interrupted write, a bad sync — into the loss of `spendingLimits`,
 * `passwordReminder`, `notifState`, `reviewTrigger`, `developerModeOn`,
 * `isAccountBalanceVisible` and `tokenWarningsShown`. The user's spending
 * limits among them.
 *
 * No process-wide cache — the GUI wrapper in LocalSettingsActions.ts keeps
 * that.
 */
export async function readLocalAccountSettingsFromDisk(
  account: EdgeAccount
): Promise<LocalAccountSettings> {
  let text: string
  try {
    text = await account.localDisklet.getText(LOCAL_SETTINGS_FILENAME)
  } catch (error: unknown) {
    if (!isMissingFile(error)) throw error
    return asLocalAccountSettings({})
  }
  // `asJSON`, so one cleaner owns both the parse and the shape — and it
  // *throws* for a file that is there and unreadable. "As good as absent"
  // was true of the value and false of the consequence: this is the strict
  // reader a read-modify-write uses, so answering the thirteen defaults for
  // a truncated `Settings.json` meant one `local-settings --spam-filter-on`
  // wrote them back over the user's `spendingLimits` — the PIN-above-amount
  // control — `passwordReminder`, `notifState`, `reviewTrigger`,
  // `developerModeOn`, `isAccountBalanceVisible` and `tokenWarningsShown`.
  // `readLocalAccountSettingsOrDefaults` is the lenient door, and it reports
  // the failure as `trusted: false`.
  return asJSON(asLocalAccountSettings)(text)
}

/**
 * As `readLocalAccountSettingsFromDisk`, for a caller that only reads.
 *
 * The strict reader exists so a read-modify-write cannot answer an
 * unreadable file with the 13 defaults and then write them back over the
 * user's `spendingLimits`. That argument is about the *write*, and applying
 * it to read-only callers took something that could not fail before this
 * branch and made it fatal: `account.localDisklet` is core's
 * `encryptDisklet`, so a truncated `Settings.json` — the interrupted write
 * the strict reader's own docstring cites — throws a parse or cleaner error
 * that `isMissingFile` cannot match. That propagated out of
 * `initializeAccount`, so the `LOGIN` action was never dispatched and the
 * user sat on the login scene with a toast on every attempt; it also hard
 * failed `GET /local-settings` and every `get-transactions`, through
 * `resolveListSpamThreshold`.
 *
 * `trusted` is false when the file was there and could not be read. A caller
 * that caches must not then mark itself authoritative, or a later write would
 * persist these defaults over the real file — which is the destruction the
 * strict reader is for, arriving by the other door.
 * `LocalSettingsActions.ts` records it as a trust state and refuses the write
 * while it is untrusted; a flag that only forced a re-read did not stop this,
 * because the second read fails the same way and answers with the same
 * defaults.
 */
export async function readLocalAccountSettingsOrDefaults(
  account: EdgeAccount
): Promise<{ settings: LocalAccountSettings; trusted: boolean }> {
  try {
    return {
      settings: await readLocalAccountSettingsFromDisk(account),
      trusted: true
    }
  } catch (error: unknown) {
    reportWarning(
      `Could not read ${LOCAL_SETTINGS_FILENAME}, using defaults: ${errorMessage(
        error
      )}`
    )
    return { settings: asLocalAccountSettings({}), trusted: false }
  }
}

export async function writeLocalAccountSettingsToDisk(
  account: EdgeAccount,
  settings: LocalAccountSettings
): Promise<LocalAccountSettings> {
  // Through the cleaner's uncleaner, so a shape change is a compile error.
  const text = JSON.stringify(uncleanLocalAccountSettings(settings))
  await account.localDisklet.setText(LOCAL_SETTINGS_FILENAME, text)
  return settings
}
