import { drupe } from '@edge.app/drupe'

import {
  constraintGenerator,
  type RampConstraintParams,
  validateRampConstraintParams
} from '../../../plugins/ramps/rampConstraints'
import { applyInfoRollupDevOverride } from '../../../util/infoRollupDevOverride'
import { infoServerData } from '../../../util/network'

// Only `infoServerData` is needed from network.ts; mock it so the test does not
// pull in react-native-device-info / appConfig and so we can drive the rollup.
jest.mock('../../../util/network', () => ({ infoServerData: {} }))

// The `rampQuoteFilter` shipped by the production info rollup at the time of
// writing: a `$nor` list that blanket-blocks every Infinite quote (three
// identical `{ rampPluginId: 'infinite' }` clauses), alongside unrelated
// moonpay and paybis rules.
const productionRampQuoteFilter = {
  $nor: [
    { rampPluginId: 'moonpay', direction: 'buy', paymentType: 'ach' },
    { rampPluginId: 'infinite' },
    { rampPluginId: 'infinite' },
    { rampPluginId: 'infinite' },
    { rampPluginId: 'paybis', paymentType: 'debit', direction: 'sell' },
    { rampPluginId: 'paybis', paymentType: 'credit', direction: 'sell' },
    { rampPluginId: 'paybis', paymentType: 'ach', direction: 'sell' }
  ]
}

const makeParams = (
  overrides: Partial<RampConstraintParams> = {}
): RampConstraintParams => ({
  rampPluginId: 'infinite',
  cryptoAsset: { pluginId: 'bitcoin', tokenId: null },
  fiatCurrencyCode: 'iso:EUR',
  direction: 'buy',
  regionCode: { countryCode: 'FR' },
  paymentType: 'ach',
  ...overrides
})

const constraintResults = (params: RampConstraintParams): boolean[] => [
  ...constraintGenerator(params)
]

afterEach(() => {
  infoServerData.rollup = undefined
})

describe('rampConstraints local ACH gate (piece A)', () => {
  it('allows Infinite ACH in non-US regions', () => {
    expect(
      constraintResults(makeParams({ regionCode: { countryCode: 'FR' } }))
    ).not.toContain(false)
    expect(
      constraintResults(makeParams({ regionCode: { countryCode: 'GB' } }))
    ).not.toContain(false)
  })

  it('keeps the US-only ACH restriction for other providers', () => {
    expect(
      constraintResults(
        makeParams({
          rampPluginId: 'moonpay',
          regionCode: { countryCode: 'FR' }
        })
      )
    ).toContain(false)
    expect(
      constraintResults(
        makeParams({
          rampPluginId: 'moonpay',
          regionCode: { countryCode: 'US' }
        })
      )
    ).not.toContain(false)
  })
})

describe('applyInfoRollupDevOverride rollup override (piece B)', () => {
  it('strips the blanket Infinite block but keeps every other clause', () => {
    const overridden = applyInfoRollupDevOverride({
      rampQuoteFilter: productionRampQuoteFilter
    } as any)
    const nor: Array<{ rampPluginId?: string }> = (
      overridden?.rampQuoteFilter as any
    ).$nor

    expect(nor.some(clause => clause.rampPluginId === 'infinite')).toBe(false)
    // The three Infinite clauses are gone; the four others remain.
    expect(nor).toHaveLength(4)
    expect(nor).toContainEqual({
      rampPluginId: 'moonpay',
      direction: 'buy',
      paymentType: 'ach'
    })
    expect(nor).toContainEqual({
      rampPluginId: 'paybis',
      paymentType: 'ach',
      direction: 'sell'
    })
  })

  it('leaves a rollup without Infinite clauses untouched', () => {
    const noInfinite = {
      rampQuoteFilter: { $nor: [{ rampPluginId: 'moonpay' }] }
    }
    expect(applyInfoRollupDevOverride(noInfinite as any)).toBe(noInfinite)
  })

  it('drupe blocks Infinite ACH FR before override, passes after', () => {
    const params = makeParams({ regionCode: { countryCode: 'FR' } })
    expect(drupe(productionRampQuoteFilter as any)(params)).toBe(false)

    const overridden = applyInfoRollupDevOverride({
      rampQuoteFilter: productionRampQuoteFilter
    } as any)
    expect(drupe(overridden?.rampQuoteFilter as any)(params)).toBe(true)
  })
})

describe('validateRampConstraintParams end to end', () => {
  it('blocks Infinite ACH FR with the raw production rollup', () => {
    infoServerData.rollup = {
      rampQuoteFilter: productionRampQuoteFilter
    } as any
    expect(validateRampConstraintParams(makeParams())).toBe(false)
  })

  it('surfaces Infinite ACH from non-US regions with the overridden rollup', () => {
    infoServerData.rollup = applyInfoRollupDevOverride({
      rampQuoteFilter: productionRampQuoteFilter
    } as any)
    expect(validateRampConstraintParams(makeParams())).toBe(true)
    expect(
      validateRampConstraintParams(
        makeParams({ regionCode: { countryCode: 'GB' } })
      )
    ).toBe(true)
    // Infinite ACH in the US keeps working too.
    expect(
      validateRampConstraintParams(
        makeParams({ regionCode: { countryCode: 'US' } })
      )
    ).toBe(true)
  })

  it('still blocks moonpay ACH outside the US with the overridden rollup', () => {
    infoServerData.rollup = applyInfoRollupDevOverride({
      rampQuoteFilter: productionRampQuoteFilter
    } as any)
    expect(
      validateRampConstraintParams(makeParams({ rampPluginId: 'moonpay' }))
    ).toBe(false)
  })
})
