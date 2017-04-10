import * as ACTION from './Transactions.action'

export const view = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_SIDEBAR :
      return true
    case ACTION.CLOSE_SIDEBAR :
      return false
    default:
      return state
  }
}
