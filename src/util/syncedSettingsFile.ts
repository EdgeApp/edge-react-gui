/**
 * The synced account settings file, as a shape both halves can read.
 *
 * `Settings.json` on `account.disklet` is written by the app and read by the
 * engine — `defaultIsoFiat` decides every fiat figure the CLI prints — so
 * the filename and the cleaner live in one Node-safe module rather than in
 * the GUI's settings actions.
 *
 * Node-safe, like everything the CLI shares: no react-native, no Redux, no
 * Airship.
 */
import {
  asJSON,
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString
} from 'cleaners'

import { isMissingFile, isPlainObject } from './predicates'

/** The synced account settings file, on `account.disklet`. */
export const SYNCED_SETTINGS_FILENAME = 'Settings.json'

/**
 * One asset's chosen display units, as the GUI writes them.
 *
 * The same three fields as the GUI's `asCurrencyCodeDenom`, which
 * `syncedSettingsFile.test.ts` pins against this one. Node-safe, so the
 * engine can read a user's unit choice instead of guessing it.
 */
const asDisplayDenomination = asObject({
  name: asString,
  multiplier: asString,
  symbol: asOptional(asString)
})

/**
 * Which units each asset is shown in, by pluginId then currency code.
 *
 * `asMaybe` at both levels, like the GUI's own cleaner: one asset's record
 * this version cannot read costs that asset's choice, not the file.
 */
const asDenominationSettingsSubset = asObject(
  asMaybe(asObject(asMaybe(asDisplayDenomination)))
)

export type DenominationSettingsSubset = ReturnType<
  typeof asDenominationSettingsSubset
>

/**
 * The fields of the synced settings that Node-safe code reads.
 *
 * The GUI's full `asSyncedAccountSettings` lives in `actions/SettingsActions`,
 * which imports Airship, so neither the CLI engine nor the extracted modules
 * can reach it. This is a narrow `.withRest` view of the same file with the
 * same defaults — `syncedSettingsFile.test.ts` asserts the two agree, so the
 * subset cannot drift from the file the GUI writes.
 */
export const asSyncedSettingsSubset = asObject({
  autoLogoutTimeInSeconds: asMaybe(asNumber, 3600),
  defaultIsoFiat: asMaybe(asString, 'iso:USD'),
  // What units an amount is *shown* in. The GUI's export writes the display
  // denomination into its CSV and QBO files, so an engine that only knew the
  // exchange denomination wrote a different number for the same transaction
  // — `AMT_ASSET=50000` with `DENOMINATION=bits` from the scene against
  // `0.0005` and `BTC` from `edge-cli`, and QBO's `TRNAMT` carries no unit
  // field at all to tell them apart.
  denominationSettings: asMaybe<DenominationSettingsSubset>(
    asDenominationSettingsSubset,
    () => ({})
  )
}).withRest

/**
 * The account's synced settings, with the cleaner's defaults applied.
 *
 * One reader. `readAutoLogoutSeconds` and `readDefaultIsoFiat` were the same
 * `getText` → `asMaybe(asJSON(…))` → field wrapper with an identical empty
 * `catch`, and each restated a default the cleaner already supplies — so
 * changing a default here left two call sites stale.
 *
 * An absent file, or one this version cannot read, yields the defaults —
 * which is what every caller wanted from its own `catch`. A failure to read
 * a file that *is* there throws, so a caller that must not change its mind
 * on a transient failure can tell the two apart; `readSyncedSettingsOrThrow`
 * below is that caller's entry point.
 */
export async function readSyncedSettings(account: {
  disklet: { getText: (path: string) => Promise<string> }
}): Promise<SyncedSettingsSubset> {
  try {
    return await readSyncedSettingsOrThrow(account)
  } catch {
    // Unreadable: the defaults are the answer for a caller with nothing
    // better to fall back to.
    return asSyncedSettingsSubset({})
  }
}

/**
 * The same read, letting a file that is there and unreadable out.
 *
 * The engine's auto-logout ticker re-reads this file every sweep and has a
 * `catch` whose stated job is to keep the last known window. That `catch`
 * was dead code, because `readSyncedSettings` swallows the failure itself —
 * so one unreadable read silently replaced a live `autoLogoutTimeInSeconds`
 * with the cleaner's 3600, and an account that had set `0` to disable
 * auto-logout was logged out an hour later, mid-script.
 *
 * "Unreadable" means the I/O, the decryption *and* the parse. Only the
 * first was let out at first, so the commonest shape of the failure — a
 * truncated or half-synced `Settings.json`, which reads fine and does not
 * parse — still came back as the defaults on the very path written to
 * refuse them. Every caller of this door is one that must not substitute:
 * the spam floor, an export's `defaultIsoFiat`, the denomination settings
 * and the auto-logout window. `readSyncedSettings` is the lenient door and
 * says so.
 */
export async function readSyncedSettingsOrThrow(account: {
  disklet: { getText: (path: string) => Promise<string> }
}): Promise<SyncedSettingsSubset> {
  // An absent file genuinely *is* the defaults — a fresh account has no
  // `Settings.json` and the engine logs into those. Only a file that is
  // there and cannot be read reaches the caller as a failure.
  let text: string
  try {
    text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
  } catch (error: unknown) {
    if (!isMissingFile(error)) throw error
    return asSyncedSettingsSubset({})
  }
  // A file that is there and cannot be read means one thing on both halves
  // of this read. "As good as absent" was true of the value and false of
  // the consequence: `asMaybe` here swallowed a truncated or half-synced
  // `Settings.json` into the cleaner's defaults, which is exactly what this
  // function exists to refuse — `autoLogoutTimeInSeconds` silently became
  // 3600 for an account that had set `0` to disable it, and
  // `engine-sessions` reported the substituted value as though the user had
  // chosen it, on the path written to prevent that. The tolerance belongs to
  // `readSyncedSettings`, which has a stated fallback.
  //
  // `isPlainObject` before the cleaner, because `asObject` accepts an array
  // — so `[]`, which is what a half-written file is likeliest to be when it
  // is valid JSON and not these settings, would otherwise clean to the same
  // defaults without `asMaybe` being involved at all.
  return asJSON((raw: unknown) => {
    if (!isPlainObject(raw)) {
      throw new TypeError(
        `${SYNCED_SETTINGS_FILENAME} is not a settings object`
      )
    }
    return asSyncedSettingsSubset(raw)
  })(text)
}

export type SyncedSettingsSubset = ReturnType<typeof asSyncedSettingsSubset>
