import * as ACTION from './action.js'

export const account = (state = {}, action) => {
  const { type, data = {} } = action
  const { account } = data

  switch (type) {
    case ACTION.ADD_ACCOUNT:
      return account
    default:
      return state
  }
}
