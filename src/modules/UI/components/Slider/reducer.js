// @flow
import { SET_SLIDER_ERROR, CLEAR_SLIDER_ERROR } from '../../../../constants/indexConstants'
import type {Action} from '../../../ReduxTypes.js'

export const sliderError = (state: boolean = false, action: Action) => {
  switch (action.type) {
    case SET_SLIDER_ERROR:
      return true
    case CLEAR_SLIDER_ERROR:
      return false
    default:
      return state
  }
}
