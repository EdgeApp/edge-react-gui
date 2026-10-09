import { describe, expect, it, jest } from '@jest/globals'

import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'
import {
  readLocalAccountSettingsForWrite,
  readLocalAccountSettingsFromDisk,
  readLocalAccountSettingsOrDefaults,
  writeLocalAccountSettingsToDisk
} from '../../util/localAccountSettings'

/**
 * A file that is there and cannot be read.
 *
 * `account.localDisklet` is core's `encryptDisklet`, whose `getText` runs
 * `JSON.parse` then `asEdgeBox` then `decryptText` — so an interrupted write
 * surfaces as a parse or cleaner error, which is neither spelling
 * `isMissingFile` knows.
 */
const corrupt = (): Error => new SyntaxError('Unexpected end of JSON input')

describe('readLocalAccountSettingsFromDisk', () => {
  it('yields defaults for an absent file', async () => {
    const settings = await readLocalAccountSettingsFromDisk(
      makeFakeDiskletAccount({})
    )
    expect(settings.spamFilterOn).toBe(true)
  })

  it('yields defaults for a file this version cannot read', async () => {
    const settings = await readLocalAccountSettingsFromDisk(
      makeFakeDiskletAccount({ local: '{"spamFilterOn":"not a boolean"}' })
    )
    expect(settings.spamFilterOn).toBe(true)
  })

  it('throws when a file that is there cannot be read', async () => {
    // Deliberate, and the reason the lenient wrapper exists: a
    // read-modify-write caller answering this with defaults and writing them
    // back is how `spendingLimits` is destroyed.
    await expect(
      readLocalAccountSettingsFromDisk(
        makeFakeDiskletAccount({ localError: corrupt() })
      )
    ).rejects.toThrow(/Unexpected end of JSON/)
  })
})

describe('readLocalAccountSettingsOrDefaults', () => {
  it('trusts a read that succeeded', async () => {
    const account = makeFakeDiskletAccount({
      local: '{"spamFilterOn":false}'
    })
    const { settings, trusted } = await readLocalAccountSettingsOrDefaults(
      account
    )
    expect(settings.spamFilterOn).toBe(false)
    expect(trusted).toBe(true)
  })

  it('trusts an absent file, which is a real answer', async () => {
    const { settings, trusted } = await readLocalAccountSettingsOrDefaults(
      makeFakeDiskletAccount({})
    )
    expect(settings.spamFilterOn).toBe(true)
    expect(trusted).toBe(true)
  })

  it('answers defaults untrusted when the file cannot be read', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { settings, trusted } = await readLocalAccountSettingsOrDefaults(
        makeFakeDiskletAccount({ localError: corrupt() })
      )
      // Untrusted, so the GUI's cached reader records `settingsTrust` as
      // `'untrusted'` (`LocalSettingsActions.ts`) and a later write reads the
      // file strictly again instead of persisting these over it.
      expect(settings.spamFilterOn).toBe(true)
      expect(trusted).toBe(false)
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('using defaults')
      )
    } finally {
      warn.mockRestore()
    }
  })
})

/**
 * The write path's reader, and the one-way door it exists to open.
 *
 * Refusing the write for an unreadable `Settings.json` is right — the base
 * of a read-modify-write would otherwise be the 12 defaults, and writing it
 * back loses the user's `spendingLimits` among them. On its own it is also
 * permanent: the file does not repair itself, so every later write fails
 * identically, and no caller can move it by hand because it lives on
 * `account.localDisklet` inside core's `encryptDisklet`.
 */
describe('readLocalAccountSettingsForWrite', () => {
  it('reads the file when it can, moving nothing', async () => {
    const deleted: string[] = []
    const account = makeFakeDiskletAccount({
      local: '{"developerModeOn":true}',
      onLocalDelete: path => {
        deleted.push(path)
      }
    })
    const { settings, recovery } = await readLocalAccountSettingsForWrite(
      account
    )
    expect(settings.developerModeOn).toBe(true)
    expect(recovery).toBeUndefined()
    expect(deleted).toStrictEqual([])
  })

  it('treats an absent file as the defaults, with nothing to move', async () => {
    const deleted: string[] = []
    const account = makeFakeDiskletAccount({
      onLocalDelete: path => {
        deleted.push(path)
      }
    })
    const { settings, recovery } = await readLocalAccountSettingsForWrite(
      account
    )
    expect(settings.spamFilterOn).toBe(true)
    expect(recovery).toBeUndefined()
    expect(deleted).toStrictEqual([])
  })

  it('preserves the bytes of a file it could read but not parse', async () => {
    const written: Array<[string, string]> = []
    const account = makeFakeDiskletAccount({
      local: '{"spamFilterOn":',
      onLocalWrite: (path, text) => {
        written.push([path, text])
      }
    })
    const { settings, recovery } = await readLocalAccountSettingsForWrite(
      account
    )
    if (recovery?.kind !== 'moved') throw new Error('expected a move')
    expect(recovery.to).toMatch(/^Settings\.json\.unreadable-\d+$/)
    expect(written).toStrictEqual([[recovery.to, '{"spamFilterOn":']])
    // The defaults, which are now the honest answer: the old file is filed
    // away under a name support can ask for, not overwritten.
    expect(settings.spamFilterOn).toBe(true)
  })

  it('reports a deletion when the file could not even be decrypted', async () => {
    // `getText` is what failed, on the content, so there is no plaintext to
    // preserve: the original is removed, and the answer says so rather than
    // looking like an ordinary write.
    const written: string[] = []
    const deleted: string[] = []
    const account = makeFakeDiskletAccount({
      localError: corrupt(),
      onLocalWrite: path => {
        written.push(path)
      },
      onLocalDelete: path => {
        deleted.push(path)
      }
    })
    const { recovery } = await readLocalAccountSettingsForWrite(account)
    expect(recovery).toStrictEqual({
      kind: 'deleted',
      reason: 'Unexpected end of JSON input'
    })
    expect(written).toStrictEqual([])
    expect(deleted).toStrictEqual(['Settings.json'])
  })

  it('leaves the file alone for an error the native bridge sent with no code', async () => {
    // React Native disklets cross the bridge as `new Error(message)` with no
    // `code`, so "has a system code" could not tell I/O from content there,
    // and a permission failure on an intact file reached the delete.
    const deleted: string[] = []
    const failure = new Error('The file couldn’t be opened.')
    const account = makeFakeDiskletAccount({
      localError: failure,
      onLocalDelete: path => {
        deleted.push(path)
      }
    })
    await expect(readLocalAccountSettingsForWrite(account)).rejects.toBe(
      failure
    )
    expect(deleted).toStrictEqual([])
  })

  it('takes the file as the base when the recovery read parses', async () => {
    // Two content failures, then a read that is clean: an interrupted write
    // that has since finished. Nothing moves, and the fields survive.
    let reads = 0
    const written: string[] = []
    const deleted: string[] = []
    const account = makeFakeDiskletAccount({
      local: '{"developerModeOn":true,"spamFilterOn":false}',
      get localError() {
        return ++reads <= 2 ? corrupt() : undefined
      },
      onLocalWrite: path => {
        written.push(path)
      },
      onLocalDelete: path => {
        deleted.push(path)
      }
    })
    const { settings, recovery } = await readLocalAccountSettingsForWrite(
      account
    )
    expect(recovery).toBeUndefined()
    expect(settings.developerModeOn).toBe(true)
    expect(settings.spamFilterOn).toBe(false)
    expect(written).toStrictEqual([])
    expect(deleted).toStrictEqual([])
  })

  it('leaves the file alone when the failure is the I/O, not the content', async () => {
    // An `EACCES` on a root-owned file, or `EMFILE` in a long-lived daemon,
    // says nothing about the bytes. Deleting would destroy settings that
    // are intact, so the real error reaches the caller instead.
    const deleted: string[] = []
    const ioError = Object.assign(new Error('EACCES: permission denied'), {
      code: 'EACCES'
    })
    const account = makeFakeDiskletAccount({
      localError: ioError,
      onLocalDelete: path => {
        deleted.push(path)
      }
    })
    await expect(readLocalAccountSettingsForWrite(account)).rejects.toBe(
      ioError
    )
    expect(deleted).toStrictEqual([])
  })
})

/**
 * The write side ran on a cleaner that cannot fail.
 *
 * `uncleaner()` only sets a global flag and calls the cleaner, so
 * un-cleaning through `asLocalAccountSettings` — which is
 * `asMaybe(inner, () => inner({}))` — ran `asMaybe`'s `try/catch` in
 * un-cleaning mode: a settings object the published shape rejects was not
 * reported, it was replaced by the twelve defaults and stringified over
 * the user's `spendingLimits`. The read side was corrected in iteration 1
 * for the same reason; this is the same destruction by the other door.
 */
describe('writeLocalAccountSettingsToDisk', () => {
  it('writes what it was given', async () => {
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      onLocalWrite: (_path, text) => {
        written.push(text)
      }
    })
    const settings = await readLocalAccountSettingsFromDisk(
      makeFakeDiskletAccount({ local: '{"developerModeOn":true}' })
    )
    await writeLocalAccountSettingsToDisk(account, settings)
    expect(JSON.parse(written[0]).developerModeOn).toBe(true)
  })

  it('fails rather than writing the defaults for a value that is not settings', async () => {
    // What the file-level `asMaybe` did on the write side: `uncleaner()`
    // only sets a global flag and calls the cleaner, so un-cleaning through
    // `asMaybe(inner, () => inner({}))` ran its `try/catch` in un-cleaning
    // mode — each of these was *replaced* by the twelve defaults and
    // stringified over `spendingLimits`, `passwordReminder`, `notifState`,
    // `reviewTrigger`, `developerModeOn`, `isAccountBalanceVisible` and
    // `tokenWarningsShown`. `[]` among them, because `asObject` accepts an
    // array, which is why the guard is here as well as on the read.
    //
    // The per-field tolerance inside the shape stays: one field this
    // version cannot express still costs that field, which is what the
    // read side's docblock says it is for.
    for (const broken of [null, undefined, 'x', 42, []]) {
      const written: string[] = []
      const account = makeFakeDiskletAccount({
        onLocalWrite: (_path, text) => {
          written.push(text)
        }
      })
      await expect(
        writeLocalAccountSettingsToDisk(account, broken as any)
      ).rejects.toThrow()
      expect(written).toStrictEqual([])
    }
  })
})

describe('a field this version does not declare', () => {
  it('survives a read-modify-write', async () => {
    // A CLI and a GUI built at different versions share this file, and the
    // CLI is published on its own now. The plain `asObject` dropped every
    // key it did not declare on the first write.
    const written: string[] = []
    const account = makeFakeDiskletAccount({
      local: '{"spamFilterOn":true,"addedByANewerGui":{"seen":3}}',
      onLocalWrite: (_path, text) => {
        written.push(text)
      }
    })
    const settings = await readLocalAccountSettingsFromDisk(account)
    await writeLocalAccountSettingsToDisk(account, {
      ...settings,
      spamFilterOn: false
    })
    const stored = JSON.parse(written[0])
    expect(stored.spamFilterOn).toBe(false)
    expect(stored.addedByANewerGui).toStrictEqual({ seen: 3 })
  })
})
