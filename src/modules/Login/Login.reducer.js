import * as ACTION from './Login.action'

const airbitz = (state = {}, action) => {
  switch (action.type) {
    case ACTION.ADD_AIRBITZ_TO_REDUX :
      return action.airbitz
    default:
      return state
  }
}

const account = (state = {}, action) => {
  switch (action.type) {
    case ACTION.ADD_ACCOUNT_TO_REDUX :
      return action.account
    default:
      return state
  }
}

export default {
  airbitz,
  account
}
