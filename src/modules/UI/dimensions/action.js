export const SET_HEADER_HEIGHT = 'SET_HEADER_HEIGHT'

export function setHeaderHeight (height) {
  return {
    type: SET_HEADER_HEIGHT,
    data: height
  }
}
