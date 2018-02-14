// @flow
import type { AbcContextCallbacks } from 'edge-login'

import { updateExchangeRates } from '../../ExchangeRates/action'
import type { Dispatch } from '../../ReduxTypes'
import { displayErrorAlert } from '../../UI/components/ErrorAlert/actions'

export default (dispatch: Dispatch): AbcContextCallbacks => ({
  onError: (error: Error) => {
    console.log(error)
    dispatch(displayErrorAlert(error.message))
  },

  onExchangeUpdate () {
    dispatch(updateExchangeRates())
  }
})
