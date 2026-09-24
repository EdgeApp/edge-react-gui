import { asMaybe, asNumber, asObject, asString } from 'cleaners'

/** The synced account settings file, on `account.disklet`. */
export const SYNCED_SETTINGS_FILENAME = 'Settings.json'

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
  defaultIsoFiat: asMaybe(asString, 'iso:USD')
}).withRest
