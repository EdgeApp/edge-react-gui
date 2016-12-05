import * as ACTION from './action'

export const reviewDetails = (state = false, action) => {
  switch (action.type) {
    case ACTION.SHOW_DETAILS:
      return true

    case ACTION.HIDE_DETAILS:
      return false

    default:
      return state
  }
}

