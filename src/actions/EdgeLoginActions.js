// @flow
import * as actions from './indexActions'
import type { AbcLobby } from 'airbitz-core-types'
import * as Constants from '../constants/indexConstants'

export function storeLobby (type: string, data: AbcLobby) {
  return {
    type,
    data
  }
}

export const loginWithEdge = (url: string) => async (
  dispatch: any,
  getState: any
) => {
  const splitArray = url.split('edge/')
  console.log(splitArray[1])
  const state = getState()
  const account = state.core.account
  const lobby: AbcLobby = await account.fetchLobby(splitArray[1]).catch((e) => {
    dispatch(
      actions.openABAlert(Constants.OPEN_AB_ALERT, {
        title: 'Error',
        meassage: e.message,
        buttons: [
          {
            text: 'TRY AGAIN ',
            onPress: dispatch(actions.dispatchAction(Constants.CLOSE_AB_ALERT)),
            style: 'ok'
          }
        ]
      })
    )
  })
  dispatch(storeLobby(Constants.SAVE_ABC_LOBBY,lobby))
  dispatch(
    actions.openABAlert(Constants.OPEN_AB_ALERT, {
      title: 'Title',
      message: 'MEssage',
      buttons: [
        {
          text: 'Close',
          onPress: dispatch(actions.dispatchAction(Constants.CLOSE_AB_ALERT)),
          style: 'cancel'
        },
        {
          text: 'OK',
          onPress: dispatch(actions.lobbyLogin()),
          style: 'ok'
        }
      ]
    })
  )
}

export const lobbyLogin = () => async (dispatch: any, getState: any) => {
  const state = getState()
  await state.core.edgeLogin.loginRequest.approve()
  dispatch(actions.dispatchAction(Constants.INVALIDATE_ABC_LOBBY))
}

