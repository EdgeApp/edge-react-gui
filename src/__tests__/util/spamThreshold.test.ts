import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'

import { getHistoricalCryptoRate } from '../../util/exchangeRates'
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

/** An account whose two disklets return whatever text the test supplies. */
function makeAccount(opts: { synced?: string; local?: string }): EdgeAccount {
  const read = async (text: string | undefined): Promise<string> => {
    if (text == null) throw new Error('File not found')
    return text
  }
  return {
    disklet: { getText: async () => await read(opts.synced) },
    localDisklet: { getText: async () => await read(opts.local) }
  } as unknown as EdgeAccount
}

const wallet = {
  currencyInfo: {
    pluginId: 'bitcoin',
    denominations: [{ name: 'BTC', multiplier: '100000000', symbol: '₿' }]
  },
  currencyConfig: {
    currencyInfo: {
      denominations: [{ name: 'BTC', multiplier: '100000000', symbol: '₿' }]
    },
    allTokens: {}
  }
} as unknown as EdgeCurrencyWallet

describe('readDefaultIsoFiat', () => {
  it('defaults to iso:USD when Settings.json is missing', async () => {
    expect(await readDefaultIsoFiat(makeAccount({}))).toBe('iso:USD')
  })

  it('defaults to iso:USD when Settings.json is not JSON', async () => {
    const account = makeAccount({ synced: '{not json' })
    expect(await readDefaultIsoFiat(account)).toBe('iso:USD')
  })

  it('defaults to iso:USD when defaultIsoFiat is empty', async () => {
    const account = makeAccount({ synced: '{"defaultIsoFiat":""}' })
    expect(await readDefaultIsoFiat(account)).toBe('iso:USD')
  })

  it('returns the stored fiat', async () => {
    const account = makeAccount({ synced: '{"defaultIsoFiat":"iso:EUR"}' })
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
      account: makeAccount({}),
      wallet,
      tokenId: null,
      queryOverride: ''
    })
    expect(threshold).toBe('0')
    expect(rateMock).not.toHaveBeenCalled()
  })

  it('passes an explicit override straight through', async () => {
    const threshold = await resolveListSpamThreshold({
      account: makeAccount({}),
      wallet,
      tokenId: null,
      queryOverride: '500'
    })
    expect(threshold).toBe('500')
  })

  it('returns undefined when the spam filter is off', async () => {
    const account = makeAccount({ local: '{"spamFilterOn":false}' })
    const threshold = await resolveListSpamThreshold({
      account,
      wallet,
      tokenId: null
    })
    expect(threshold).toBeUndefined()
    expect(rateMock).not.toHaveBeenCalled()
  })

  it('filters by default when no local settings exist', async () => {
    const threshold = await resolveListSpamThreshold({
      account: makeAccount({}),
      wallet,
      tokenId: null
    })
    expect(threshold).not.toBeUndefined()
    expect(rateMock).toHaveBeenCalledTimes(1)
  })

  it('quantises the rate lookup to the hour, so repeat calls hit the cache', async () => {
    await resolveListSpamThreshold({
      account: makeAccount({}),
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
      account: makeAccount({}),
      wallet,
      tokenId: null
    })
    expect(threshold).toBe('0')
  })

  it('does not filter when the rate is not finite', async () => {
    rateMock.mockResolvedValue(Number.NaN)
    const threshold = await resolveListSpamThreshold({
      account: makeAccount({}),
      wallet,
      tokenId: null
    })
    expect(threshold).toBe('0')
  })

  it('uses the account default fiat for the rate', async () => {
    const account = makeAccount({ synced: '{"defaultIsoFiat":"iso:EUR"}' })
    await resolveListSpamThreshold({ account, wallet, tokenId: null })
    expect(rateMock.mock.calls[0][2]).toBe('iso:EUR')
  })
})
