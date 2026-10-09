import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  markSecurityChecked,
  migrateDenominationSettings,
  pushMostRecentWallet,
  readSyncedSettings,
  readSyncedSettingsForLogin,
  resetSyncedSettingsTrust,
  syncedSettingsAreTrusted,
  updateSyncedSettings,
  writeMostRecentWalletSelected
} from '../../actions/SettingsActions'
import { lstrings } from '../../locales/strings'
import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'

jest.mock('../../components/services/AirshipInstance', () => ({
  Airship: { show: jest.fn() },
  showError: jest.fn(),
  showToast: jest.fn()
}))

/**
 * A synced `Settings.json` that is there and cannot be read.
 *
 * `account.disklet` is core's `encryptDisklet`, so an interrupted write or a
 * half-finished sync surfaces as a parse or cleaner error — neither spelling
 * `isMissingFile` knows.
 */
const corrupt = (): Error => new SyntaxError('Unexpected end of JSON input')

/**
 * The one write door, `updateSyncedSettings`.
 *
 * Every writer used to spread its change over a lenient read and hand the
 * whole object back, so a failed read wrote the defaults over the real file
 * on the synced repo, for every device — and a "heal" that re-read the file
 * successfully still wrote the stale, defaults-based object.
 */
describe('updateSyncedSettings', () => {
  it('writes nothing when the file is present and unreadable', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      syncedError: corrupt(),
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })

    await expect(
      updateSyncedSettings(account, settings => ({
        ...settings,
        countryCode: 'DE'
      }))
    ).rejects.toThrow()
    expect(written).toStrictEqual([])
  })

  it('keeps the fields it was not asked to change once the file reads again', async () => {
    // The case the old guard lost: the lenient read failed, so anything a
    // caller built from it was the defaults. Once the file reads again, the
    // write must land on the file — not on what the failed read produced.
    const written: string[] = []
    const opts = { syncedError: corrupt() as Error | undefined }
    const account = makeFakeDiskletAccount({
      synced: '{"countryCode":"US","defaultIsoFiat":"iso:EUR"}',
      get syncedError() {
        return opts.syncedError
      },
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })

    expect((await readSyncedSettings(account)).defaultIsoFiat).toBe('iso:USD')
    opts.syncedError = undefined
    await updateSyncedSettings(account, settings => ({
      ...settings,
      countryCode: 'DE'
    }))
    expect(written).toHaveLength(1)
    const stored = JSON.parse(written[0])
    expect(stored.countryCode).toBe('DE')
    expect(stored.defaultIsoFiat).toBe('iso:EUR')
  })

  it('writes for an account whose file is simply absent', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })
    await updateSyncedSettings(account, settings => ({
      ...settings,
      countryCode: 'DE'
    }))
    expect(written).toHaveLength(1)
  })

  it('refuses valid JSON that is not a settings object', async () => {
    // `asObject` accepts an array, and every field of
    // `asSyncedAccountSettings` is `asMaybe` with its own default — so each
    // of these read as a *successful* read of every default and was then
    // written back over the real file.
    for (const synced of ['[]', '"x"', '42', '[1,2,3]']) {
      const written: string[] = []
      const account = makeFakeDiskletAccount({
        synced,
        onSyncedWrite: (_path, text) => {
          written.push(text)
        }
      })
      await expect(
        updateSyncedSettings(account, settings => ({
          ...settings,
          countryCode: 'DE'
        }))
      ).rejects.toThrow()
      expect(written).toStrictEqual([])
    }
  })
})

/**
 * Whether Redux's synced settings are the user's own.
 *
 * Redux is filled once, by the login's read, so that read's outcome is the
 * answer — not whichever lenient read ran last somewhere in the app.
 */
describe('syncedSettingsAreTrusted', () => {
  beforeEach(() => {
    resetSyncedSettingsTrust()
  })

  it('follows the login read and nothing else', async () => {
    expect(syncedSettingsAreTrusted()).toBe(true)

    const opts = { syncedError: corrupt() as Error | undefined }
    const account = makeFakeDiskletAccount({
      synced: '{"defaultIsoFiat":"iso:EUR"}',
      get syncedError() {
        return opts.syncedError
      }
    })

    const settings = await readSyncedSettingsForLogin(account)
    expect(settings.defaultIsoFiat).toBe('iso:USD')
    expect(syncedSettingsAreTrusted()).toBe(false)

    // A later read that succeeds does not refresh Redux, so it must not
    // vouch for it.
    opts.syncedError = undefined
    expect((await readSyncedSettings(account)).defaultIsoFiat).toBe('iso:EUR')
    expect(syncedSettingsAreTrusted()).toBe(false)

    // The next login does refresh Redux.
    await readSyncedSettingsForLogin(account)
    expect(syncedSettingsAreTrusted()).toBe(true)

    // And a good login is not undone by a later failed read.
    opts.syncedError = corrupt()
    await readSyncedSettings(account)
    expect(syncedSettingsAreTrusted()).toBe(true)
  })

  it('resets on logout', async () => {
    await readSyncedSettingsForLogin(
      makeFakeDiskletAccount({ syncedError: corrupt() })
    )
    expect(syncedSettingsAreTrusted()).toBe(false)
    resetSyncedSettingsTrust()
    expect(syncedSettingsAreTrusted()).toBe(true)
  })
})

/**
 * The login-time migration, which is how the loss arrived unprompted.
 *
 * Handed the login's lenient read, an unreadable file reached it as
 * `SYNCED_ACCOUNT_DEFAULTS` — `denominationSettings` `{}` and
 * `denominationSettingsOptimized` `false` — which takes the "nothing to
 * clean, just set the flag" branch and writes the whole file out as
 * defaults. `defaultIsoFiat`, `denominationSettings`, `walletsSort`,
 * `mostRecentWallets`, `userPausedWallets`, `securityCheckedWallets`,
 * `preferredSwapPluginId` and `countryCode` all go, on the synced repo, for
 * every device — and the flag it sets means no later login retries.
 */
describe('migrateDenominationSettings', () => {
  it('writes nothing when the file is present and unreadable', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      syncedError: corrupt(),
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })
    // The login reads leniently first, exactly as `initializeAccount` does.
    await readSyncedSettings(account)
    await expect(migrateDenominationSettings(account)).rejects.toThrow()
    expect(written).toStrictEqual([])
  })

  it('still sets the flag for a readable file with no denominations', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      synced: '{"countryCode":"US"}',
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })
    await migrateDenominationSettings(account)
    expect(written).toHaveLength(1)
    const stored = JSON.parse(written[0])
    expect(stored.denominationSettingsOptimized).toBe(true)
    // And the base was the file, not the defaults.
    expect(stored.countryCode).toBe('US')
  })

  it('does nothing at all once the flag is set', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      synced: '{"denominationSettingsOptimized":true}',
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })
    await migrateDenominationSettings(account)
    expect(written).toStrictEqual([])
  })
})

/**
 * Collections written by callers that read them earlier.
 *
 * The write door protected every field but the one being written: these
 * callers built the whole collection from a lenient read or from Redux and
 * handed it over, so a stale or empty copy replaced the file's own.
 */
describe('collection writes', () => {
  const fileWith = (
    settings: Record<string, unknown>
  ): {
    account: ReturnType<typeof makeFakeDiskletAccount>
    written: string[]
  } => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      synced: JSON.stringify(settings),
      onSyncedWrite: (_path, text) => {
        written.push(text)
      }
    })
    return { account, written }
  }

  it('moves one wallet to the front of the file’s own most-recent list', async () => {
    const { account, written } = fileWith({
      mostRecentWallets: [
        { id: 'a', tokenId: null },
        { id: 'b', tokenId: null }
      ]
    })
    const list = await writeMostRecentWalletSelected(account, 'b', null)
    expect(list.map(w => w.id)).toStrictEqual(['b', 'a'])
    expect(JSON.parse(written[0]).mostRecentWallets).toStrictEqual([
      { id: 'b', tokenId: null },
      { id: 'a', tokenId: null }
    ])
  })

  it('caps the most-recent list at 100', () => {
    const long = Array.from({ length: 100 }, (_, i) => ({
      id: `w${i}`,
      tokenId: null
    }))
    const next = pushMostRecentWallet(long, 'new', null)
    expect(next).toHaveLength(100)
    expect(next[0].id).toBe('new')
    expect(next[99].id).toBe('w98')
  })

  it('merges only the security-check entries a caller changed', async () => {
    const { account, written } = fileWith({
      securityCheckedWallets: {
        other: { checked: false, modalShown: 2 },
        mine: { checked: false, modalShown: 1 }
      }
    })
    await updateSyncedSettings(account, latest => ({
      ...latest,
      securityCheckedWallets: markSecurityChecked(
        latest.securityCheckedWallets,
        ['fresh'],
        ['mine']
      )
    }))
    expect(JSON.parse(written[0]).securityCheckedWallets).toStrictEqual({
      other: { checked: false, modalShown: 2 },
      mine: { checked: false, modalShown: 2 },
      fresh: { checked: true, modalShown: 0 }
    })
  })

  it('refuses an unreadable file in the user’s language, not the parser’s', async () => {
    const account = makeFakeDiskletAccount({ synced: '{"countryCode":' })
    await expect(
      updateSyncedSettings(account, latest => latest)
    ).rejects.toThrow(lstrings.settings_not_saved_synced_unreadable)
  })
})
