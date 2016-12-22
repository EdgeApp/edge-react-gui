export const SHOW_WHITE_OVERLAY = 'SHOW_WHITE_OVERLAY'
export const HIDE_WHITE_OVERLAY = 'HIDE_WHITE_OVERLAY'

export function showWhiteOverlay () {
  return {
    type: SHOW_WHITE_OVERLAY
  }
}
export function hideWhiteOverlay () {
  return {
    type: HIDE_WHITE_OVERLAY
  }
}
