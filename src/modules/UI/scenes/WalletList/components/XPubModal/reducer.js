// @flow

import type { Action } from '../../../../../ReduxTypes.js'

export const xPubSyntax = (state: string = '', action: Action) => {
  switch (action.type) {
    case 'OPEN_VIEWXPUB_WALLET_MODAL': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.xPub
    }

    case 'CLOSE_VIEWXPUB_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}
