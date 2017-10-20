// @flow
// import * as actions from './indexActions'
import type {AbcLobby} from 'airbitz-core-types'

export const loginWithEdge = (url: string) => async (dispatch: any, getState: any) => {
  const splitArray = url.split('edge/')
  console.log(splitArray[1])
  const state = getState()
  const account = state.core.account
  const lobby: AbcLobby = await account.fetchLobby(splitArray[1]).catch((e) => {
    console.log('We have an eror')
    console.log(e)
  })
  console.log(lobby)
}
