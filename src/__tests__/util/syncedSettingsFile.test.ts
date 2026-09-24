import { describe, expect, it } from '@jest/globals'

import { asSyncedAccountSettings } from '../../actions/SettingsActions'
import {
  asSyncedSettingsSubset,
  SYNCED_SETTINGS_FILENAME
} from '../../util/syncedSettingsFile'

describe('asSyncedSettingsSubset', () => {
  it('agrees with the GUI cleaner on the fields it shares', () => {
    // The GUI's cleaner cannot be imported by Node-safe code (it pulls in
    // Airship), so this pins the subset's defaults to it instead.
    const guiDefaults = asSyncedAccountSettings({})
    const subsetDefaults = asSyncedSettingsSubset({})

    expect(subsetDefaults.autoLogoutTimeInSeconds).toBe(
      guiDefaults.autoLogoutTimeInSeconds
    )
    expect(subsetDefaults.defaultIsoFiat).toBe(guiDefaults.defaultIsoFiat)
  })

  it('reads the same file the GUI writes', () => {
    expect(SYNCED_SETTINGS_FILENAME).toBe('Settings.json')
  })

  it('keeps unknown fields rather than stripping the GUI’s settings', () => {
    const cleaned = asSyncedSettingsSubset({
      autoLogoutTimeInSeconds: 60,
      walletsSort: 'name'
    })
    expect(cleaned.autoLogoutTimeInSeconds).toBe(60)
    expect((cleaned as unknown as { walletsSort: string }).walletsSort).toBe(
      'name'
    )
  })

  it('falls back to the defaults for a malformed value', () => {
    const cleaned = asSyncedSettingsSubset({
      autoLogoutTimeInSeconds: 'soon',
      defaultIsoFiat: 42
    })
    expect(cleaned.autoLogoutTimeInSeconds).toBe(3600)
    expect(cleaned.defaultIsoFiat).toBe('iso:USD')
  })
})
