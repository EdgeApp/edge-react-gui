import * as ACTION from './Login.action'
import { SELECT_USER_LOGIN, REMOVE_USER_LOGIN } from '../CachedUsers/CachedUsers.action'

export const viewPassword = (state = true, action) => {
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
    case SELECT_USER_LOGIN :
      return true

    case REMOVE_USER_LOGIN :
      return false

    default:      
      return state
  }
}

export const username = (state = '', action) => {
  switch (action.type) {
    case ACTION.LOG_IN_USERNAME :
      return action.data
    case SELECT_USER_LOGIN :
      return action.data.name
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
