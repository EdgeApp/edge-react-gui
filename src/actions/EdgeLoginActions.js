// @flow

import type { EdgeLobby } from 'edge-core-js'
import { Actions } from 'react-native-router-flux'

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
  const lobby: EdgeLobby = await account.fetchLobby(splitArray[1]).catch(error => {
    dispatch(actions.dispatchActionString('setLobbyError', error.message))
  })
  if (lobby) {
    dispatch(storeLobby('saveEdgeLobby', lobby))
  }
}

export const lobbyLogin = () => async (dispatch: any, getState: any) => {
  const state = getState()
  dispatch(actions.dispatchAction('setLobbyError'))
  await state.core.edgeLogin.lobby.loginRequest.approve()
  dispatch(actions.dispatchAction('invalidateEdgeLobby'))
  Actions.pop()
}
