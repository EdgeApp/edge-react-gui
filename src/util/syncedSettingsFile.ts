import { asJSON, asMaybe, asNumber, asObject, asString } from 'cleaners'

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
 * The same read, letting an I/O or decryption failure out.
 *
 * The engine's auto-logout ticker re-reads this file every sweep and has a
 * `catch` whose stated job is to keep the last known window. That `catch`
 * was dead code, because `readSyncedSettings` swallows the failure itself —
 * so one unreadable read silently replaced a live `autoLogoutTimeInSeconds`
 * with the cleaner's 3600, and an account that had set `0` to disable
 * auto-logout was logged out an hour later, mid-script.
 */
export async function readSyncedSettingsOrThrow(account: {
  disklet: { getText: (path: string) => Promise<string> }
}): Promise<SyncedSettingsSubset> {
  const text = await account.disklet.getText(SYNCED_SETTINGS_FILENAME)
  // A file this version cannot parse is as good as absent: the defaults are
  // the only thing it could become. Only the read itself is allowed to fail.
  return (
    asMaybe(asJSON(asSyncedSettingsSubset))(text) ?? asSyncedSettingsSubset({})
  )
}

export type SyncedSettingsSubset = ReturnType<typeof asSyncedSettingsSubset>
