import * as ACTION from './action'
import _ from 'lodash'

export const usersView = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_SELECT_USER :
      return true
    case ACTION.CLOSE_SELECT_USER :
      return false
    default:
      return state
  }
}

export const usersList = (state = [], action) => {
  switch (action.type) {
    case ACTION.LIST_USERS_SIDEBAR :
      return action.data
    case ACTION.REMOVE_USERS_SIDEBAR :
      return _.filter(state, item => item.id !== action.id)
    default:
      return state
  }
}

export const selectedUser = (state = null, action) => {
  switch (action.type) {
    case ACTION.LIST_USERS_SIDEBAR :
      return action.data[0].id
    case ACTION.SELECT_USERS_SIDEBAR :
      return action.id
    default:
      return state
  }
}
