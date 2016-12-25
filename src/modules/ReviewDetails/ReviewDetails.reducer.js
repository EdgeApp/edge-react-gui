import * as ACTION from './ReviewDetails.action'

const defaultDetails = {
  username: '',
  password: '',
  pin: ''
}

export const details = (state = defaultDetails, action) => {
  switch (action.type) {
    case ACTION.GET_DETAILS:
      return Object.assign({}, state, action.data)

    default:
      return state
  }
}

export const view = (state = false, action) => {
  switch (action.type) {
    case ACTION.SHOW_DETAILS:
      return true

    case ACTION.HIDE_DETAILS:
      return false

    default:
      return state
  }
}

