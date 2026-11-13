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
  asMaybe,
  asNumber,
  asObject,
  asOptional,
  asString,
  asValue,
  type Cleaner
} from 'cleaners'

import { isMissingFile } from './predicates'
import { asJsonObject } from './syncedFileForWrite'

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

type DenominationSettingsSubset = ReturnType<
  typeof asDenominationSettingsSubset
>

/**
 * The fields of the synced settings that Node-safe code reads.
 *
 * The GUI's full `asSyncedAccountSettings` lives in `actions/SettingsActions`,
 * which imports Airship, so neither the CLI engine nor the shared modules can
 * reach it. This is a narrow `.withRest` view of the same file with the
 * same defaults — `syncedSettingsFile.test.ts` asserts the two agree, so the
 * subset cannot drift from the file the GUI writes.
 */
const asSwapPluginType: Cleaner<'CEX' | 'DEX'> = asValue('CEX', 'DEX')

export const asSyncedSettingsSubset = asObject({
  autoLogoutTimeInSeconds: asMaybe(asNumber, 3600),
  defaultIsoFiat: asMaybe(asString, 'iso:USD'),
  // What units an amount is *shown* in. The GUI's export writes the display
  // denomination into its CSV and QBO files, so an engine that knew only the
  // exchange denomination would write a different number for the same
  // transaction (`AMT_ASSET=500` with `DENOMINATION=bits` from the scene
  // against `0.0005` and `BTC` from `edge-cli`), and QBO's `TRNAMT` carries
  // no unit field at all to tell them apart.
  denominationSettings: asMaybe<DenominationSettingsSubset>(
    asDenominationSettingsSubset,
    () => ({})
  ),
  // The swap provider the user prefers, which `fetch-swap-quotes` passes to
  // core as the app does. The app's cleaners for the two fields.
  preferredSwapPluginId: asMaybe(asString),
  preferredSwapPluginType: asMaybe(asSwapPluginType)
}).withRest

/**
 * The account's synced settings, with the cleaner's defaults applied.
 *
 * One reader, so each default is stated once, in the cleaner.
 *
 * An absent file, or one that cannot be read, yields the defaults. A caller
 * that must not change its mind on a transient failure uses
 * `readSyncedSettingsOrThrow` below, which throws for a file that *is* there
 * and cannot be read.
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
 * `catch` whose stated job is to keep the last known window. Through
 * `readSyncedSettings`, which swallows the failure itself, that `catch`
 * would be dead code: one unreadable read would silently replace a live
 * `autoLogoutTimeInSeconds` with the cleaner's 3600, and an account that had
 * set `0` to disable auto-logout would be logged out an hour later,
 * mid-script.
 *
 * "Unreadable" means the I/O, the decryption *and* the parse: the commonest
 * shape of the failure is a truncated or half-synced `Settings.json`, which
 * reads fine and does not parse. Every caller of this door is one that must
 * not substitute: the spam floor, an export's `defaultIsoFiat`, the
 * denomination settings and the auto-logout window. `readSyncedSettings` is
 * the lenient door and says so.
 */
export async function readSyncedSettingsOrThrow(account: {
  disklet: { getText: (path: string) => Promise<string> }
}): Promise<SyncedSettingsSubset> {
  return asSyncedSettingsSubset(await readSyncedSettingsObjectOrThrow(account))
}

/**
 * The file's top-level object, before any cleaner: what both strict reads
 * share.
 *
 * The engine applies the subset above and the GUI applies its full
 * `asSyncedAccountSettings`, but what counts as an object is `asJsonObject`
 * — the same test the GUI's write door, `readSyncedFileForWrite`, applies —
 * so the halves cannot disagree about whether a given `Settings.json` is
 * readable.
 */
export async function readSyncedSettingsObjectOrThrow(account: {
  disklet: { getText: (path: string) => Promise<string> }
}): Promise<object> {
  // An absent file genuinely *is* the defaults — a fresh account has no
  // `Settings.json` and the engine logs into those. Only a file that is
  // there and cannot be read reaches the caller as a failure.
  let text: string
  try {
    text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
  } catch (error: unknown) {
    if (!isMissingFile(error)) throw error
    return {}
  }
  // A file that is there and cannot be read means one thing on both halves
  // of this read. An `asMaybe` here would swallow a truncated or half-synced
  // `Settings.json` into the cleaner's defaults, which is exactly what this
  // function exists to refuse: `autoLogoutTimeInSeconds` would silently
  // become 3600 for an account that had set `0` to disable it, and
  // `engine-sessions` would report the substituted value as though the user
  // had chosen it. The tolerance belongs to `readSyncedSettings`, which has
  // a stated fallback.
  //
  // `asJsonObject` before any cleaner, because `asObject` accepts an array
  // — so `[]`, which is what a half-written file is likeliest to be when it
  // is valid JSON and not these settings, would otherwise clean to the same
  // defaults without `asMaybe` being involved at all.
  return asJsonObject(text)
}

export type SyncedSettingsSubset = ReturnType<typeof asSyncedSettingsSubset>
