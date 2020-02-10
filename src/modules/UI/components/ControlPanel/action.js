// @flow

import { showError } from '../../../../components/services/AirshipInstance.js'
import type { Dispatch, GetState } from '../../../../types/reduxTypes.js'
import * as CORE_SELECTORS from '../../../Core/selectors'

export const deleteLocalAccount = (username: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const context = CORE_SELECTORS.getContext(state)
  return context.deleteLocalAccount(username).catch(showError)
}
