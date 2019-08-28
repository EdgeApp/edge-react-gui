// @flow

import type { Dispatch, GetState } from '../../../../types/reduxTypes.js'
import * as CORE_SELECTORS from '../../../Core/selectors'

export const deleteLocalAccount = (username: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const context = CORE_SELECTORS.getContext(state)

  return context
    .deleteLocalAccount(username)
    .then(() =>
      dispatch({
        type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT',
        data: { username }
      })
    )
    .catch(e => console.log(e))
}
