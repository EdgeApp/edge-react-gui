import * as ACTION from './Landing.action'

export const whiteOverlayVisible = (state = false, action) => {
  switch (action.type) {
    case ACTION.HIDE_WHITE_OVERLAY :
      return false
    case ACTION.SHOW_WHITE_OVERLAY:
      return true

    default:
      return state
  }
}
