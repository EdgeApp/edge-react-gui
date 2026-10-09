import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import {
  getLocalAccountSettings,
  resetLocalAccountSettingsCache,
  updateLocalAccountSettings
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

  it('files an unreadable file away rather than writing over it', async () => {
    const written: Array<[string, string]> = []
    const deleted: string[] = []
    // Readable plaintext that is not settings — the half-synced or
    // hand-edited file, and the case where the bytes can be preserved.
    const account = makeFakeDiskletAccount({
      local: 'not json at all',
      onLocalWrite: (path, text) => {
        written.push([path, text])
      },
      onLocalDelete: path => {
        deleted.push(path)
      }
    })

    // The read a login does, which must not fail.
    const settings = await getLocalAccountSettings(account)
    expect(settings.spamFilterOn).toBe(true)

    // The write a settings toggle does. It used to reject, which was right
    // about not overwriting the file and wrong about the way out: the
    // rejection said "try again", and a `Settings.json` that is present and
    // broken does not repair itself — so every later write failed the same
    // way forever, the user's spending limits among them, and the file is on
    // `account.localDisklet` where no user of the shipped app can move it.
    await updateLocalAccountSettings(account, latest => ({
      ...latest,
      developerModeOn: true
    }))

    // Nothing was written over `Settings.json` before it was filed away: the
    // quarantine copy is written first, the original is deleted, and only
    // then does the caller's own write land.
    const paths = written.map(([path]) => path)
    expect(paths).toHaveLength(2)
    expect(paths[0]).toMatch(/^Settings\.json\.unreadable-\d+$/)
    expect(paths[1]).toBe('Settings.json')
    expect(deleted).toStrictEqual(['Settings.json'])

    // The bytes that could not be read are still on the disklet, verbatim,
    // which is why moving the file aside loses nothing: what no caller could
    // read, no caller could have recovered.
    expect(written[0][1]).toBe('not json at all')
    expect(JSON.parse(written[1][1]).developerModeOn).toBe(true)
  })

  it('still refuses when the file cannot be moved aside either', async () => {
    // A disklet that cannot be written to at all. There is no writable file
    // to recover to, and the caller's own write would fail next anyway, so
    // this is the one case that still reaches the user as an error.
    const account = makeFakeDiskletAccount({
      local: 'not json at all',
      writeError: new Error('disk is full')
    })
    await getLocalAccountSettings(account)
    await expect(
      updateLocalAccountSettings(account, latest => ({
        ...latest,
        developerModeOn: true
      }))
    ).rejects.toThrow(/could not be read or written/)
  })

  it('does not move a file aside for a failure that heals on retry', async () => {
    // Two attempts before anything is filed away. One failure does not mean
    // the file is broken — an interrupted write may have completed in the
    // meantime — and quarantining a `Settings.json` that reads perfectly
    // well on the second attempt would be the same data loss by a third
    // door.
    const written: string[] = []
    const texts: string[] = []
    const deleted: string[] = []
    let reads = 0
    const account = makeFakeDiskletAccount({
      local: '{"developerModeOn":false,"spamFilterOn":false}',
      get localError() {
        return ++reads <= 2 ? corrupt() : undefined
      },
      onLocalWrite: (path, text) => {
        written.push(path)
        texts.push(text)
      },
      onLocalDelete: path => {
        deleted.push(path)
      }
    })

    // Reads 1 and 2: the login's lenient read, and the first of the write
    // path's two attempts. Read 3 succeeds, so no file is moved.
    await getLocalAccountSettings(account)
    await updateLocalAccountSettings(account, latest => ({
      ...latest,
      developerModeOn: true
    }))
    expect(deleted).toStrictEqual([])
    expect(written).toStrictEqual(['Settings.json'])
    expect(reads).toBe(3)
    // And the stored value survived, which is the point of not overwriting:
    // the lenient read failed, so the cache held the defaults (spam filter
    // *on*), and the write landed on the file instead (spam filter off).
    expect(JSON.parse(texts[0]).spamFilterOn).toBe(false)
    expect(JSON.parse(texts[0]).developerModeOn).toBe(true)
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
    await getLocalAccountSettings(account)
    await updateLocalAccountSettings(account, latest => ({
      ...latest,
      developerModeOn: true
    }))
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
    await getLocalAccountSettings(account)
    await updateLocalAccountSettings(account, latest => latest)
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
    // fail: each of these cleaned to all twelve defaults, reported
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
    // twelve defaults, which is the case above.
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
