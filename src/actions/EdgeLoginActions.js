// @flow

import { type EdgeLobby } from 'edge-core-js/types'
import { Alert } from 'react-native'

import { launchModal } from '../components/common/ModalProvider.js'
import s from '../locales/strings.js'
import { errorModal } from '../modules/UI/components/Modals/ErrorModal.js'
import { type Dispatch, type GetState } from '../types/reduxTypes.js'
import { Actions } from '../types/routerTypes.js'

export const loginWithEdge = (lobbyId: string) => (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { account } = state.core
  account
    .fetchLobby(lobbyId)
    .then((lobby: EdgeLobby) => {
      dispatch({ type: 'SAVE_EDGE_LOBBY', data: lobby })
    })
    .catch(error => {
      dispatch({ type: 'SET_LOBBY_ERROR', data: error.message })
    })
}

export const lobbyLogin = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()
  const { lobby } = state.core.edgeLogin
  if (lobby == null) return
  const { loginRequest } = lobby
  if (loginRequest == null) return

  dispatch({ type: 'PROCESS_EDGE_LOGIN' })
  try {
    await loginRequest.approve()
    dispatch({ type: 'INVALIDATE_EDGE_LOBBY' })
    Actions.pop()
    setTimeout(() => {
      Alert.alert(s.strings.send_scan_edge_login_success_title, s.strings.send_scan_edge_login_success_message)
    }, 750)
  } catch (e) {
    dispatch({ type: 'EDGE_LOBBY_ACCEPT_FAILED' })
    e.message = e.message.includes('Could not reach') ? s.strings.edge_login_fail_message : e.message
    launchModal(errorModal(s.strings.edge_login_failed, e))
  }
}
