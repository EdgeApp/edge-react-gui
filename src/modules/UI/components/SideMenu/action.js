/* eslint-disable flowtype/require-valid-file-annotation */

export const OPEN_SIDE_MENU = 'OPEN_SIDE_MENU'
export const CLOSE_SIDE_MENU = 'CLOSE_SIDE_MENU'

export function openSideMenu () {
  return {
    type: OPEN_SIDE_MENU
  }
}

export function closeSideMenu () {
  return {
    type: CLOSE_SIDE_MENU
  }
}
