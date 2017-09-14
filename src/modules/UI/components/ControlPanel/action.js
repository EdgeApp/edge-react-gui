export const OPEN_SELECT_USER = 'OPEN_SELECT_USER'
export const CLOSE_SELECT_USER = 'CLOSE_SELECT_USER'
export const LIST_USERS_SIDEBAR = 'LIST_USER_USER_SIDEBAR'
export const SELECT_USERS_SIDEBAR = 'SELECT_USERS_SIDEBAR'
export const REMOVE_USERS_SIDEBAR = 'REMOVE_USERS_SIDEBAR'

export const openSelectUser = () => ({
  type: OPEN_SELECT_USER
})

export const closeSelectUser = () => ({
  type: CLOSE_SELECT_USER
})

export const selectUsersList = (name) => ({
  type: SELECT_USERS_SIDEBAR,
  name
})

export const removeUsersList = (name) => ({
  type: REMOVE_USERS_SIDEBAR,
  name
})
