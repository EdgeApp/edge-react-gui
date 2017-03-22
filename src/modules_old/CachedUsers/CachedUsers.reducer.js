import * as ACTION from './CachedUsers.action'

export const users = (state = [], action) => {
  switch (action.type) {
    case ACTION.SET_CACHED_USERS :
      return action.data

    case ACTION.DELETE_USER_FROM_CACHE :
      return state.filter(user => user !== action.data)

    default:
      return state
  }
}

export const selectedUserToLogin = (state = null, action) => {
  switch (action.type) {
    case ACTION.SELECT_USER_LOGIN :
      return action.data

    case ACTION.REMOVE_USER_LOGIN :
      return null

    default:
      return state
  }
}

export const userToDeleteFromUserCache = (state = '', action) => {
  switch (action.type) {
    case ACTION.USER_TO_DELETE_FROM_CACHE :
      return action.data

    default:
      return state
  }
}
