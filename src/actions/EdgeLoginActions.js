// @flow

import type { EdgeLobby } from 'edge-core-js'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import parse from 'url-parse'

import { launchModal } from '../components/common/ModalProvider.js'
import s from '../locales/strings.js'
import { errorModal } from '../modules/UI/components/Modals/ErrorModal.js'

export const loginWithEdge = (url: string) => async (dispatch: any, getState: any) => {
  const parsedUrl = parse(url, {}, false)
  const token = getToken(parsedUrl)
  const state = getState()
  const account = state.core.account
  const lobby: EdgeLobby = await account.fetchLobby(token).catch(error => {
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
    launchModal(errorModal(s.strings.edge_login_failed, e))
  }
}

const getToken = (data: any) => {
  if (data.protocol === 'edge-ret:') {
    const splitArray = data.href.split('edge/')
    return splitArray[1]
  }
  if (data.protocol === 'https:') {
    const splitArray = data.query.split('address=')
    return splitArray[1]
  }
}
