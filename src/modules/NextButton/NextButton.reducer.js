import * as ACTION from './NextButton.action'

export const nextButtonVisible = (state = true, action) => {
  switch (action.type) {
    case ACTION.NEXT_BUTTON_HIDE: {
      return false
    }

    case ACTION.NEXT_BUTTON_SHOW:
      return true

    default:
      return state
  }
}
