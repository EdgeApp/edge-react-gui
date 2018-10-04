// @flow

import { buildExchangeRates } from '../Core/selectors.js'
import type { Dispatch, GetState } from '../ReduxTypes.js'

export const updateExchangeRates = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const exchangeRates = await buildExchangeRates(state)
  dispatch({
    type: 'EXCHANGE_RATES/UPDATE_EXCHANGE_RATES',
    data: { exchangeRates }
  })
}
