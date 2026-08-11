import { describe, expect, it } from '@jest/globals'

import type { FiatPaymentType } from '../../../../plugins/gui/fiatPluginTypes'
import type { RampQuote } from '../../../../plugins/ramps/rampPluginTypes'
import {
  compareRampQuotes,
  getBestRateRampQuote,
  getUnmatchedRampQuotePriority
} from '../../../../plugins/ramps/utils/rampQuotePriority'

interface FakeQuoteParams {
  pluginId: string
  paymentType: FiatPaymentType
  /** Fiat paid (buy) or received (sell) for one unit of crypto. */
  rate?: string
  cryptoAmount?: string
}

const makeQuote = ({
  pluginId,
  paymentType,
  rate = '100',
  cryptoAmount = '1'
}: FakeQuoteParams): RampQuote =>
  ({
    pluginId,
    paymentType,
    partnerIcon: '',
    pluginDisplayName: pluginId,
    displayCurrencyCode: 'BTC',
    cryptoAmount,
    isEstimate: false,
    fiatCurrencyCode: 'iso:USD',
    fiatAmount: String(Number(rate) * Number(cryptoAmount)),
    direction: 'buy',
    regionCode: { countryCode: 'US' },
    settlementRange: {
      min: { value: 0, unit: 'minutes' },
      max: { value: 10, unit: 'minutes' }
    }
  } as unknown as RampQuote)

const idsOf = (quotes: RampQuote[]): string[] =>
  quotes.map(quote => `${quote.pluginId}:${quote.paymentType}`)

describe('compareRampQuotes', () => {
  const banxaCredit = makeQuote({
    pluginId: 'banxa',
    paymentType: 'credit',
    rate: '100'
  })
  const moonpayCredit = makeQuote({
    pluginId: 'moonpay',
    paymentType: 'credit',
    rate: '110'
  })
  const moonpayVenmo = makeQuote({
    pluginId: 'moonpay',
    paymentType: 'venmo',
    rate: '120'
  })

  it('sorts by best rate when there is no priority', () => {
    const quotes = [moonpayVenmo, moonpayCredit, banxaCredit]
    expect(idsOf([...quotes].sort(compareRampQuotes('buy')))).toEqual([
      'banxa:credit',
      'moonpay:credit',
      'moonpay:venmo'
    ])
  })

  it('inverts the rate comparison for a sell', () => {
    const quotes = [banxaCredit, moonpayVenmo]
    expect(idsOf([...quotes].sort(compareRampQuotes('sell')))).toEqual([
      'moonpay:venmo',
      'banxa:credit'
    ])
  })

  it('floats a preferred provider above a better rate', () => {
    const quotes = [banxaCredit, moonpayCredit, moonpayVenmo]
    const sorted = [...quotes].sort(
      compareRampQuotes('buy', { preferPluginIds: ['moonpay'] })
    )
    expect(idsOf(sorted)).toEqual([
      'moonpay:credit',
      'moonpay:venmo',
      'banxa:credit'
    ])
  })

  it('ranks the preferred payment type above the preferred provider', () => {
    const quotes = [banxaCredit, moonpayCredit, moonpayVenmo]
    const sorted = [...quotes].sort(
      compareRampQuotes('buy', {
        preferPluginIds: ['moonpay'],
        preferPaymentType: 'venmo'
      })
    )
    expect(idsOf(sorted)).toEqual([
      'moonpay:venmo',
      'moonpay:credit',
      'banxa:credit'
    ])
  })

  it('honors the order of the preferred provider list', () => {
    const quotes = [banxaCredit, moonpayCredit]
    const sorted = [...quotes].sort(
      compareRampQuotes('buy', { preferPluginIds: ['banxa', 'moonpay'] })
    )
    expect(idsOf(sorted)).toEqual(['banxa:credit', 'moonpay:credit'])
  })

  it('leaves the ordering unchanged when the pin matches nothing', () => {
    const quotes = [moonpayVenmo, moonpayCredit, banxaCredit]
    const sorted = [...quotes].sort(
      compareRampQuotes('buy', {
        preferPluginIds: ['nosuchprovider'],
        preferPaymentType: 'cashapp'
      })
    )
    expect(idsOf(sorted)).toEqual([
      'banxa:credit',
      'moonpay:credit',
      'moonpay:venmo'
    ])
  })

  it('demotes quotes without amounts below quotes that have them', () => {
    const emptyQuote = makeQuote({
      pluginId: 'paybis',
      paymentType: 'credit',
      rate: '0',
      cryptoAmount: '0'
    })
    const sorted = [emptyQuote, banxaCredit].sort(compareRampQuotes('buy'))
    expect(idsOf(sorted)).toEqual(['banxa:credit', 'paybis:credit'])
  })

  it('floats a preferred provider above priced quotes even without amounts', () => {
    // External ramp plugins always quote '0' with a message instead of a rate.
    // A preference is an intentional promotion, so it wins anyway: the
    // placeholder card surfaces on top rather than sinking out of sight.
    const externalLibertyx = makeQuote({
      pluginId: 'libertyx',
      paymentType: 'credit',
      rate: '0',
      cryptoAmount: '0'
    })
    const sorted = [banxaCredit, moonpayCredit, externalLibertyx].sort(
      compareRampQuotes('buy', { preferPluginIds: ['libertyx'] })
    )
    expect(idsOf(sorted)).toEqual([
      'libertyx:credit',
      'banxa:credit',
      'moonpay:credit'
    ])
  })

  it('floats a preferred payment type above priced quotes even without amounts', () => {
    const externalVenmo = makeQuote({
      pluginId: 'libertyx',
      paymentType: 'venmo',
      rate: '0',
      cryptoAmount: '0'
    })
    const sorted = [banxaCredit, externalVenmo].sort(
      compareRampQuotes('buy', { preferPaymentType: 'venmo' })
    )
    expect(idsOf(sorted)).toEqual(['libertyx:venmo', 'banxa:credit'])
  })

  it('still demotes unpreferred quotes without amounts when a priority is set', () => {
    const externalLibertyx = makeQuote({
      pluginId: 'libertyx',
      paymentType: 'credit',
      rate: '0',
      cryptoAmount: '0'
    })
    const sorted = [externalLibertyx, banxaCredit, moonpayCredit].sort(
      compareRampQuotes('buy', { preferPluginIds: ['moonpay'] })
    )
    expect(idsOf(sorted)).toEqual([
      'moonpay:credit',
      'banxa:credit',
      'libertyx:credit'
    ])
  })
})

describe('getBestRateRampQuote', () => {
  const banxaCredit = makeQuote({
    pluginId: 'banxa',
    paymentType: 'credit',
    rate: '100'
  })
  const moonpayVenmo = makeQuote({
    pluginId: 'moonpay',
    paymentType: 'venmo',
    rate: '120'
  })

  it('returns undefined for an empty list', () => {
    expect(getBestRateRampQuote([], 'buy')).toBeUndefined()
  })

  it('picks the cheapest quote for a buy regardless of list order', () => {
    expect(getBestRateRampQuote([moonpayVenmo, banxaCredit], 'buy')).toBe(
      banxaCredit
    )
  })

  it('picks the highest-paying quote for a sell', () => {
    expect(getBestRateRampQuote([banxaCredit, moonpayVenmo], 'sell')).toBe(
      moonpayVenmo
    )
  })

  it('does not reorder the array it is given', () => {
    const quotes = [moonpayVenmo, banxaCredit]
    getBestRateRampQuote(quotes, 'buy')
    expect(idsOf(quotes)).toEqual(['moonpay:venmo', 'banxa:credit'])
  })
})

describe('getUnmatchedRampQuotePriority', () => {
  const quotes = [makeQuote({ pluginId: 'banxa', paymentType: 'credit' })]

  it('reports nothing when there is no priority', () => {
    expect(getUnmatchedRampQuotePriority(quotes)).toEqual([])
  })

  it('reports nothing when every preference matched', () => {
    expect(
      getUnmatchedRampQuotePriority(quotes, {
        preferPluginIds: ['banxa'],
        preferPaymentType: 'credit'
      })
    ).toEqual([])
  })

  it('reports each preference that matched no quote', () => {
    expect(
      getUnmatchedRampQuotePriority(quotes, {
        preferPluginIds: ['moonpay'],
        preferPaymentType: 'cashapp'
      })
    ).toEqual([`provider 'moonpay'`, `payment type 'cashapp'`])
  })
})
