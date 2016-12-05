export const CHANGE_USERNAME_VALUE = 'CHANGE_USERNAME_VALUE'

export function changeUsernameValue (data) {
  return {
    type: CHANGE_USERNAME_VALUE,
    data
  }
}
