import * as ACTION from './action'
import _ from 'lodash'
import {combineReducers} from 'redux'

const usersView = (state = false, action) => {
  switch (action.type) {
    case ACTION.OPEN_SELECT_USER :
      return true
    case ACTION.CLOSE_SELECT_USER :
      return false
    default:
      return state
  }
}

const usersList = (state = [], action) => {
  switch (action.type) {
    case ACTION.LIST_USERS_SIDEBAR :
      return action.data
    case ACTION.REMOVE_USERS_SIDEBAR :
      return _.filter(state, item => item.id !== action.id)
    default:
      return state
  }
}

const selectedUser = (state = null, action) => {
  switch (action.type) {
    case ACTION.LIST_USERS_SIDEBAR :
      return action.data[0]
    case ACTION.SELECT_USERS_SIDEBAR :
      return action.id
    default:
      return state
  }
}

const controlPanel = combineReducers({
  usersView,
  usersList,
  selectedUser
})

export default controlPanel
