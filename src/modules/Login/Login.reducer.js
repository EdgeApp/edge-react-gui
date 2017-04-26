import * as ACTION from './Login.action'

export default login = (state = {}, action) => {
  switch (action.type) {
    case ACTION.ADD_AIRBITZ_TO_REDUX :
      return action.airbitz
    case ACTION.ADD_ACCOUNT_TO_REDUX :
      return action.account
    default:
      return state
  }
}
