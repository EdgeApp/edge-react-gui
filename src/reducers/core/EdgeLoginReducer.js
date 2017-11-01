// @flow
import * as Constants from '../../constants/indexConstants'

const initialState = {
  lobby: null,
  error: null,
  isProcessing: false
}

export default function (state: any = initialState, action: any) {
  switch (action.type) {
  case Constants.PROCESS_ABC_LOGIN:
    return { ...state, isProcessing: true}
  case Constants.INVALIDATE_ABC_LOBBY:
    return { ...state, lobby: null, isProcessing: false}
  case Constants.SET_LOBBY_ERROR:
    return { ...state, lobby: null, error: action.data}
  case Constants.SAVE_ABC_LOBBY:
    return {...state, lobby: action.data, error: null}
  default:
    return state
  }
}
