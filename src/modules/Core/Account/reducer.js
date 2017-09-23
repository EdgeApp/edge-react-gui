import * as ACTION from './action.js'

export const accountReducer = (state = {}, action) => {
  const {type, data = {} } = action
  const {account} = data

  switch (type) {
  case ACTION.ADD_ACCOUNT:
    return account
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
