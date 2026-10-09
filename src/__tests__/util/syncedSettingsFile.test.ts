import { describe, expect, it } from '@jest/globals'

import { asSyncedAccountSettings } from '../../actions/SettingsActions'
import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'
import {
  asSyncedSettingsSubset,
  readSyncedSettingsOrThrow,
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

  it('agrees with the GUI on the display denominations', () => {
    // The field an export's numbers depend on: the GUI writes a user's unit
    // choice here and both exporters divide by it, so the subset has to read
    // the same records the GUI's cleaner does.
    const settings = {
      denominationSettings: {
        bitcoin: { BTC: { name: 'bits', multiplier: '100', symbol: 'ƀ' } }
      }
    }
    const gui = asSyncedAccountSettings(settings)
    const subset = asSyncedSettingsSubset(settings)
    expect(subset.denominationSettings).toStrictEqual(gui.denominationSettings)
    // And the default is the same empty map, not undefined.
    expect(asSyncedSettingsSubset({}).denominationSettings).toStrictEqual({})
  })

  it('drops one unreadable asset record rather than the file', () => {
    const cleaned = asSyncedSettingsSubset({
      defaultIsoFiat: 'iso:EUR',
      denominationSettings: {
        bitcoin: { BTC: { name: 'bits' } },
        ethereum: { ETH: { name: 'ETH', multiplier: '1000000000000000000' } }
      }
    })
    expect(cleaned.defaultIsoFiat).toBe('iso:EUR')
    expect(cleaned.denominationSettings.bitcoin?.BTC).toBeUndefined()
    expect(cleaned.denominationSettings.ethereum?.ETH?.name).toBe('ETH')
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

/**
 * The reader two security-relevant answers come from.
 *
 * `defaultIsoFiat` labels and prices a whole `get-transactions` response and
 * every CSV, QBO and Bitwave file written from it, and
 * `autoLogoutTimeInSeconds` is the auto-logout window. Neither may be the
 * cleaner's default because a file that is *there* could not be read — and
 * neither may fail for the fresh account that has no file at all.
 */
describe('readSyncedSettingsOrThrow', () => {
  it('answers the defaults for an account with no file yet', async () => {
    const settings = await readSyncedSettingsOrThrow(makeFakeDiskletAccount({}))
    expect(settings.defaultIsoFiat).toBe('iso:USD')
    expect(settings.autoLogoutTimeInSeconds).toBe(3600)
  })

  it('lets a read failure out rather than substituting the defaults', async () => {
    // `account.disklet` is core's `encryptDisklet`: an interrupted write
    // surfaces as a parse error, which is not a spelling `isMissingFile`
    // knows.
    const account = makeFakeDiskletAccount({
      syncedError: new SyntaxError('Unexpected end of JSON input')
    })
    await expect(readSyncedSettingsOrThrow(account)).rejects.toThrow(
      /Unexpected end of JSON input/
    )
  })

  it('still answers the defaults for a file this version cannot parse', async () => {
    // Deliberately lenient: the file was read, and no version could make
    // anything but the defaults out of it.
    const account = makeFakeDiskletAccount({ synced: '{"defaultIsoFiat":' })
    const settings = await readSyncedSettingsOrThrow(account)
    expect(settings.defaultIsoFiat).toBe('iso:USD')
  })

  it('returns the stored values', async () => {
    const account = makeFakeDiskletAccount({
      synced: '{"defaultIsoFiat":"iso:EUR","autoLogoutTimeInSeconds":0}'
    })
    const settings = await readSyncedSettingsOrThrow(account)
    expect(settings.defaultIsoFiat).toBe('iso:EUR')
    expect(settings.autoLogoutTimeInSeconds).toBe(0)
  })
})
