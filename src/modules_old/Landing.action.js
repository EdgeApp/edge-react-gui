export const SHOW_WHITE_OVERLAY = 'SHOW_WHITE_OVERLAY'
export const SHOW_WHITE_OVERLAY_COMPLETE = 'SHOW_WHITE_OVERLAY_COMPLETE'
export const REMOVE_WHITE_OVERLAY = 'REMOVE_WHITE_OVERLAY'
export const FADE_WHITE_OVERLAY = 'FADE_WHITE_OVERLAY'

export function showWhiteOverlay () {
  return {
    type: SHOW_WHITE_OVERLAY
  }
}
export function removeWhiteOverlay () {
  return {
    type: REMOVE_WHITE_OVERLAY
  }
}
export function fadeWhiteOverlay () {
  return {
    type: FADE_WHITE_OVERLAY
  }
}

export function showWhiteOverlayComplete () {
  return {
    type: SHOW_WHITE_OVERLAY_COMPLETE
  }
}

