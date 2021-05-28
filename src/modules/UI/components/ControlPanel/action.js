// @flow

import { showError } from '../../../../components/services/AirshipInstance.js'
import type { Dispatch, GetState } from '../../../../types/reduxTypes.js'

export const deleteLocalAccount =
  (username: string) => (dispatch: Dispatch, getState: GetState) => {
    const state = getState()
    return state.core.context.deleteLocalAccount(username).catch(showError)
  }
