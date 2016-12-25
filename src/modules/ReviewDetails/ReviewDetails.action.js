export const SHOW_DETAILS = 'SHOW_DETAILS'
export const HIDE_DETAILS = 'HIDE_DETAILS'
export const GET_DETAILS = 'GET_DETAILS'

export function showSignInDetails () {
  return {
    type: SHOW_DETAILS
  }
}

export function hideSignInDetails () {
  return {
    type: HIDE_DETAILS
  }
}

export function getDetails (data) {
  return {
    type: GET_DETAILS,
    data
  }
}
