// @flow

import { showModal } from 'edge-components'
import type { EdgeLobby } from 'edge-core-js'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../locales/strings.js'
import { errorModal } from '../modules/UI/components/Modals/ErrorModal.js'

export const loginWithEdge = (url: string) => async (dispatch: any, getState: any) => {
  const splitArray = url.split('edge/')
  const state = getState()
  const account = state.core.account
  const lobby: EdgeLobby = await account.fetchLobby(splitArray[1]).catch(error => {
    dispatch({ type: 'SET_LOBBY_ERROR', data: error.message })
  })
  if (lobby) {
    dispatch({ type: 'SAVE_EDGE_LOBBY', data: lobby })
  }
}

export const lobbyLogin = () => async (dispatch: any, getState: any) => {
  const state = getState()
  dispatch({ type: 'PROCESS_EDGE_LOGIN' })
  try {
    await state.core.edgeLogin.lobby.loginRequest.approve()
    dispatch({ type: 'INVALIDATE_EDGE_LOBBY' })
    Actions.pop()
    setTimeout(() => {
      Alert.alert(s.strings.send_scan_edge_login_success_title, s.strings.send_scan_edge_login_success_message)
    }, 750)
  } catch (e) {
    dispatch({ type: 'EDGE_LOBBY_ACCEPT_FAILED' })
    e.message = e.message.includes('Could not reach') ? s.strings.edge_login_fail_message : e.message
    showModal(errorModal(s.strings.edge_login_failed, e))
  }
}
