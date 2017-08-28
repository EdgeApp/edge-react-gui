const PREFIX = 'Core/Context/'

import * as CORE_SELECTORS from '../selectors.js'
import * as CONTEXT_API from '../Context/api.js'

export const ADD_CONTEXT = 'ADD_CONTEXT'
export const addContext = (context) => {
  return {
    type: ADD_CONTEXT,
    data: { context }
  }
}

export const ADD_USERNAMES = PREFIX + 'ADD_USERNAMES'
export const addUsernamesRequest = () => {
  return (dispatch, getState) => {
    const state = getState()
    const context = CORE_SELECTORS.getContext(state)
    CONTEXT_API.listUsernames(context)
    .then(usernames => {
      dispatch(addUsernames(usernames))
    })
  }
}

const addUsernames = (usernames) => {
  return {
    type: ADD_USERNAMES,
    data: { usernames }
  }
}
