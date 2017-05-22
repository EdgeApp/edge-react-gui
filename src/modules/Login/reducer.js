import * as ACTION from './action'

export const airbitz = (state = {}, action) => {
  const { type, data = {} } = action
  const { airbitz } = data
  switch (type) {
    case ACTION.ADD_AIRBITZ_TO_REDUX :
      return airbitz
    default:
      return state
  }
}

export const account = (state = {}, action) => {
  const { type, data = {} } = action
  const { account = {} } = data
  switch (type) {
    case ACTION.ADD_ACCOUNT_TO_REDUX :
      return account
    default:
      return state
  }
}
