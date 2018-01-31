// @flow

import type {State} from '../../ReduxTypes'

export const getReceiveAddress = (state: State) => {
  return state.ui.request.receiveAddress
}
