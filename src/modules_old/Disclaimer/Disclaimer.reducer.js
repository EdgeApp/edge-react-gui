import * as ACTION from './Disclaimer.action'

export const disclaimerAccepted = (state = true, action) => {
  switch (action.type) {
    case ACTION.ACCEPT_DISCLAIMER :
      return true
    case ACTION.SHOW_DISCLAIMER :
      return false

    default:
      return state
  }
}
