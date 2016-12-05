import * as ACTION from './action'

export const pinNumber = (state = '', action) => {
  switch (action.type) {
    case ACTION.CHANGE_PIN_NUMBER_VALUE:
      return action.data

    default:
      return state
  }
}

