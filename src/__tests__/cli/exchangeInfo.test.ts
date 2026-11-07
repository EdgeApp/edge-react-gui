import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { makeRollupExchangeInfo } from '../../cli/engine/exchangeInfo'
import { fetchPublicRollup, infoServerData } from '../../util/network'

jest.mock('../../util/network', () => ({
  infoServerData: {},
  fetchPublicRollup: jest.fn()
}))

const mockFetchPublicRollup = jest.mocked(fetchPublicRollup)

/** A rollup arriving, as `fetchPublicRollup` stores one. */
const arrives = (exchangeInfo: unknown) => async (): Promise<void> => {
  infoServerData.rollupRaw = { exchangeInfo }
}

/**
 * The engine's source for `fetch-swap-quotes`' `exchangeInfo`.
 *
 * It is Edge's remote switch for swaps, so a quote has to see a change the
 * info server makes as soon as the app would: the app fetches the rollup
 * every five minutes.
 */
describe('makeRollupExchangeInfo', () => {
  beforeEach(() => {
    delete infoServerData.rollupRaw
    mockFetchPublicRollup.mockReset()
  })

  it('reads the rollup, and the same one until it is five minutes old', async () => {
    mockFetchPublicRollup.mockImplementation(
      arrives({ swap: { disablePlugins: { changehero: true } } })
    )
    const read = makeRollupExchangeInfo({ warn: () => {} })

    expect((await read()).swap.disablePlugins).toStrictEqual({
      changehero: true
    })
    await read()
    expect(mockFetchPublicRollup).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(5 * 60 * 1000)
    mockFetchPublicRollup.mockImplementation(
      arrives({ swap: { disablePlugins: { godex: true } } })
    )
    expect((await read()).swap.disablePlugins).toStrictEqual({ godex: true })
    expect(mockFetchPublicRollup).toHaveBeenCalledTimes(2)
  })

  it('keeps the last one read when a fetch brings nothing, and tries again', async () => {
    mockFetchPublicRollup.mockImplementation(
      arrives({ swap: { disablePlugins: { changehero: true } } })
    )
    const read = makeRollupExchangeInfo({ warn: () => {} })
    await read()

    jest.advanceTimersByTime(5 * 60 * 1000)
    mockFetchPublicRollup.mockImplementation(async () => {})
    expect((await read()).swap.disablePlugins).toStrictEqual({
      changehero: true
    })
    await read()
    expect(mockFetchPublicRollup).toHaveBeenCalledTimes(3)
  })

  it('answers the defaults before any rollup arrives', async () => {
    mockFetchPublicRollup.mockImplementation(async () => {})
    const read = makeRollupExchangeInfo({ warn: () => {} })
    const info = await read()
    expect(info.swap.disablePlugins).toStrictEqual({})
    expect(info.swap.disableAssets).toStrictEqual({
      source: [],
      destination: []
    })
  })

  it('warns, and keeps the last one read, when exchangeInfo is unreadable', async () => {
    const warnings: string[] = []
    const read = makeRollupExchangeInfo({
      warn: message => {
        warnings.push(message)
      }
    })
    mockFetchPublicRollup.mockImplementation(
      arrives({ swap: { disablePlugins: { changehero: true } } })
    )
    await read()

    jest.advanceTimersByTime(5 * 60 * 1000)
    mockFetchPublicRollup.mockImplementation(arrives('not an object'))
    expect((await read()).swap.disablePlugins).toStrictEqual({
      changehero: true
    })
    expect(warnings).toHaveLength(1)
  })
})
