import * as ACTION from './Username.action'
import { GET_DETAILS } from '../ReviewDetails/ReviewDetails.action'

export const username = (state = '', action) => {
  switch (action.type) {
    case ACTION.CHANGE_USERNAME_VALUE :
      return action.data
    case GET_DETAILS :
      return ''
    default:
      return state
  }
}

