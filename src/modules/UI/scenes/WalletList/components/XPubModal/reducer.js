// @flow

import * as Constants from '../../../../../../constants/indexConstants'
import type { Action } from '../../../../../ReduxTypes.js'
import * as ACTION from '../WalletOptions/action.js'

export const xPubKeySyntax = (state: string = '', action: Action) => {
  switch (action.type) {
    case ACTION.OPEN_MODAL_VALUE(Constants.VIEW_XPUB_KEY_VALUE):
      if (action.data && action.data.xPubKey) {
        return action.data.xPubKey
      }
      return state
    case ACTION.CLOSE_MODAL_VALUE(Constants.VIEW_XPUB_KEY_VALUE):
      return ''
    default:
      return state
  }
}
