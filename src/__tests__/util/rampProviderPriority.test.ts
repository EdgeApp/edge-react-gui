import { describe, expect, it } from '@jest/globals'
import type { RampProviderPriority } from 'edge-info-server'

import {
  getRampPreferredProviders,
  getRampPriorityPromoIds
} from '../../util/rampProviderPriority'

const CURRENT_DATE = new Date('2026-06-01T00:00:00.000Z')

const priority: RampProviderPriority = {
  installPromo: { buy: ['moonpay'], sell: ['banxa'] },
  linkPromo: { buy: ['paybis'] },
  usOnlyPromo: { buy: ['simplex'], countryCodes: ['US'] },
  notUsPromo: { buy: ['bity'], excludeCountryCodes: ['US'] },
  expiredPromo: { buy: ['expired'], endIsoDate: '2026-01-01T00:00:00.000Z' },
  futurePromo: { buy: ['future'], startIsoDate: '2027-01-01T00:00:00.000Z' },
  windowPromo: {
    buy: ['window'],
    startIsoDate: '2026-01-01T00:00:00.000Z',
    endIsoDate: '2027-01-01T00:00:00.000Z'
  },
  badDatePromo: { buy: ['badDate'], endIsoDate: 'not a date' }
}

const query = (
  props: Partial<Parameters<typeof getRampPreferredProviders>[0]> = {}
): string[] =>
  getRampPreferredProviders({
    activePromotions: [],
    currentDate: CURRENT_DATE,
    direction: 'buy',
    priority,
    ...props
  })

describe('getRampPreferredProviders', () => {
  it('returns nothing when the document is missing', () => {
    expect(query({ installerId: 'installPromo', priority: undefined })).toEqual(
      []
    )
  })

  it('returns nothing for an unaffiliated account', () => {
    expect(query()).toEqual([])
  })

  it('matches the installer id', () => {
    expect(query({ installerId: 'installPromo' })).toEqual(['moonpay'])
  })

  it('matches an active promotion', () => {
    expect(query({ activePromotions: ['linkPromo'] })).toEqual(['paybis'])
  })

  it('matches an active promotion even when the installer differs', () => {
    // The old promoCards2 path ANDed these two, which excluded a user who
    // picked up the promotion after installing from somewhere else.
    expect(
      query({ activePromotions: ['linkPromo'], installerId: 'somewhereElse' })
    ).toEqual(['paybis'])
  })

  it('splits buy and sell', () => {
    expect(query({ direction: 'sell', installerId: 'installPromo' })).toEqual([
      'banxa'
    ])
    expect(
      query({ direction: 'sell', activePromotions: ['linkPromo'] })
    ).toEqual([])
  })

  it('concatenates every matching entry, deduplicated', () => {
    expect(
      query({
        activePromotions: ['linkPromo', 'windowPromo', 'linkPromo'],
        installerId: 'installPromo'
      })
    ).toEqual(['moonpay', 'paybis', 'window'])
  })

  it('honors an include country list', () => {
    expect(
      query({ activePromotions: ['usOnlyPromo'], countryCode: 'us' })
    ).toEqual(['simplex'])
    expect(
      query({ activePromotions: ['usOnlyPromo'], countryCode: 'GB' })
    ).toEqual([])
  })

  it('honors an exclude country list', () => {
    expect(
      query({ activePromotions: ['notUsPromo'], countryCode: 'GB' })
    ).toEqual(['bity'])
    expect(
      query({ activePromotions: ['notUsPromo'], countryCode: 'US' })
    ).toEqual([])
  })

  it('drops a country-scoped entry when the country is unknown', () => {
    expect(query({ activePromotions: ['usOnlyPromo'] })).toEqual([])
  })

  it('ignores country scoping on an unscoped entry', () => {
    expect(
      query({ activePromotions: ['linkPromo'], countryCode: 'US' })
    ).toEqual(['paybis'])
  })

  it('honors date scoping', () => {
    expect(query({ activePromotions: ['expiredPromo'] })).toEqual([])
    expect(query({ activePromotions: ['futurePromo'] })).toEqual([])
    expect(query({ activePromotions: ['windowPromo'] })).toEqual(['window'])
  })

  it('treats an unparseable date as an unset bound', () => {
    expect(query({ activePromotions: ['badDatePromo'] })).toEqual(['badDate'])
  })
})

describe('getRampPriorityPromoIds', () => {
  it('returns nothing when the document is missing', () => {
    expect(
      getRampPriorityPromoIds({
        activePromotions: ['linkPromo'],
        currentDate: CURRENT_DATE,
        priority: undefined
      })
    ).toEqual([])
  })

  it('names every entry that applies, in document key order', () => {
    expect(
      getRampPriorityPromoIds({
        activePromotions: ['windowPromo', 'expiredPromo'],
        currentDate: CURRENT_DATE,
        installerId: 'installPromo',
        priority
      })
    ).toEqual(['installPromo', 'windowPromo'])
  })

  it('names a sell-only match, which the buy providers would not show', () => {
    // getActivePromoIds has no direction, so an entry that only configures the
    // other direction still counts as an active promotion.
    expect(
      getRampPriorityPromoIds({
        activePromotions: [],
        currentDate: CURRENT_DATE,
        installerId: 'installPromo',
        priority: { installPromo: { sell: ['banxa'] } }
      })
    ).toEqual(['installPromo'])
  })

  it('tolerates an absent activePromotions list', () => {
    expect(
      getRampPriorityPromoIds({
        currentDate: CURRENT_DATE,
        installerId: 'installPromo',
        priority
      })
    ).toEqual(['installPromo'])
  })
})
