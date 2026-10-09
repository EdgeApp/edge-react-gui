import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  getLocalAccountSettings,
  resetLocalAccountSettingsCache,
  writeLocalAccountSettings
} from '../../actions/LocalSettingsActions'
import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'
import { readLocalAccountSettingsFromDisk } from '../../util/localAccountSettings'

jest.mock('../../components/services/AirshipInstance', () => ({
  showError: jest.fn(),
  showToast: jest.fn()
}))

/**
 * A file that is there and cannot be read.
 *
 * `account.localDisklet` is core's `encryptDisklet`, whose `getText` runs
 * `JSON.parse` then `asEdgeBox` then `decryptText`, so an interrupted write
 * surfaces as a parse error — which is neither spelling `isMissingFile`
 * knows.
 */
const corrupt = (): Error => new SyntaxError('Unexpected end of JSON input')

/**
 * Every settings write is a read-modify-write, so the base has to be real.
 *
 * The lenient reader answers an unreadable `Settings.json` with the 13
 * defaults. The first settings change the user then made read-modify-wrote
 * those defaults over the file, losing `spendingLimits`,
 * `passwordReminder`, `notifState`, `reviewTrigger`, `developerModeOn`,
 * `isAccountBalanceVisible` and `tokenWarningsShown` — and the comment that
 * justified the lenient read claimed a flag prevented exactly that.
 */
describe('settings trust', () => {
  beforeEach(() => {
    resetLocalAccountSettingsCache()
  })

  it('refuses to write over a file it could not read', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      localError: corrupt(),
      onLocalWrite: (_path, text) => {
        written.push(text)
      }
    })

    // The read a login does, which must not fail.
    const settings = await getLocalAccountSettings(account)
    expect(settings.spamFilterOn).toBe(true)

    // The write a settings toggle does, which must.
    await expect(
      writeLocalAccountSettings(account, {
        ...settings,
        developerModeOn: true
      })
    ).rejects.toThrow(/could not be read/)
    expect(written).toStrictEqual([])
  })

  it('writes once the file can be read again', async () => {
    const written: string[] = []
    // A failure that heals, so the read has to be re-driven: the fixture
    // answers `localError` while it is set and the file afterwards.
    const opts = { localError: corrupt() as Error | undefined }
    const account = makeFakeDiskletAccount({
      local: '{"developerModeOn":false}',
      get localError() {
        return opts.localError
      },
      onLocalWrite: (_path, text) => {
        written.push(text)
      }
    })

    await getLocalAccountSettings(account)
    // A transient failure heals: the untrusted state forces a re-read.
    opts.localError = undefined
    const settings = await getLocalAccountSettings(account)
    await writeLocalAccountSettings(account, {
      ...settings,
      developerModeOn: true
    })
    expect(written).toHaveLength(1)
    expect(JSON.parse(written[0]).developerModeOn).toBe(true)
  })

  it('writes for an account whose file is simply absent', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      onLocalWrite: (_path, text) => {
        written.push(text)
      }
    })
    // No read first: a direct caller of the write door, which must still
    // check the file rather than assume it is absent.
    const settings = await getLocalAccountSettings(account)
    await writeLocalAccountSettings(account, { ...settings })
    expect(written).toHaveLength(1)
  })
})

/**
 * A read-modify-write must not answer an unreadable file with the defaults.
 *
 * `readLocalAccountSettingsFromDisk` is the strict reader — the one the CLI's
 * `local-settings` route and the GUI's write path use — and it answered
 * `asLocalAccountSettings({})` for a file that was present and unparseable,
 * so one write reset `spendingLimits` (the PIN-above-amount control),
 * `passwordReminder`, `notifState`, `reviewTrigger`, `developerModeOn`,
 * `isAccountBalanceVisible` and `tokenWarningsShown` for that account.
 */
describe('readLocalAccountSettingsFromDisk', () => {
  it('throws for a file it cannot parse', async () => {
    const account = makeFakeDiskletAccount({ local: '{"spamFilterOn":' })
    await expect(readLocalAccountSettingsFromDisk(account)).rejects.toThrow()
  })

  it('throws for valid JSON that is not a settings object', async () => {
    // The gap the strict reader had. `asLocalAccountSettings` is
    // `asMaybe(inner, () => inner({}))`, so only `asJSON`'s *parse* could
    // fail: each of these cleaned to all thirteen defaults, reported
    // `trusted: true`, and was then written back over the user's
    // `spendingLimits`. `asObject` accepts an array, so `[]` is the one a
    // half-synced file is likeliest to produce.
    for (const local of ['[]', '"x"', '42', 'null', '[1,2,3]']) {
      const account = makeFakeDiskletAccount({ local })
      await expect(readLocalAccountSettingsFromDisk(account)).rejects.toThrow()
    }
  })

  it('keeps the other fields when one value is unreadable', async () => {
    // Per-field tolerance is deliberate — every field is `asMaybe` with its
    // own default, so one setting this version cannot read costs that
    // setting. What must not happen is the *file* being answered with all
    // thirteen defaults, which is the case above.
    const account = makeFakeDiskletAccount({
      local: '{"spendingLimits":"all of it","developerModeOn":true}'
    })
    const settings = await readLocalAccountSettingsFromDisk(account)
    expect(settings.developerModeOn).toBe(true)
    expect(settings.spendingLimits.transaction.isEnabled).toBe(false)
  })

  it('still answers the defaults for an absent file', async () => {
    // The one case the defaults are right for.
    const settings = await readLocalAccountSettingsFromDisk(
      makeFakeDiskletAccount({})
    )
    expect(settings.spamFilterOn).toBe(true)
  })
})
