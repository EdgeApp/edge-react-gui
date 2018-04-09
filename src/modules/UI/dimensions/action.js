/* eslint-disable flowtype/require-valid-file-annotation */

export const SET_KEYBOARD_HEIGHT = 'SET_KEYBOARD_HEIGHT'

export function setKeyboardHeight (height) {
  return {
    type: SET_KEYBOARD_HEIGHT,
    data: height
  }
}
