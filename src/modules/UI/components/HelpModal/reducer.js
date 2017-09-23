import * as ACTION from './actions.js'

export const helpModal = (state = false, action) => {
  switch (action.type) {
  case ACTION.OPEN_HELP_MODAL :
    return true
  case ACTION.CLOSE_HELP_MODAL :
    return false
  default:
    return state
  }
}
