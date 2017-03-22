import * as ACTION from './Login.action'
import { SELECT_USER_LOGIN, REMOVE_USER_LOGIN, DELETE_USER_FROM_CACHE } from '../CachedUsers/CachedUsers.action'
import { WARNING_MODAL_OPEN } from '../WarningModal/WarningModal.action'

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
      return action.data

    case DELETE_USER_FROM_CACHE :
      return ''

    default:
      return state
  }
}

export const password = (state = '', action) => {
  switch (action.type) {

    case ACTION.LOG_IN_PASSWORD :
      return action.data

    case ACTION.USER_LOGIN :
      return ''

    case DELETE_USER_FROM_CACHE :
      return ''

    default:
      return state
  }
}

export const showCachedUsers = (state = false, action) => {
  switch (action.type) {

    case ACTION.OPEN_USER_LIST :
      return true

    case ACTION.CLOSE_USER_LIST :
      return false

    case ACTION.LOG_IN_USERNAME :
      return false

    case SELECT_USER_LOGIN :
      return false

    case WARNING_MODAL_OPEN :
      return false

    default:
      return state
  }
}

export const pin = (state = '', action) => {
  switch (action.type) {

    case ACTION.LOG_IN_PIN :
      return action.data

    case ACTION.USER_LOGIN :
      return ''

    default:
      return state
  }
}
export const pinDummy = (state = '', action) => {
  switch (action.type) {
    case ACTION.LOG_IN_PIN:
      let len = action.data.length
      let retval = ''
      for (var i = 0; i < len; i++) {
        retval += '·'
      }
      return retval
    case ACTION.USER_LOGIN :
      return ''
    default:
      return state
  }
}

