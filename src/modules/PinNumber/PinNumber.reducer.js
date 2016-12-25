import * as ACTION from './PinNumber.action'
import { GET_DETAILS } from '../ReviewDetails/ReviewDetails.action'

export const pinNumber = (state = '', action) => {
  switch (action.type) {
    case ACTION.CHANGE_PIN_NUMBER_VALUE:
      return action.data
    case GET_DETAILS :
      return ''
    default:
      return state
  }
}

