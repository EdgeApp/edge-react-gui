// @flow
import type {AbcContextCallbacks} from 'edge-login'
import type {Dispatch} from '../../ReduxTypes'

import {displayErrorAlert} from '../../UI/components/ErrorAlert/actions'
import {updateExchangeRates} from '../../ExchangeRates/action'

export default (dispatch: Dispatch): AbcContextCallbacks => ({
  onError: (error: Error) => {
    console.log(error)
    dispatch(displayErrorAlert(error.message))
  },

  onExchangeUpdate () {
    // console.log('onExchangeUpdate')
    dispatch(updateExchangeRates())
  }
})
