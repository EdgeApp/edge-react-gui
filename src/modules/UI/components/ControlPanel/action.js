export const OPEN_SELECT_USER = 'OPEN_SELECT_USER'
export const CLOSE_SELECT_USER = 'CLOSE_SELECT_USER'
export const LIST_USERS_SIDE_MENU = 'LIST_USER_USER_SIDE_MENU'
export const SELECT_USERS_SIDE_MENU = 'SELECT_USERS_SIDE_MENU'
export const REMOVE_USERS_SIDE_MENU = 'REMOVE_USERS_SIDE_MENU'

export const openSelectUser = () => ({
  type: OPEN_SELECT_USER
})

export const closeSelectUser = () => ({
  type: CLOSE_SELECT_USER
})

export const selectUsersList = (name) => ({
  type: SELECT_USERS_SIDE_MENU,
  name
})

export const removeUsersList = (name) => ({
  type: REMOVE_USERS_SIDE_MENU,
  name
})
