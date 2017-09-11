export const OPEN_SELECT_USER = 'OPEN_SELECT_USER'
export const CLOSE_SELECT_USER = 'CLOSE_SELECT_USER'
export const LIST_USERS_SIDEBAR = 'LIST_USER_USER_SIDEBAR'
export const SELECT_USERS_SIDEBAR = 'SELECT_USERS_SIDEBAR'
export const REMOVE_USERS_SIDEBAR = 'REMOVE_USERS_SIDEBAR'

export const LOGOUT = 'LOGOUT'

import * as CORE_SELECTORS from '../../../Core/selectors'
import * as ACCOUNT_API from '../../../Core/Account/api'
import * as SETTINGS_ACTIONS from '../../Settings/action'
import { Actions } from 'react-native-router-flux'

export const logoutRequest = (username) => {
  return (dispatch, getState) => {
    const state = getState()
    dispatch(SETTINGS_ACTIONS.setLoginStatus(false))

    const account = CORE_SELECTORS.getAccount(state)
    ACCOUNT_API.logoutRequest(account)
   .then(() => {
     dispatch(logout(username))
     Actions.login({ username })
   })
  }
}

export const logout = (username) => {
  return {
    type: LOGOUT,
    data: { username }
  }
}

export const openSelectUser = () => {
  return {
    type: OPEN_SELECT_USER
  }
}

export const closeSelectUser = () => {
  return {
    type: CLOSE_SELECT_USER
  }
}

export const selectUsersList = (name) => {
  return {
    type: SELECT_USERS_SIDEBAR,
    name
  }
}

export const removeUsersList = (name) => {
  return {
    type: REMOVE_USERS_SIDEBAR,
    name
  }
}
