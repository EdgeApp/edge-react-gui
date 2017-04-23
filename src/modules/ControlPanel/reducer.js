import * as ACTION from './action'

export const usersView = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_SELECT_USER :
      return true
    case ACTION.CLOSE_SELECT_USER :
      return false
    default:
      return state
  }
}
