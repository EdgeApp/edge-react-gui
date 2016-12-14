import * as ACTION from './Disclaimer.action'

export const disclaimerAccepted = (state = false, action) => {
  switch (action.type) {
    case ACTION.ACCEPT_DISCLAIMER :
      return true

    default:
      return state
  }
}
