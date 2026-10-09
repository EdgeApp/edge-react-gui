import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import { getHistoricalCryptoRate } from '../../util/exchangeRates'
import {
  makeFakeDenomWallet,
  makeFakeDiskletAccount
} from '../../util/fake/fakeDisklet'
import {
  readDefaultIsoFiat,
  resolveListSpamThreshold
} from '../../util/spamThreshold'

jest.mock('../../util/exchangeRates', () => ({
  getHistoricalCryptoRate: jest.fn()
}))

const rateMock = getHistoricalCryptoRate as unknown as jest.Mock<
  (
    pluginId: string,
    tokenId: unknown,
    isoFiat: string,
    date: string
  ) => Promise<number>
>

const wallet = makeFakeDenomWallet()

describe('readDefaultIsoFiat', () => {
  it('defaults to iso:USD when Settings.json is missing', async () => {
    expect(await readDefaultIsoFiat(makeFakeDiskletAccount({}))).toBe('iso:USD')
  })

  it('throws when Settings.json is there and cannot be read', async () => {
    // This function's own docblock: "a `Settings.json` that is *there* and
    // cannot be read is not answered the way an absent one is", because the
    // value labels and prices a whole `get-transactions` response and every
    // CSV, QBO and Bitwave file written from it. The strict reader swallowed
    // a parse failure into the defaults, so the promise did not hold and a
    // truncated file priced the lot in `iso:USD` while reporting USD back as
    // the account's own default.
    const account = makeFakeDiskletAccount({ synced: '{not json' })
    await expect(readDefaultIsoFiat(account)).rejects.toThrow()
  })

  it('defaults to iso:USD when defaultIsoFiat is empty', async () => {
    const account = makeFakeDiskletAccount({ synced: '{"defaultIsoFiat":""}' })
    expect(await readDefaultIsoFiat(account)).toBe('iso:USD')
  })

  it('returns the stored fiat', async () => {
    const account = makeFakeDiskletAccount({
      synced: '{"defaultIsoFiat":"iso:EUR"}'
    })
    expect(await readDefaultIsoFiat(account)).toBe('iso:EUR')
  })
})

describe('resolveListSpamThreshold', () => {
  beforeEach(() => {
    rateMock.mockReset()
    rateMock.mockResolvedValue(50000)
  })

  it('treats an empty override as "show everything"', async () => {
    const threshold = await resolveListSpamThreshold({
      account: makeFakeDiskletAccount({}),
      wallet,
      tokenId: null,
      queryOverride: ''
    })
    expect(threshold).toBe('0')
    expect(rateMock).not.toHaveBeenCalled()
  })

  it('passes an explicit override straight through', async () => {
    const threshold = await resolveListSpamThreshold({
      account: makeFakeDiskletAccount({}),
      wallet,
      tokenId: null,
      queryOverride: '500'
    })
    expect(threshold).toBe('500')
  })

  it('returns undefined when the spam filter is off', async () => {
    const account = makeFakeDiskletAccount({ local: '{"spamFilterOn":false}' })
    const threshold = await resolveListSpamThreshold({
      account,
      wallet,
      tokenId: null
    })
    expect(threshold).toBeUndefined()
    expect(rateMock).not.toHaveBeenCalled()
  })

  it('does not filter when Settings.json cannot be read, and says so', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      // Present and unreadable, which `isMissingFile` cannot match. This used
      // to propagate out of every `get-transactions` on the default path;
      // then it answered the lenient reader's defaults, where
      // `spamFilterOn` is `true` — so the floor was applied to an account
      // that had turned the filter off, dropping rows from a listing and
      // from an export the route documents as unfiltered.
      const account = makeFakeDiskletAccount({
        localError: new SyntaxError('Unexpected end of JSON input')
      })
      const warnings: string[] = []
      const threshold = await resolveListSpamThreshold({
        account,
        wallet,
        tokenId: null,
        onWarn: message => warnings.push(message)
      })
      expect(threshold).toBeUndefined()
      // And it does not price anything either: no threshold means no rate.
      expect(rateMock).not.toHaveBeenCalled()
      expect(warnings).toHaveLength(1)
      expect(warnings[0]).toContain('Settings.json')
      expect(warnings[0]).toContain('spam filter')
    } finally {
      warn.mockRestore()
    }
  })

  it('filters by default when no local settings exist', async () => {
    const threshold = await resolveListSpamThreshold({
      account: makeFakeDiskletAccount({}),
      wallet,
      tokenId: null
    })
    expect(threshold).not.toBeUndefined()
    expect(rateMock).toHaveBeenCalledTimes(1)
  })

  it('quantises the rate lookup to the hour, so repeat calls hit the cache', async () => {
    await resolveListSpamThreshold({
      account: makeFakeDiskletAccount({}),
      wallet,
      tokenId: null
    })

    const date = rateMock.mock.calls[0][3]
    expect(date).toMatch(/T\d{2}:00:00\.000Z$/)
    expect(new Date(date).getTime() % (60 * 60 * 1000)).toBe(0)
  })

  it('does not filter when the rate lookup fails', async () => {
    rateMock.mockRejectedValue(new Error('rates server down'))
    const threshold = await resolveListSpamThreshold({
      account: makeFakeDiskletAccount({}),
      wallet,
      tokenId: null
    })
    expect(threshold).toBe('0')
  })

  it('does not filter when the rate is not finite', async () => {
    rateMock.mockResolvedValue(Number.NaN)
    const threshold = await resolveListSpamThreshold({
      account: makeFakeDiskletAccount({}),
      wallet,
      tokenId: null
    })
    expect(threshold).toBe('0')
  })

  it('uses the account default fiat for the rate', async () => {
    const account = makeFakeDiskletAccount({
      synced: '{"defaultIsoFiat":"iso:EUR"}'
    })
    await resolveListSpamThreshold({ account, wallet, tokenId: null })
    expect(rateMock.mock.calls[0][2]).toBe('iso:EUR')
  })

  it('uses the caller-supplied fiat instead of reading Settings.json again', async () => {
    let syncedReads = 0
    const account = {
      disklet: {
        getText: async () => {
          syncedReads++
          return '{"defaultIsoFiat":"iso:EUR"}'
        }
      },
      localDisklet: { getText: async () => '{"spamFilterOn":true}' }
    } as unknown as EdgeAccount
    rateMock.mockResolvedValue(30000)

    await resolveListSpamThreshold({
      account,
      wallet,
      tokenId: null,
      isoFiat: 'iso:USD'
    })

    // The handler has already resolved it, and `readSyncedSettings` — which
    // is what reads the *synced* Settings.json this counter is counting —
    // deliberately has no process-wide cache to absorb a repeat read.
    expect(syncedReads).toBe(0)
    expect(rateMock).toHaveBeenCalledWith(
      'bitcoin',
      null,
      'iso:USD',
      expect.any(String)
    )
  })
})
