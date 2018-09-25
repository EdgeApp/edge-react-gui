// @flow

import type { Action } from '../../../../../ReduxTypes.js'

export const xPubSyntax = (state: string = '', action: Action): string => {
  switch (action.type) {
    case 'OPEN_VIEWXPUB_WALLET_MODAL': {
      if (!action.data) throw new Error('Invalid action')
      return action.data.xPub || 'No public key for this wallet type'
    }

    case 'CLOSE_VIEWXPUB_WALLET_MODAL': {
      return ''
    }

    default:
      return state
  }
}
