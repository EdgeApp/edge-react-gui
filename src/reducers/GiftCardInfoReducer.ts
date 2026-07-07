import type { GiftCardInfo } from '../actions/GiftCardInfoActions'
import type { Action } from '../types/reduxTypes'

export const initialState: GiftCardInfo = {
  disablePlugins: {}
}

export const giftCardInfo = (
  state: GiftCardInfo = initialState,
  action: Action
): GiftCardInfo => {
  switch (action.type) {
    case 'UPDATE_GIFT_CARD_INFO': {
      return {
        ...state,
        ...action.data
      }
    }
    default:
      return state
  }
}
