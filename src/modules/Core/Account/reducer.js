import * as ACTION from './action.js'

export const accountReducer = (state = {}, action) => {
  switch (action.type) {
  case ACTION.ADD_ACCOUNT:
    if (action.data) {
      return action.data.account
    }
    return state
  default:
    return state
  }
}

export const account = (state, action) => {
  if (action.type === 'LOGOUT') {
    state = undefined
  }

  return accountReducer(state, action)
}
