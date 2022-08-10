// @flow

import { type EdgeLobby } from 'edge-core-js/types'
import * as React from 'react'
import { Alert } from 'react-native'

import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
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
    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        buttons={{ ok: { label: s.strings.string_ok } }}
        message={e.message.includes('Could not reach') ? s.strings.edge_login_fail_message : e.message}
        title={s.strings.edge_login_failed}
      />
    ))
  }
}
