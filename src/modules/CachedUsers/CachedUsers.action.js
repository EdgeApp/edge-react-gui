export const SELECT_USER_LOGIN = 'SELECT_USER_LOGIN'
export const REMOVE_USER_LOGIN = 'REMOVE_USER_LOGIN'

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
