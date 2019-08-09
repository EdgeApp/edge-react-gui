// @flow

import type { Dispatch, GetState } from '../../../../types/reduxTypes.js'
import * as CONTEXT_API from '../../../Core/Context/api'
import * as CORE_SELECTORS from '../../../Core/selectors'

export const deleteLocalAccount = (username: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const context = CORE_SELECTORS.getContext(state)

  return CONTEXT_API.deleteLocalAccount(context, username)
    .then(() =>
      dispatch({
        type: 'CORE/CONTEXT/DELETE_LOCAL_ACCOUNT',
        data: { username }
      })
    )
    .catch(e => console.log(e))
}
