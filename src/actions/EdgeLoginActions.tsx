import { EdgeLobby } from 'edge-core-js/types'
import * as React from 'react'
import { Alert } from 'react-native'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import s from '../locales/strings'
import { ThunkAction } from '../types/reduxTypes'
import { NavigationBase } from '../types/routerTypes'

export function loginWithEdge(lobbyId: string): ThunkAction<void> {
  return (dispatch, getState) => {
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
}

export function lobbyLogin(navigation: NavigationBase): ThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState()
    const { lobby } = state.core.edgeLogin
    if (lobby == null) return
    const { loginRequest } = lobby
    if (loginRequest == null) return

    dispatch({ type: 'PROCESS_EDGE_LOGIN' })
    try {
      await loginRequest.approve()
      dispatch({ type: 'INVALIDATE_EDGE_LOBBY' })
      navigation.pop()
      setTimeout(() => {
        Alert.alert(s.strings.send_scan_edge_login_success_title, s.strings.send_scan_edge_login_success_message)
      }, 750)
    } catch (e: any) {
      dispatch({ type: 'EDGE_LOBBY_ACCEPT_FAILED' })
      Airship.show<'ok' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          buttons={{ ok: { label: s.strings.string_ok } }}
          message={e.message.includes('Could not reach') ? s.strings.edge_login_fail_message : e.message}
          title={s.strings.edge_login_failed}
        />
      ))
    }
  }
}
