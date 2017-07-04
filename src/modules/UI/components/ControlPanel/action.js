export const OPEN_SELECT_USER = 'OPEN_SELECT_USER'
export const CLOSE_SELECT_USER = 'CLOSE_SELECT_USER'
export const LIST_USERS_SIDEBAR = 'LIST_USER_USER_SIDEBAR'
export const SELECT_USERS_SIDEBAR = 'SELECT_USERS_SIDEBAR'
export const REMOVE_USERS_SIDEBAR = 'REMOVE_USERS_SIDEBAR'

export const LOGOUT = 'LOGOUT'

export const logoutRequest = () => {
  return (dispatch, getState) => {
    dispatch(logout())
  }
}

export const logout = () => {
  return {
    type: LOGOUT
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

export const getUsersList = (data) => {
  return {
    type: LIST_USERS_SIDEBAR,
    data
  }
}

export const selectUsersList = (id) => {
  return {
    type: SELECT_USERS_SIDEBAR,
    id
  }
}

export const removeUsersList = (id) => {
  return {
    type: REMOVE_USERS_SIDEBAR,
    id
  }
}
