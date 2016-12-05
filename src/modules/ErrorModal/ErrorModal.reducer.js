import * as ACTION from './ErrorModal.action'

export const visible = (state = false, action) => {
  switch (action.type) {
    case ACTION.ERROR_MODAL_OPEN :
      return true

    case ACTION.ERROR_MODAL_CLOSE :
      return false

    default:
      return state
  }
}

export const message = (state = '', action) => {
  switch (action.type) {
    case ACTION.ERROR_MODAL_OPEN :
      return action.message

    case ACTION.ERROR_MODAL_CLOSE :
      return ''

    default:
      return state
  }
}
