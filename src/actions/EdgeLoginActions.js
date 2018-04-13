// @flow

import type { EdgeLobby } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../constants/indexConstants'
import * as actions from './indexActions'

export function storeLobby (type: string, data: EdgeLobby) {
  return {
    type,
    data
  }
}

export const loginWithEdge = (url: string) => async (dispatch: any, getState: any) => {
  const splitArray = url.split('edge/')
  const state = getState()
  const account = state.core.account
  const lobby: EdgeLobby = await account.fetchLobby(splitArray[1]).catch(e => {
    dispatch(actions.dispatchActionString(Constants.SET_LOBBY_ERROR, e.message))
  })
  if (lobby) {
    dispatch(storeLobby(Constants.SAVE_ABC_LOBBY, lobby))
  }
}

export const lobbyLogin = () => async (dispatch: any, getState: any) => {
  const state = getState()
  dispatch(actions.dispatchAction(Constants.PROCESS_ABC_LOGIN))
  await state.core.edgeLogin.lobby.loginRequest.approve()
  dispatch(actions.dispatchAction(Constants.INVALIDATE_ABC_LOBBY))
  Actions.pop()
}
