// @flow
import * as Constants from '../../constants/indexConstants'

const initialState = {
  lobby: null
}

export default function (state: any = initialState, action: any) {
  switch (action.type) {
  case Constants.INVALIDATE_ABC_LOBBY:
    return { ...state, lobby: null }
  case Constants.SAVE_ABC_LOBBY:
    return {...state, lobby: action.data}
  default:
    return state
  }
}
