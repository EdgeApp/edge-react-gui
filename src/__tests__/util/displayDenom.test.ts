import { describe, expect, it } from '@jest/globals'
import type { EdgeCurrencyConfig } from 'edge-core-js'

import { selectDisplayDenom } from '../../selectors/DenominationSelectors'
import { getDisplayDenom, getExchangeDenom } from '../../util/exchangeDenom'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { BTC_DENOM, USDC_DENOM, USDC_TOKENS } from '../../util/fake/fakeDisklet'

/**
 * One derivation for both exports.
 *
 * The GUI's Export writes the *display* denomination into its CSV and QBO
 * files — `AMT_ASSET` with a `DENOMINATION` column, and `TRNAMT` with no unit
 * field at all — and the CLI's `get-transactions --export-format=csv` used
 * the exchange denomination, so a BTC wallet set to "bits" exported
 * `50000`/`bits` from the scene and `0.0005`/`BTC` from the command line for
 * the same transaction. `selectDisplayDenom` is now this function with the
 * settings read out of Redux, and the engine passes the same records from the
 * synced `Settings.json`.
 */
// `BTC_DENOM`, `USDC_DENOM` and the token map come from the shared fakes,
// which `exchangeDenom.test.ts` already imports under a comment saying "not
// a third near-copy of the same shape". `BITS_DENOM` is this suite's own —
// it is the *custom* denomination the settings select, which is what these
// cases are about.
const BITS_DENOM = { name: 'bits', multiplier: '100', symbol: 'ƀ' }

const config = (): EdgeCurrencyConfig =>
  makeFakeCurrencyConfig(
    { pluginId: 'bitcoin', currencyCode: 'BTC', denominations: [BTC_DENOM] },
    USDC_TOKENS
  )

describe('getDisplayDenom', () => {
  it('answers the exchange denomination when nothing was chosen', () => {
    expect(getDisplayDenom({}, config(), null)).toStrictEqual(
      getExchangeDenom(config(), null)
    )
  })

  it('answers the units the user chose', () => {
    expect(
      getDisplayDenom({ bitcoin: { BTC: BITS_DENOM } }, config(), null)
    ).toStrictEqual(BITS_DENOM)
  })

  it('keys a token by its currency code, not its id', () => {
    expect(
      getDisplayDenom(
        { bitcoin: { USDC: { name: 'µUSDC', multiplier: '1', symbol: '' } } },
        config(),
        'deadbeef'
      ).name
    ).toBe('µUSDC')
    // A choice recorded under the id names no asset.
    expect(
      getDisplayDenom(
        { bitcoin: { deadbeef: BITS_DENOM } },
        config(),
        'deadbeef'
      )
    ).toStrictEqual(USDC_DENOM)
  })

  it('ignores a choice for another plugin', () => {
    expect(
      getDisplayDenom({ ethereum: { BTC: BITS_DENOM } }, config(), null)
    ).toStrictEqual(BTC_DENOM)
  })

  it('answers the exchange denomination for a token the plugin dropped', () => {
    // `hasOwn`, so `__proto__` cannot reach `Object.prototype`.
    expect(getDisplayDenom({}, config(), '__proto__').multiplier).toBe('1')
    expect(getDisplayDenom({}, config(), 'nosuchtoken').multiplier).toBe('1')
  })
})

/**
 * The app's wallet row and the CLI's `displayAmount` are one derivation.
 *
 * Stated in this file's own docblock and asserted nowhere, which is the gap
 * QA named: the only way to *observe* the agreement is to read the number
 * off a running app beside the number the CLI prints, and that needs a
 * device build on a funded tester account. What can be checked here is the
 * claim the agreement rests on — that `selectDisplayDenom`, which the wallet
 * row and the export scene both read, is this function with Redux's
 * `denominationSettings` passed in, and not a second implementation that
 * happens to agree today.
 */
describe('selectDisplayDenom', () => {
  it('is getDisplayDenom over the settings in Redux', () => {
    const currencyConfig = config()
    for (const settings of [
      {},
      { bitcoin: { BTC: BITS_DENOM } },
      { bitcoin: { USDC: BTC_DENOM } }
    ]) {
      const state = { ui: { settings: { denominationSettings: settings } } }
      for (const tokenId of [null, 'deadbeef', 'nosuchtoken']) {
        expect(
          selectDisplayDenom(state as any, currencyConfig, tokenId)
        ).toStrictEqual(getDisplayDenom(settings, currencyConfig, tokenId))
      }
    }
  })
})
