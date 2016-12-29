import * as ACTION from './Landing.action'

export const whiteOverlayVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.REMOVE_WHITE_OVERLAY :
      return false
    case ACTION.SHOW_WHITE_OVERLAY:
      return true

    default:
      return state
  }
}
export const lostFocus = (state = false, action) => {
  switch (action.type) {
    case ACTION.SHOW_WHITE_OVERLAY:
      return true
    case ACTION.SHOW_WHITE_OVERLAY_COMPLETE:
      return false
    default:
      return state
  }
}
export const gainedFocus = (state = false, action) => {
  switch (action.type) {
    case ACTION.REMOVE_WHITE_OVERLAY :
      return false
    case ACTION.FADE_WHITE_OVERLAY:
      return true
    default:
      return state
  }
}

