export const SELECT_USER_LOGIN = 'SELECT_USER_LOGIN'
export const REMOVE_USER_LOGIN = 'REMOVE_USER_LOGIN'
export const SET_CACHED_USERS = 'SET_CACHED_USERS'
export const USER_TO_DELETE_FROM_CACHE = 'USER_TO_DELETE_FROM_CACHE'
export const DELETE_USER_FROM_CACHE = 'DELETE_USER_FROM_CACHE'
export const OPEN_REMOVE_USER_WARNING = 'OPEN_REMOVE_USER_WARNING'
export const CLOSE_REMOVE_USER_WARNING = 'CLOSE_REMOVE_USER_WARNING'

export function setCachedUsers (data) {
  return {
    type: SET_CACHED_USERS,
    data
  }
}

export function selectUserToLogin (data) {
  return {
    type: SELECT_USER_LOGIN,
    data
  }
}

export function removeUserToLogin () {
  return {
    type: REMOVE_USER_LOGIN
  }
}

export function selectUserToDeleteFromUserCache (data) {
  return {
    type: USER_TO_DELETE_FROM_CACHE,
    data
  }
}

export function deleteUserFromUserCache (data) {
  return {
    type: DELETE_USER_FROM_CACHE,
    data
  }
}

export function openRemoveUserFromCacheWarning () {
  return {
    type: OPEN_REMOVE_USER_WARNING
  }
}

export function closeRemoveUserFromCacheWarning () {
  return {
    type: CLOSE_REMOVE_USER_WARNING
  }
}
