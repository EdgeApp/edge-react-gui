import type {
  EdgeCurrencyConfig,
  EdgeDenomination,
  EdgeTokenId
} from 'edge-core-js'

import type { RootState } from '../types/reduxTypes'
import { getDisplayDenom } from '../util/exchangeDenom'

export { emptyEdgeDenomination, getExchangeDenom } from '../util/exchangeDenom'

/**
 * The units an asset is shown in, from Redux.
 *
 * The derivation itself is `getDisplayDenom` in `util/exchangeDenom`, which
 * the CLI engine calls with the same `denominationSettings` read out of the
 * synced `Settings.json` — so the GUI's rows, the GUI's export and the
 * CLI's export divide by the same multiplier.
 */
export const selectDisplayDenom = (
  state: RootState,
  currencyConfig: EdgeCurrencyConfig,
  tokenId: EdgeTokenId
): EdgeDenomination =>
  getDisplayDenom(
    state.ui.settings.denominationSettings,
    currencyConfig,
    tokenId
  )
