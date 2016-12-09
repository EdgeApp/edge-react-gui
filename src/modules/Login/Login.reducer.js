import * as ACTION from './Login.action'

export const viewPassword = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_LOG_IN :
      return true

    case ACTION.CLOSE_LOG_IN :
      return false

    default:
      return state
  }
}

export const viewPIN = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_LOG_IN_USING_PIN :
      return true

    case ACTION.CLOSE_LOG_IN_USING_PIN :
      return false

    default:
      return state
  }
}

export const username = (state = '', action) => {
  switch (action.type) {
    case ACTION.LOG_IN_USERNAME :
      return action.data

    default:
      return state
  }
}

export const password = (state = '', action) => {
  switch (action.type) {
    case ACTION.LOG_IN_PASSWORD :
      return action.data

    default:
      return state
  }
}

export const pin = (state = '', action) => {
  switch (action.type) {
    case ACTION.LOG_IN_PIN :
      return action.data

    default:
      return state
  }
}
