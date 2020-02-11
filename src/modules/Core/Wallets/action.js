// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import _ from 'lodash'

import type { Dispatch, GetState } from '../../../types/reduxTypes.js'
import { getReceiveAddresses } from '../../../util/utils.js'
import * as CORE_SELECTORS from '../selectors'

export const updateWalletsRequest = () => async (dispatch: Dispatch, getState: GetState) => {
  const state = getState()

  const account = CORE_SELECTORS.getAccount(state)
  const { activeWalletIds, archivedWalletIds, currencyWallets } = account
  return getReceiveAddresses(currencyWallets).then(receiveAddresses => {
    dispatch({
      type: 'CORE/WALLETS/UPDATE_WALLETS',
      data: {
        activeWalletIds,
        archivedWalletIds,
        currencyWallets,
        receiveAddresses
      }
    })
    return updateWalletsEnabledTokens(getState)
  })
}

export const updateWalletsEnabledTokens = (getState: GetState) => {
  const state = getState()
  const account = CORE_SELECTORS.getAccount(state)
  const { currencyWallets } = account
  for (const walletId: string of Object.keys(currencyWallets)) {
    const edgeWallet: EdgeCurrencyWallet = currencyWallets[walletId]
    if (edgeWallet.type === 'wallet:ethereum' || edgeWallet.type === 'wallet:rsk') {
      if (state.ui.wallets && state.ui.wallets.byId && state.ui.wallets.byId[walletId]) {
        const enabledTokens = state.ui.wallets.byId[walletId].enabledTokens
        const customTokens = state.ui.settings.customTokens
        const enabledNotHiddenTokens = enabledTokens.filter(token => {
          let isVisible = true // assume we will enable token
          const tokenIndex = _.findIndex(customTokens, item => item.currencyCode === token)
          // if token is not supposed to be visible, not point in enabling it
          if (tokenIndex > -1 && customTokens[tokenIndex].isVisible === false) isVisible = false
          return isVisible
        })
        edgeWallet.changeEnabledTokens(enabledNotHiddenTokens)
      }
    }
  }
}
