export const SKIP_BUTTON_HIDE = 'SKIP_BUTTON_HIDE'
export const SKIP_BUTTON_SHOW = 'SKIP_BUTTON_SHOW'

export function showSkipButton () {
  return {
    type: SKIP_BUTTON_SHOW
  }
}

export function hideSkipButton () {
  return {
    type: SKIP_BUTTON_HIDE
  }
}
