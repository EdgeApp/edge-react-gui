import { asJSON, uncleaner } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'

import {
  asLocalAccountSettings,
  asLocalAccountSettingsInner,
  type LocalAccountSettings
} from '../types/types'
import { errorMessage } from './errorMessage'
import { isMissingFile, isPlainObject } from './predicates'
import { reportWarning } from './reportWarning'

/**
 * The *inner* cleaner, which can fail.
 *
 * `asLocalAccountSettings` is `asMaybe(inner, () => inner({}))`, and
 * `uncleaner()` only sets a global flag and calls the cleaner — so
 * un-cleaning through it ran `asMaybe`'s `try { inner(raw) } catch { return
 * fallback() }` in un-cleaning mode. A settings object the published shape
 * rejects was not reported: it was *replaced* by the twelve defaults, and
 * `writeLocalAccountSettingsToDisk` then stringified those over
 * `spendingLimits`, `passwordReminder`, `notifState`, `reviewTrigger`,
 * `developerModeOn`, `isAccountBalanceVisible` and `tokenWarningsShown`.
 * Per field too, since each entry is its own `asMaybe` —
 * `reviewTrigger`'s `nextTriggerDate: asOptional(asDate)` un-cleans through
 * `Date.prototype.toISOString`, which throws on an invalid `Date` and
 * dropped the whole `reviewTrigger` record.
 *
 * That is the destruction this module's docblock, the `trusted` flag and
 * `localSettingsTrust.test.ts` exist to prevent, arriving by the write door.
 * The comment below ("so a shape change is a compile error") was true of the
 * types and read as though the call were a runtime check as well, which is
 * what made it easy to miss. Every sibling writer in the branch uncleans a
 * cleaner that can throw — `exportTxInfo.ts`, `CategoriesActions.ts`,
 * `runFile.ts`, `sessionFile.ts`. Type-identical, so this is one word.
 */
const uncleanLocalAccountSettings = uncleaner(asLocalAccountSettingsInner)

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
 * 12 defaults and then writing them back turned one unreadable file — an
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
  // reader a read-modify-write uses, so answering the twelve defaults for
  // a truncated `Settings.json` meant one `local-settings --spam-filter-on`
  // wrote them back over the user's `spendingLimits` — the PIN-above-amount
  // control — `passwordReminder`, `notifState`, `reviewTrigger`,
  // `developerModeOn`, `isAccountBalanceVisible` and `tokenWarningsShown`.
  // `readLocalAccountSettingsOrDefaults` is the lenient door, and it reports
  // the failure as `trusted: false`.
  //
  // The *inner* cleaner, because `asLocalAccountSettings` is
  // `asMaybe(inner, () => inner({}))`: it cannot fail, so the strictness
  // here reached only `asJSON`'s parse. A file that is valid JSON and not a
  // settings object — `[]`, which `asObject` accepts, `"x"`, `42` — was
  // answered with the twelve defaults, reported `trusted: true`, and
  // written back. The per-field tolerance is inside the inner cleaner, so
  // this still answers one unreadable field with that field's default.
  //
  // `isPlainObject` first, because `asObject` accepts an array — and an
  // array is what a half-synced or hand-edited `Settings.json` is likeliest
  // to be when it is valid JSON and not these settings.
  return asJSON((raw: unknown) => {
    if (!isPlainObject(raw)) {
      throw new TypeError(`${LOCAL_SETTINGS_FILENAME} is not a settings object`)
    }
    return asLocalAccountSettingsInner(raw)
  })(text)
}

/**
 * As `readLocalAccountSettingsFromDisk`, for a caller that only reads.
 *
 * The strict reader exists so a read-modify-write cannot answer an
 * unreadable file with the 12 defaults and then write them back over the
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

/**
 * What a write had to do to an unreadable `Settings.json` before it could
 * proceed.
 *
 * Absent when nothing was done. `moved` keeps the bytes under `to`;
 * `deleted` means the file's content was unrecoverable — it would not parse
 * or decrypt — so there was nothing to keep, and every other setting is
 * now its default. One `undefined` used to stand for both "nothing
 * happened" and "deleted", so a caller logging the move-aside skipped the
 * more destructive outcome entirely.
 */
export type LocalSettingsRecovery =
  | { kind: 'moved'; to: string }
  | { kind: 'deleted'; reason: string }

/**
 * Move an unreadable `Settings.json` aside so writing can resume.
 *
 * The strict reader stops a read-modify-write from putting the 12 defaults
 * over a file it could not read. That is right, and on its own it is a
 * one-way door: the file does not repair itself, so every later write fails
 * the same way forever — `spamFilterOn`, `spendingLimits`, the password
 * reminder, the notification state. The GUI showed "try again" for a
 * condition trying again cannot clear, and `change-local-settings` answered
 * the same `500` indefinitely.
 *
 * Moving the file aside is a door that loses nothing. What a caller could
 * not read, it could not have recovered either; under
 * `Settings.json.unreadable-<ms>` the bytes are still on the disklet for
 * support to look at, and the account gets a writable file again. The
 * timestamp is in the name so a second incident does not overwrite the
 * evidence of the first.
 *
 * `getText` may itself be the thing that failed — `account.localDisklet` is
 * core's `encryptDisklet`, which fails three ways: the underlying I/O, the
 * outer box not parsing, and the decryption. Only the last two mean the
 * content is gone; then there is no plaintext to preserve, the original is
 * deleted, and the answer says so. An I/O failure says nothing about the
 * content — an `EACCES` on a file a `sudo` run left root-owned, an `EMFILE`
 * in a long-lived daemon — and deleting would destroy settings that are
 * intact. It carries a system `code`, which a parse or decryption failure
 * does not, so it is rethrown and the file stays.
 */
export async function quarantineUnreadableLocalSettings(
  account: EdgeAccount
): Promise<LocalSettingsRecovery | undefined> {
  const quarantinePath = `${LOCAL_SETTINGS_FILENAME}.unreadable-${Date.now()}`
  let text: string | undefined
  let contentError: unknown
  try {
    text = await account.localDisklet.getText(LOCAL_SETTINGS_FILENAME)
  } catch (error: unknown) {
    // Nothing to move: the caller's write then lands on an absent file,
    // which is the case the cleaner's defaults are already right for.
    if (isMissingFile(error)) return undefined
    if (isSystemError(error)) throw error
    contentError = error
  }
  if (text != null) {
    await account.localDisklet.setText(quarantinePath, text)
  }
  await account.localDisklet.delete(LOCAL_SETTINGS_FILENAME)
  if (text == null) {
    const reason = errorMessage(contentError)
    reportWarning(
      `${LOCAL_SETTINGS_FILENAME} could not be decrypted (${reason}) and was deleted; settings are back to their defaults`
    )
    return { kind: 'deleted', reason }
  }
  reportWarning(
    `${LOCAL_SETTINGS_FILENAME} could not be read and was moved to ${quarantinePath}; settings are back to their defaults`
  )
  return { kind: 'moved', to: quarantinePath }
}

/** An operating-system failure, as Node and the native disklets report it. */
function isSystemError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}

/**
 * The strict read a write starts from, with a way out when it fails.
 *
 * Two attempts before anything is moved, because one failure does not mean
 * the file is broken: an interrupted write may have completed in the
 * meantime, and a half-synced file may have caught up. Quarantining a
 * `Settings.json` that reads perfectly well on the second attempt would be
 * the same data loss arriving by a third door. Two failures in a row is the
 * bar, and it is this function's job rather than the caller's so that the
 * GUI's write path and `change-local-settings` clear the same one.
 *
 * The answer is the base the caller's change must be applied to — the file
 * when it read, the defaults only when `recovery` says the file is gone.
 */
export async function readLocalAccountSettingsForWrite(
  account: EdgeAccount
): Promise<{
  settings: LocalAccountSettings
  recovery: LocalSettingsRecovery | undefined
}> {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; ++attempt) {
    try {
      return {
        settings: await readLocalAccountSettingsFromDisk(account),
        recovery: undefined
      }
    } catch (error: unknown) {
      lastError = error
    }
  }
  reportWarning(
    `Could not read ${LOCAL_SETTINGS_FILENAME} for writing: ${errorMessage(
      lastError
    )}`
  )
  const recovery = await quarantineUnreadableLocalSettings(account)
  return { settings: asLocalAccountSettings({}), recovery }
}

export async function writeLocalAccountSettingsToDisk(
  account: EdgeAccount,
  settings: LocalAccountSettings
): Promise<LocalAccountSettings> {
  // `isPlainObject` first, for the same reason the read has it: `asObject`
  // accepts an array, so `[]` un-cleaned to the twelve defaults and this
  // wrote them over the real file.
  if (!isPlainObject(settings)) {
    throw new TypeError(`${LOCAL_SETTINGS_FILENAME} must be a settings object`)
  }
  // Through the cleaner's uncleaner, so a shape change is a compile error.
  const text = JSON.stringify(uncleanLocalAccountSettings(settings))
  await account.localDisklet.setText(LOCAL_SETTINGS_FILENAME, text)
  return settings
}
