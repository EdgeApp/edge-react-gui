// @flow

import { type Middleware } from 'redux'

import { showError } from '../../components/services/AirshipInstance.js'
import { type Action, type RootState } from '../../types/reduxTypes.js'

export const errorAlert: Middleware<RootState, Action> = store => next => action => {
  try {
    const out: any = next(action)
    if (out != null && typeof out.then === 'function') {
      out.catch(showError)
    }
    return out
  } catch (error) {
    showError(error)
  }
  return action
}
