import { describe, expect, it, jest } from '@jest/globals'

import { makeFakeDiskletAccount } from '../../util/fake/fakeDisklet'
import {
  readLocalAccountSettingsFromDisk,
  readLocalAccountSettingsOrDefaults
} from '../../util/localAccountSettings'

/**
 * A file that is there and cannot be read.
 *
 * `account.localDisklet` is core's `encryptDisklet`, whose `getText` runs
 * `JSON.parse` then `asEdgeBox` then `decryptText` — so an interrupted write
 * surfaces as a parse or cleaner error, which is not any of the three
 * spellings `isMissingFile` knows.
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
      // Untrusted, so the GUI's cached reader leaves `readSettingsFromDisk`
      // false and a later write cannot persist these over the real file.
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
