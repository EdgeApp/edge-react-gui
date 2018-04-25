// @flow

export const SET_KEYBOARD_HEIGHT = 'SET_KEYBOARD_HEIGHT'

export function setKeyboardHeight (height: number) {
  return {
    type: SET_KEYBOARD_HEIGHT,
    data: height
  }
}
