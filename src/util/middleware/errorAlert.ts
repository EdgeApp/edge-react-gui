import { Middleware } from 'redux'

import { showError } from '../../components/services/AirshipInstance'
import { Dispatch, RootState } from '../../types/reduxTypes'

export const errorAlert: Middleware<{}, RootState, Dispatch> = store => next => action => {
  try {
    const out: any = next(action)
    if (out != null && typeof out.then === 'function') {
      out.catch(showError)
    }
    return out
  } catch (error: any) {
    showError(error)
  }
  return action
}
