import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { checkNotifications } from 'react-native-permissions'

import type { Action } from '../../types/reduxActions'
import type { LinkPromo } from '../../types/types'
import { fetchReferral } from '../../util/network'
import { logEvent } from '../../util/tracking'

jest.mock('../../experimentConfig', () => ({
  getExperimentConfig: async () => ({})
}))
jest.mock('../../actions/FirstOpenActions', () => ({
  getFirstOpenInfo: async () => ({
    isFirstOpen: 'false',
    deviceId: 'device',
    firstOpenEpoch: 0
  })
}))
jest.mock('../../util/network', () => ({
  fetchReferral: jest.fn(async () => ({ ok: true }))
}))

const mockFetchReferral = fetchReferral as jest.MockedFunction<
  typeof fetchReferral
>
const mockCheckNotifications = checkNotifications as jest.MockedFunction<
  typeof checkNotifications
>

/** A store holding just the state `logEvent` reads. */
function makeStore(linkPromo: LinkPromo | null): {
  dispatched: Action[]
  state: { linkPromo: LinkPromo | null }
  run: (event: Parameters<typeof logEvent>[0]) => void
} {
  const dispatched: Action[] = []
  const state = {
    linkPromo,
    exchangeRates: {},
    deviceReferral: { installerId: undefined, currencyCodes: undefined },
    account: {
      accountReferral: {
        activePromotions: ['account-promo'],
        installerId: undefined,
        creationDate: undefined,
        currencyCodes: undefined,
        accountAppleAdsAttribution: undefined
      }
    },
    core: { account: { created: undefined } }
  }
  const dispatch = (action: Action): Action => {
    dispatched.push(action)
    return action
  }
  return {
    dispatched,
    state,
    run: event => {
      logEvent(event)(dispatch as any, (() => state) as any)
    }
  }
}

/**
 * Let pending promise work run. The suite runs under fake timers (jestSetup),
 * so this yields to microtasks rather than scheduling a timeout.
 */
async function flush(rounds = 50): Promise<void> {
  for (let i = 0; i < rounds; i++) await Promise.resolve()
}

/** The event body `logEvent` posted to the util server, once it has. */
async function sentBody(): Promise<{ event: string; promoIds: string[] }> {
  await flush()
  expect(mockFetchReferral).toHaveBeenCalledTimes(1)
  const [, init] = mockFetchReferral.mock.calls[0]
  const body = init?.body
  if (typeof body !== 'string') throw new Error('expected a string body')
  return JSON.parse(body)
}

const bobOnBuy: LinkPromo = { promoId: 'bob', tab: 'buyTab' }

describe('logEvent link promo', () => {
  beforeEach(() => {
    mockFetchReferral.mockClear()
  })

  it('credits the link promo instead of the account promotions', async () => {
    const store = makeStore(bobOnBuy)
    store.run('Buy_Quote')

    expect((await sentBody()).promoIds).toEqual(['bob'])
  })

  it('falls back to the account promotions with no link promo', async () => {
    const store = makeStore(null)
    store.run('Buy_Quote')

    expect((await sentBody()).promoIds).toEqual(['account-promo'])
  })

  it('keeps the promo through a non-conversion event', async () => {
    const store = makeStore(bobOnBuy)
    store.run('Buy_Quote')
    await sentBody()

    expect(store.dispatched).toEqual([])
  })

  it('retires the promo once a conversion is logged', async () => {
    const store = makeStore(bobOnBuy)
    store.run('Buy_Success')
    await sentBody()

    expect(store.dispatched).toEqual([
      { type: 'LINK_PROMO/SET', data: { linkPromo: null } }
    ])
  })

  it('credits a conversion whose tab was left before the event was built', async () => {
    // Leaving the flow's tab releases the promo. The event was dispatched while
    // it was held, so the conversion still carries it.
    const store = makeStore(bobOnBuy)
    store.run('Exchange_Shift_Success')
    store.state.linkPromo = null

    expect((await sentBody()).promoIds).toEqual(['bob'])
    expect(store.dispatched).toEqual([])
  })

  it('leaves a newer link for the same campaign alone', async () => {
    // A second link reusing the campaign id is a separate entry into the flow,
    // even with the same id and tab, so the earlier conversion must not retire it.
    let finishCheck: () => void = () => {}
    mockCheckNotifications.mockImplementationOnce(
      async () =>
        await new Promise(resolve => {
          finishCheck = () => {
            resolve({ status: 'granted', settings: {} })
          }
        })
    )
    const store = makeStore(bobOnBuy)
    store.run('Buy_Success')

    await flush()
    store.state.linkPromo = { promoId: 'bob', tab: 'buyTab' }
    finishCheck()

    expect((await sentBody()).promoIds).toEqual(['bob'])
    expect(store.dispatched).toEqual([])
  })

  it('leaves a promo a newer link set while the event was being built', async () => {
    // `checkNotifications` is awaited between the read and the retirement, so
    // a link that lands during that await must keep its own attribution.
    let finishCheck: () => void = () => {}
    mockCheckNotifications.mockImplementationOnce(
      async () =>
        await new Promise(resolve => {
          finishCheck = () => {
            resolve({ status: 'granted', settings: {} })
          }
        })
    )
    const store = makeStore(bobOnBuy)
    store.run('Buy_Success')

    await flush()
    store.state.linkPromo = { promoId: 'carol', tab: 'swapTab' }
    finishCheck()

    expect((await sentBody()).promoIds).toEqual(['bob'])
    expect(store.dispatched).toEqual([])
  })
})
