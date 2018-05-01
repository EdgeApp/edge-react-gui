// @flow

import type { Action, Store } from '../modules/ReduxTypes.js'
import { displayErrorAlert } from '../modules/UI/components/ErrorAlert/actions.js'

export default (store: Store) => (next: Function) => (action: Action) => {
  let out
  try {
    out = next(action)
  } catch (error) {
    console.log(error)
    store.dispatch(displayErrorAlert(error.message))
  }

  if (out && out.then && typeof out.then === 'function') {
    out.catch(error => {
      console.log(error)
      store.dispatch(displayErrorAlert(error.message))
    })
  }

  return out
}
