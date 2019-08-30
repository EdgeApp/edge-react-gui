// @flow

import { showError } from '../components/services/AirshipInstance.js'
import type { Action, Store } from '../types/reduxTypes.js'

export default (store: Store) => (next: Function) => (action: Action) => {
  let out
  try {
    out = next(action)
  } catch (error) {
    showError(error)
  }

  if (out && out.then && typeof out.then === 'function') {
    out.catch(showError)
  }

  return out
}
